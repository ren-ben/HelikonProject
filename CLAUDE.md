# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Helikon is a CLIL (Content and Language Integrated Learning) material generator. It uses cloud-hosted LLM APIs to generate educational materials through a 5-step wizard in the frontend, with a Spring Boot backend that orchestrates generation and persists materials to PostgreSQL. The Python RAG service handles all LLM and embedding calls via LangChain; the provider is swappable by env var (cloud APIs now, local Ollama planned for a future dedicated server).

## Running the Stack

All three services must be running for full functionality:

```bash
# 1. Database (PostgreSQL + pgAdmin) — requires a .env file in the repo root
#    with POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_PORT
docker-compose up -d

# 2. Backend (Spring Boot) — from repo root
./mvnw spring-boot:run          # Windows: .\mvnw.cmd spring-boot:run
# Runs on port 8081

# 3. Frontend (Vue 3 / Vite) — from clil-frontend/
cd clil-frontend
npm install
npm run dev                     # Runs on port 5173 (Vite default)
```

**Current state (post-Phase 7b):** Phases 1–7b are complete. Full auth flow works end-to-end: frontend Login/Register → JWT tokens → protected API calls. Generation goes through `RagProxyService` → Python RAG service → cloud LLM API, with optional RAG-augmented generation using uploaded document context (subject-filtered). Document upload with subject tagging, RAG query with subject filtering, and admin panel are functional. Per-user subjects are stored in PostgreSQL (`Subject` entity) with lazy default seeding, manageable from Settings → "Meine Fächer". Legacy Ollama code has been removed.

## Build Commands

```bash
# Backend
./mvnw clean package            # Compile + test + package JAR
./mvnw compile                  # Compile only

# Frontend
cd clil-frontend
npm run build                   # Production build (dist/)
npm run preview                 # Preview the production build locally
```

## Testing

```bash
# Backend (JUnit 5 via Maven)
./mvnw test                     # Run all tests
./mvnw test -Dtest="ClilApplicationTests" -pl .   # Run a single test class

# Frontend
# No test framework is currently configured (package.json test script is a stub).
```

## Architecture

### Backend — `src/main/java/at/technikum/clil/`

Standard Spring Boot layered architecture:

- **Controllers** — `ClilController` (`/api/v1/clil`) for generation + material CRUD; `AuthController` (`/api/v1/auth`) for register/login/refresh; `SubjectController` (`/api/v1/clil/subjects`) for per-user subject CRUD.
- **Security** (`security/`) — JWT-based stateless auth. `JwtService` (jjwt 0.12.6), `JwtAuthenticationFilter` (OncePerRequestFilter), `UserDetailsServiceImpl`. Config in `config/SecurityConfig`. All `/api/**` except `/api/v1/auth/**` require auth.
- **Service layer** — `RagProxyService` (proxies generation + models to Python via WebClient), `MaterialService` (CRUD with `User` owner param for ownership isolation), `AuthService` (register/login/refresh), `SubjectService` (per-user subject list with lazy default seeding).
- **DTOs** (`dto/`) — `MaterialRequest` for generation; `MaterialCreateRequest` / `MaterialUpdateRequest` for persistence; `dto/auth/` subpackage for auth request/response types.
- **Entities** — `LessonMaterial` (JPA, `@ElementCollection` for tags, `@ManyToOne User owner`), `User` (implements `UserDetails`, `@ElementCollection` for roles), `Subject` (per-user subject list, unique constraint on `(name, owner_id)`, lazy-seeded with 12 defaults on first access), `Role` enum (USER, ADMIN). Schema in `schema.sql`; Hibernate `ddl-auto=update`.

### Frontend — `clil-frontend/src/`

Vue 3 SPA with Vuetify 3 component library and Pinia state management:

- **Router** (`router/index.js`) — all route components are lazy-loaded. `/materials` has a nested child route for detail view. Auth guard: routes with `meta.requiresAuth` redirect to `/login` if no token. Login/Register use `meta.noLayout` to bypass `AppLayout`.
- **Pinia stores** (`stores/`):
  - `auth.js` — auth state (user, tokens), actions (login, register, logout, refresh, initialize from localStorage). Tokens persist in localStorage.
  - `materials.js` — central store for the materials list. All views read/write through this store; it calls the API service layer.
  - `ui.js` — tracks UI state (theme, sidebar, last created/edited material — used for post-action redirects).
  - `notifications.js` — in-memory notification history (add/markRead/markAllRead/remove/clear). Bell icon in `AppLayout` shows unread badge + dropdown panel. Triggers fire from document upload/delete, material generation/save/edit.
  - `subjects.js` — per-user subject list from PostgreSQL. Fetched on app mount (AppLayout). Actions: fetchSubjects, addSubject, deleteSubject. Falls back to static defaults if API fails. Used by all subject comboboxes. Managed in Settings → "Meine Fächer".
- **API layer** (`services/deepinfra-api.js`) — Axios client for `/api/v1/clil`. Attaches JWT from localStorage on every request. 401 response interceptor attempts token refresh (via `authService.js`) with request queuing, then redirects to `/login` on failure. `authService.js` is a separate Axios client for `/api/v1/auth` endpoints. Type mapping (`typeMap`/`reverseTypeMap`) translates frontend English keys to German DB strings.
- **Views** — the bulk of the app logic. `CreateMaterial.vue` (~1000 lines) implements the 5-step generation wizard. `MaterialsGrid.vue` (~1300 lines) is the main materials list/table.
- **Editor** (`components/Editor/`) — TipTap rich-text editor used in `EditMaterial.vue`, with custom extensions for language help and vocabulary highlighting.
- **Export** (`components/ExportDialog.vue`) — handles PDF (jspdf + html2canvas) and DOCX (docx library) export.

### Data Flow: Generation

1. User fills out the 5-step wizard in `CreateMaterial.vue`.
2. Wizard calls `materialsStore.generateMaterial()` → `deepinfra-api.generateMaterial()`.
3. API client POSTs to backend `/api/v1/clil/generate` with the `MaterialRequest` payload (includes the chosen model name).
4. `ClilController` delegates to `RagProxyService` → Python RAG service → cloud LLM API (OpenAI / Groq), with the Bloom's Taxonomy system prompt assembled by LangChain.
5. The generated HTML response comes back to the frontend; the user can review and save it, which POSTs to `/api/v1/clil/materials` to persist via `MaterialService`.

### Data Flow: CRUD

Saved materials live in PostgreSQL. The frontend fetches them all via `GET /materials` (returned ordered by `createdAt DESC`). Individual materials are fetched/updated/deleted via the `/{id}` endpoints. The Pinia `materials` store caches the list client-side and updates it optimistically on create/update/delete.

## Key Configuration Points

| What | Where | Default |
|---|---|---|
| Backend port | `src/main/resources/application.properties` | 8081 |
| DB credentials | `docker-compose.yml` env vars (from `.env`) | clil_user / clil_pass / clil_db |
| LLM provider | `rag-service/.env` `LLM_PROVIDER` | openai |
| LLM API key | `rag-service/.env` `LLM_API_KEY` | (set in .env, never commit) |
| LLM model | `rag-service/.env` `LLM_MODEL` | gpt-4o-mini |
| Embedding API key | `rag-service/.env` `EMBEDDING_API_KEY` | (same key as LLM if using OpenAI) |
| Generation timeout | `application.properties` `spring.mvc.async.request-timeout` | 180000 ms |
| Frontend API base URL | `clil-frontend/src/services/deepinfra-api.js` `API_CONFIG.baseURL` | http://localhost:8081/api/v1/clil |
| Vuetify theme | `clil-frontend/src/plugins/vuetify.js` | Primary: #3f51b5 (Indigo) |
| JWT secret | `application.properties` `jwt.secret` / `JWT_SECRET` env | Base64-encoded dev key |
| JWT access TTL | `jwt.expiration-ms` / `JWT_EXPIRATION_MS` | 86400000 (24h) |
| JWT refresh TTL | `jwt.refresh-expiration-ms` / `JWT_REFRESH_EXPIRATION_MS` | 604800000 (7d) |

## Roadmap & Scope

Phases 1–7b are complete (Docker, RAG service, auth, proxy generation, frontend auth, document upload + RAG query, admin panel, RAG-augmented generation with subject tagging). The remaining objectives are planned in the phases below.

### Target architecture (two-backend split)

```
Browser
  │
  ▼
nginx (HTTPS, reverse proxy)
  ├── / ─────────────►  Vue frontend (static, served by nginx)
  ├── /api/v1/clil/* ►  Spring Boot  ←── PostgreSQL (users, materials, upload metadata)
  │                        │
  │                        │ (internal, JWT-verified user context forwarded)
  │                        ▼
  └── (internal only)  ► Python FastAPI (LangChain)
                            ├── ChromaDB (embedded, persistent volume)
                            ├── Cloud embedding API  (OpenAI text-embedding-3-small)
                            └── Cloud LLM API        (OpenAI / Groq — swappable via env)
```

- **Spring Boot** is the public API gateway: handles auth (JWT), material CRUD, and proxies all generation/RAG/upload requests to the Python service after verifying the token.
- **Python FastAPI** is internal-only (not exposed through nginx to clients). It owns: document ingestion, chunking, embedding via cloud API, ChromaDB storage, semantic retrieval, and LLM generation via LangChain + cloud API. All provider choices are env-var-driven; swapping to local Ollama later is a config change, no code change.
- **ChromaDB** runs embedded inside the Python service process with a Docker volume for persistence. Each chunk is tagged with `user_id` metadata; retrieval filters on this for data isolation.
- **Generation has two modes** that coexist:
  1. *Parametric generation* (existing 5-step wizard) — no retrieval, just prompt → cloud LLM API. Moves to Python service but keeps the same user-facing flow.
  2. *RAG query* (new) — user uploads documents → chunks are embedded via cloud embedding API → query triggers retrieval → cloud LLM API generates answer grounded in retrieved context.
- **LLM provider strategy:** OpenAI is the default (`gpt-4o-mini` for generation, `text-embedding-3-small` for embeddings — one API key covers both). Groq is a free-tier alternative for development. When a GPU server is available, both swap to local Ollama + a small local embedding model with zero code changes.

### Phase checklist

| # | Phase | Prerequisites | Key deliverables |
|---|---|---|---|
| 1 | Dockerize all services | — | Dockerfiles for Spring Boot, frontend, RAG service; updated docker-compose; nginx config. **No Ollama container** — LLM calls go to cloud API. |
| 2 | Python RAG service | Phase 1 | `rag-service/` with ingest, query, generate endpoints; ChromaDB + cloud embeddings + LangChain; LLM via OpenAI/Groq |
| 3 | Auth & user management | Phase 1 | Spring Security + JWT; `User`/`Role` entities; `owner_id` on materials; auth endpoints |
| 4 | Proxy generation to Python | Phase 2, 3 | `RagProxyService` in Spring Boot; `/generate` and `/models` routed through Python |
| 5 | Frontend auth | Phase 3 | Auth Pinia store; Login/Register views; JWT interceptor; route guards |
| 6 | Document upload + RAG query UI | Phase 4, 5 | Upload view with drag-and-drop; query view; new API methods in deepinfra-api |
| 7 | Admin panel | Phase 5, 6 | Admin view (user mgmt, system status); `AdminController` in Spring Boot |
| 7b | RAG-augmented generation | Phase 6, 7 | Subject tagging on document uploads; "use document context" toggle in generation wizard; subject-filtered retrieval in query view; paginated documents table (`v-data-table`) with subject chip-filter |
| 8 | Security hardening | Phase 3–7b | Lock CORS; rate-limit auth; file validation; remove debug logs |
| 9 | Testing | Phase 4–8 | Unit + integration tests (Spring Boot + Python); frontend Vitest setup; E2E coverage |

### What exists now vs. what's needed

| Exists (Phases 1–7b) | Needs to be added |
|---|---|
| Docker infrastructure (5 containers, nginx proxy) | — |
| Python RAG service (generate, ingest, query, documents, models) with RAG-augmented generation + subject filtering | — |
| Spring Security + JWT, `RagProxyService`, material CRUD with ownership, `DocumentController`, `AdminController` | — |
| Vue frontend: auth, material wizard + CRUD, documents view (with subject tagging), query view (with subject filter), admin view, "use document context" toggle in generation wizard | Security hardening, tests |

### Lightsail deployment notes (2 GB / 2 vCPU / 60 GB SSD)

- **No local LLM or embedding model runs on this instance.** All inference goes to cloud APIs (OpenAI / Groq). This keeps the resident memory well within 2 GB: PostgreSQL (~200 MB), Spring Boot JVM (~300 MB), Python + ChromaDB (~250 MB), nginx (~30 MB).
- ChromaDB vectors persist on the 60 GB SSD via a Docker volume — the only heavyweight local store.
- API keys (`LLM_API_KEY`, `EMBEDDING_API_KEY`) live in `.env` on the instance, never in the repo.
- When the project moves to a dedicated GPU server, swap `LLM_PROVIDER=openai` → `LLM_PROVIDER=ollama` and point `OLLAMA_URL` at the local instance. Add a small local embedding model (e.g. `all-MiniLM-L6-v2`, 90 MB) to replace the cloud embedding call. No code changes required — LangChain abstracts the provider.
- Let's Encrypt certs via nginx for HTTPS; renew via certbot or manually.

## Notable Conventions

- **German strings in the DB** — material types are stored in German (`Arbeitsblatt`, `Quiz`, `Glossar`, `Präsentation`, `Grafik`, `Video-Skript`). The frontend's `typeMap` / `reverseTypeMap` in `deepinfra-api.js` handles the translation. When adding a new material type, update both maps.
- **Code comments are in German** — much of the frontend source has German comments; keep this consistent when editing those files.
- **`@/` path alias** — configured in `vite.config.js` to resolve to `clil-frontend/src/`.
- **Synchronous controllers, reactive services** — `RagProxyService` and `DocumentProxyService` use `WebClient` + `Mono` internally, but **controllers must call `.block()` and return plain `ResponseEntity`**. See "Known Pitfalls" below for why.
- **pgAdmin** is available at `http://localhost:5050` (login: admin@admin.com / admin) after `docker-compose up`.

## Known Pitfalls

### Do NOT return `Mono<ResponseEntity<...>>` from Spring MVC controllers

This project runs on Spring MVC (servlet-based), not Spring WebFlux. Returning `Mono` from a `@RestController` method triggers Servlet 3.0+ async dispatch. Spring Security's `SecurityContext` (set by `JwtAuthenticationFilter`) is not reliably propagated across the async dispatch boundary. The result: the backend authenticates the request successfully (JWT filter logs confirm it), but the response that reaches the browser is `401 Unauthorized` — because the `AuthorizationFilter` re-runs on the async dispatch without a security context.

**Symptoms:** Synchronous endpoints (`/materials`) return 200, while `Mono`-returning endpoints (`/models`, `/generate`) return 401 or 502 — even with a valid JWT and identical interceptor logic on the frontend.

**Fix:** Service classes (`RagProxyService`, `DocumentProxyService`) keep their reactive `Mono`-based WebClient calls. Controllers call `.block(Duration)` and return plain `ResponseEntity<T>`. This keeps the entire request on the servlet thread where Spring Security's `ThreadLocal`-based context lives.

```java
// WRONG — triggers async dispatch, breaks Spring Security context
@GetMapping("/models")
public Mono<ResponseEntity<List<String>>> getModels() { ... }

// CORRECT — blocks on the Mono, stays on the servlet thread
@GetMapping("/models")
public ResponseEntity<List<String>> getModels() {
    List<String> models = ragProxyService.listAvailableModels()
            .block(Duration.ofSeconds(30));
    return ResponseEntity.ok(models);
}
```

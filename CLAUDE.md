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

**Current state (pre-Phase 2):** generation still goes directly through `OllamaService` in Spring Boot, so Ollama must be running locally. Once the Python RAG service is wired in (Phase 4), Ollama is replaced by a cloud LLM API key — no local model needed. The `.env` file will hold `LLM_PROVIDER`, `LLM_API_KEY`, and `EMBEDDING_API_KEY`.

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

- **Controller** (`ClilController`) — single REST controller mounted at `/api/v1/clil`. Handles CORS. Endpoints: `GET /models`, `POST /generate`, and CRUD on `/materials` and `/materials/{id}`.
- **Service layer** — three services:
  - `OllamaService` — **legacy; will be retired after Phase 4.** Currently communicates with a local Ollama instance via `WebClient` / `Mono<T>`. Once the Python RAG service is wired in, a new `RagProxyService` replaces this for all generation calls.
  - `MaterialService` — CRUD logic around `LessonMaterialRepository`.
  - `PromptService` — loads the Bloom's Taxonomy system prompt from `src/main/resources/prompts/bloom-taxonomy-prompt.txt` at startup. This prompt is prepended to every generation request.
- **DTOs** (`dto/`) — separate request/response records for the API contract. `MaterialRequest` is for generation; `MaterialCreateRequest` / `MaterialUpdateRequest` are for persistence.
- **Entity** (`LessonMaterial`) — JPA entity with a `@ElementCollection` for tags. Schema is in `src/main/resources/schema.sql`; Hibernate is set to `ddl-auto=update`.

### Frontend — `clil-frontend/src/`

Vue 3 SPA with Vuetify 3 component library and Pinia state management:

- **Router** (`router/index.js`) — all route components are lazy-loaded. `/materials` has a nested child route for detail view.
- **Pinia stores** (`stores/`):
  - `materials.js` — central store for the materials list. All views read/write through this store; it calls the API service layer.
  - `ui.js` — tracks UI state (theme, sidebar, last created/edited material — used for post-action redirects).
- **API layer** (`services/deepinfra-api.js`) — the single Axios client that talks to the backend. Contains a **type mapping** (`typeMap`) that translates frontend English keys (`worksheet`, `quiz`, etc.) to German strings (`Arbeitsblatt`, `Quiz`, etc.) before sending to the backend, and a `reverseTypeMap` for responses. This is the source of truth for material-type values across the app.
- **Views** — the bulk of the app logic. `CreateMaterial.vue` (~1000 lines) implements the 5-step generation wizard. `MaterialsGrid.vue` (~1300 lines) is the main materials list/table.
- **Editor** (`components/Editor/`) — TipTap rich-text editor used in `EditMaterial.vue`, with custom extensions for language help and vocabulary highlighting.
- **Export** (`components/ExportDialog.vue`) — handles PDF (jspdf + html2canvas) and DOCX (docx library) export.

### Data Flow: Generation

1. User fills out the 5-step wizard in `CreateMaterial.vue`.
2. Wizard calls `materialsStore.generateMaterial()` → `deepinfra-api.generateMaterial()`.
3. API client POSTs to backend `/api/v1/clil/generate` with the `MaterialRequest` payload (includes the chosen model name).
4. **Current (pre-Phase 4):** `ClilController` delegates to `OllamaService` → local Ollama. **After Phase 4:** delegates to `RagProxyService` → Python RAG service → cloud LLM API (OpenAI / Groq), with the Bloom's Taxonomy system prompt assembled by LangChain.
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

## Roadmap & Scope

The current codebase is a working MVP covering material generation via Ollama and CRUD persistence. The remaining objectives — vector database, RAG pipeline, document upload, user/access management, full dockerization, and Lightsail deployment — are planned in the phases below. All phases are dependency-ordered: do not start a later phase before its prerequisites are done.

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
| 8 | Security hardening | Phase 3–7 | Lock CORS; rate-limit auth; file validation; remove debug logs |
| 9 | Testing | Phase 4–8 | Unit + integration tests (Spring Boot + Python); frontend Vitest setup; E2E coverage |

### What exists now vs. what's needed

| Exists | Needs to be added |
|---|---|
| Spring Boot CRUD + Ollama proxy | Auth (Spring Security + JWT), `User` entity, `owner_id` on materials, `RagProxyService`, `DocumentController`, `AdminController` |
| Vue frontend with material wizard | Login/Register views, auth store + interceptor, route guards, Documents view, Query view, Admin view |
| PostgreSQL schema (`lesson_materials`) | `users` table, `uploaded_documents` table, `owner_id` FK on `lesson_materials` |
| docker-compose (PostgreSQL only) | Dockerfiles for all services, nginx reverse proxy, RAG service container (no Ollama container) |
| Ollama integration (direct from Java) | Move all LLM calls to Python via LangChain + cloud API; `OllamaService` retired, `RagProxyService` added |
| — | `rag-service/` directory: FastAPI app, ChromaDB, cloud embeddings (OpenAI), LangChain chains, ingest/query/generate routes |

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
- **Reactive backend calls** — `OllamaService` (legacy) and the future `RagProxyService` use Project Reactor (`Mono`) and `WebClient`. Keep all new backend-to-service calls reactive.
- **pgAdmin** is available at `http://localhost:5050` (login: admin@admin.com / admin) after `docker-compose up`.

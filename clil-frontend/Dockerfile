# ─── Stage 1: Build Vue app ──────────────────────────────────
# Build context is the repo root (set in docker-compose).
FROM node:20-alpine AS builder
WORKDIR /app

# Cache npm install — only re-runs when package files change.
# Glob covers package-lock.json when it exists; npm install works either way.
COPY clil-frontend/package*.json ./
RUN npm install

# Copy frontend source and build production bundle
COPY clil-frontend/ .
RUN npm run build

# ─── Stage 2: Serve with nginx ────────────────────────────────
# This container serves the Vue static files AND reverse-proxies
# /api/ requests to Spring Boot — it is the only service with
# ports exposed to the host.
FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf   /etc/nginx/conf.d/default.conf

EXPOSE 80 443

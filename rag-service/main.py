"""
Helikon RAG Service — skeleton (Phase 1).

Phase 2 adds:
    POST   /rag/ingest          upload + chunk + embed documents
    POST   /rag/query           RAG query  (retrieve → generate)
    POST   /rag/generate        parametric material generation
    GET    /rag/documents       list user's uploaded documents
    DELETE /rag/documents/{id}  remove a document + its chunks
    GET    /rag/models          available LLM models for the configured provider
"""

from fastapi import FastAPI

app = FastAPI(title="Helikon RAG Service", version="0.1.0-skeleton")


@app.get("/health")
def health():
    return {"status": "ok", "service": "rag"}

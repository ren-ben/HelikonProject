"""
Helikon RAG Service

Endpoints (all under /rag prefix):
    POST   /rag/generate        parametric CLIL-material generation
    POST   /rag/ingest          upload + chunk + embed documents
    POST   /rag/query           RAG query  (retrieve → generate)
    GET    /rag/documents       list user's uploaded documents
    DELETE /rag/documents       remove documents + their chunks
    GET    /rag/models          available LLM models for the configured provider
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Validate API keys and warm up the vector store before accepting traffic."""
    # key validation
    missing = []
    if not settings.llm_api_key:
        missing.append("LLM_API_KEY")
    if not settings.embedding_api_key:
        missing.append("EMBEDDING_API_KEY")
    if missing:
        raise RuntimeError(
            f"RAG service cannot start. missing env vars: {', '.join(missing)}"
        )

    # warm up ChromaDB (creates persistent dir if needed)
    from vector_store import get_collection, get_vectorstore
    get_collection()
    get_vectorstore()

    yield


app = FastAPI(title="Helikon RAG Service", version="0.2.0", lifespan=lifespan)

# health (no prefix)
@app.get("/health")
def health():
    return {"status": "ok", "service": "rag"}


# route modules
from routes.generate   import router as generate_router
from routes.ingest     import router as ingest_router
from routes.query      import router as query_router
from routes.documents  import router as documents_router
from routes.models     import router as models_router

app.include_router(generate_router,   prefix="/rag")
app.include_router(ingest_router,     prefix="/rag")
app.include_router(query_router,      prefix="/rag")
app.include_router(documents_router,  prefix="/rag")
app.include_router(models_router,     prefix="/rag")

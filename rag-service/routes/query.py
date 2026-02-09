from fastapi import APIRouter
from pydantic import BaseModel

from generation import rag_generate

router = APIRouter()


class QueryRequest(BaseModel):
    query: str
    user_id: str
    top_k: int = 5
    subject: str | None = None


@router.post("/query")
def query(req: QueryRequest):
    """RAG query: retrieve relevant chunks → generate answer with context."""
    return rag_generate(
        query=req.query,
        user_id=req.user_id,
        top_k=req.top_k,
        subject=req.subject,
    )

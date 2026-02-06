from collections import defaultdict

from fastapi import APIRouter, Query
from pydantic import BaseModel

from vector_store import get_collection

router = APIRouter()


@router.get("/documents")
def list_documents(user_id: str = Query(...)):
    """List all documents (collapsed by doc_id) belonging to *user_id*."""
    collection = get_collection()

    # ChromaDB get() with where filter returns all matching chunks
    results = collection.get(where={"user_id": user_id})

    # Collapse chunks → one entry per doc_id
    docs: dict[str, dict] = {}
    for meta in results["metadatas"] or []:
        doc_id = meta["doc_id"]
        if doc_id not in docs:
            docs[doc_id] = {
                "doc_id": doc_id,
                "filename": meta.get("filename", ""),
                "uploaded_at": meta.get("uploaded_at", ""),
                "chunk_count": 0,
            }
        docs[doc_id]["chunk_count"] += 1

    return list(docs.values())


class DeleteRequest(BaseModel):
    doc_ids: list[str]


@router.delete("/documents")
def delete_documents(req: DeleteRequest):
    """Delete all chunks belonging to the given doc_ids."""
    collection = get_collection()
    deleted = 0
    for doc_id in req.doc_ids:
        # ChromaDB delete with where filter
        collection.delete(where={"doc_id": doc_id})
        deleted += 1
    return {"deleted": deleted}

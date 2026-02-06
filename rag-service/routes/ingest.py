import json

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from ingestion import ingest_document

router = APIRouter()

_ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}


@router.post("/ingest")
async def ingest(
    file: UploadFile = File(...),
    metadata: str = Form("{}"),
):
    """Upload a document, chunk it, embed and store in ChromaDB.

    Form fields:
        file      – the binary file (.pdf / .docx / .txt)
        metadata  – JSON string, must contain at least ``user_id``
    """
    # ── validate extension ────────────────────────────────────────────────
    filename = file.filename or ""
    ext = ("." + filename.rsplit(".", 1)[-1].lower()) if "." in filename else ""
    if ext not in _ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {sorted(_ALLOWED_EXTENSIONS)}",
        )

    # ── parse metadata JSON ──────────────────────────────────────────────
    try:
        meta: dict = json.loads(metadata)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="metadata must be valid JSON")

    user_id: str = meta.pop("user_id", "")
    if not user_id:
        raise HTTPException(status_code=400, detail="metadata.user_id is required")

    # ── run ingest pipeline ──────────────────────────────────────────────
    file_bytes = await file.read()
    result = ingest_document(
        file_bytes=file_bytes,
        filename=filename,
        user_id=user_id,
        metadata=meta,
    )
    return result

import json
import logging

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from ingestion import ingest_document

router = APIRouter()
log = logging.getLogger(__name__)

_ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
_MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB

# Magic bytes for file-type verification
_MAGIC_BYTES = {
    ".pdf": b"%PDF",
    ".docx": b"PK",  # DOCX is a ZIP archive
}


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

    # ── read file + enforce size limit ───────────────────────────────────
    file_bytes = await file.read()
    if len(file_bytes) > _MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({len(file_bytes) // (1024*1024)} MB). Maximum is 20 MB.",
        )

    # ── magic-byte validation ────────────────────────────────────────────
    expected_magic = _MAGIC_BYTES.get(ext)
    if expected_magic and not file_bytes[:len(expected_magic)].startswith(expected_magic):
        raise HTTPException(
            status_code=400,
            detail=f"File content does not match expected '{ext}' format.",
        )
    if ext == ".txt":
        try:
            file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=400,
                detail="Text file is not valid UTF-8.",
            )

    # ── run ingest pipeline ──────────────────────────────────────────────
    try:
        result = ingest_document(
            file_bytes=file_bytes,
            filename=filename,
            user_id=user_id,
            metadata=meta,
        )
    except Exception as e:
        log.error("Ingestion failed for '%s': %s", filename, e)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process file: {e}",
        )
    return result

import io
import uuid
from datetime import datetime, timezone

from langchain_core.documents import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter

from vector_store import get_vectorstore

_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)


# Text extraction

def extract_text(file_bytes: bytes, filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext == "pdf":
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    if ext == "docx":
        from docx import Document as DocxDocument
        doc = DocxDocument(io.BytesIO(file_bytes))
        return "\n".join(p.text for p in doc.paragraphs)

    if ext == "txt":
        return file_bytes.decode("utf-8")

    raise ValueError(f"Unsupported file type: .{ext}  (allowed: .pdf, .docx, .txt)")


# Ingest pipeline

def ingest_document(
    file_bytes: bytes,
    filename: str,
    user_id: str,
    metadata: dict | None = None,
) -> dict:
    """Extract, chunk, embed, store. Returns {doc_id, chunk_count, filename}."""
    text = extract_text(file_bytes, filename)
    chunks = _splitter.split_text(text)

    doc_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    # chroma metadata values must be str, int, float, bool.
    # flat any list fields
    base_meta: dict = {
        "user_id": user_id,
        "doc_id": doc_id,
        "filename": filename,
        "uploaded_at": now,
    }
    if metadata:
        for key, val in metadata.items():
            base_meta[key] = ",".join(val) if isinstance(val, list) else val

    documents = [
        Document(
            page_content=chunk,
            metadata={**base_meta, "chunk_index": i},
        )
        for i, chunk in enumerate(chunks)
    ]

    get_vectorstore().add_documents(documents)

    return {"doc_id": doc_id, "chunk_count": len(chunks), "filename": filename}

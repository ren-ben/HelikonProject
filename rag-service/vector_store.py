import chromadb
from langchain_community.vectorstores import Chroma

from config import settings
from embeddings import get_embeddings

_COLLECTION_NAME = "helikon_docs"

# lazy singletons
_client: chromadb.ClientAPI | None = None
_collection: chromadb.Collection | None = None
_vectorstore: Chroma | None = None


def _get_client() -> chromadb.ClientAPI:
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=settings.chromadb_path)
    return _client


def get_collection() -> chromadb.Collection:
    """Raw ChromaDB collection used for delete/list operations."""
    global _collection
    if _collection is None:
        _collection = _get_client().get_or_create_collection(
            name=_COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def get_vectorstore() -> Chroma:
    """LangChain chroma wrapper used for add/similarity-search."""
    global _vectorstore
    if _vectorstore is None:
        _vectorstore = Chroma(
            client=_get_client(),
            collection_name=_COLLECTION_NAME,
            embedding_function=get_embeddings(),
            collection_metadata={"hnsw:space": "cosine"},
        )
    return _vectorstore

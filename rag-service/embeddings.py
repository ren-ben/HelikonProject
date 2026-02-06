from langchain_openai import OpenAIEmbeddings

from config import settings


def get_embeddings() -> OpenAIEmbeddings:
    """Always uses OpenAI text-embedding-3-small regardless of LLM provider."""
    return OpenAIEmbeddings(
        model="text-embedding-3-small",
        api_key=settings.embedding_api_key,
    )

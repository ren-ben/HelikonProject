from config import settings
from langchain_ollama import OllamaEmbeddings
from langchain_openai import OpenAIEmbeddings


def get_embeddings():
    """
    Return embedding function based on provider.
    For Ollama, uses local embedding model.
    For OpenAI/Groq, uses OpenAI embeddings.
    """
    provider = settings.llm_provider.lower()

    if provider == "ollama":
        # Use Ollama for embeddings (local, no API key needed)
        embedding_model = getattr(settings, 'ollama_embedding_model', 'nomic-embed-text')

        print(f"📚 Using Ollama Embeddings: {embedding_model} @ {settings.ollama_url}")

        return OllamaEmbeddings(
            model=embedding_model,
            base_url=settings.ollama_url,
        )
    else:
        # Use OpenAI for embeddings (needs API key)
        if not settings.embedding_api_key:
            raise ValueError(
                "EMBEDDING_API_KEY is required when not using Ollama. "
                "Set LLM_PROVIDER=ollama to use local embeddings."
            )

        return OpenAIEmbeddings(
            api_key=settings.embedding_api_key,
            model="text-embedding-3-small"
        )

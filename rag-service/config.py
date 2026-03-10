from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # LLM Configuration
    llm_provider: str = "ollama"
    llm_api_key: str = ""
    llm_model: str = "llama3"

    ollama_url: str = "http://host.docker.internal:11434"
    ollama_embedding_model: str = "nomic-embed-text"

    embedding_api_key: str = ""

    chromadb_path: str = "./data/chromadb"

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()

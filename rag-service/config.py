from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    llm_provider: str = "openai"
    llm_api_key: str = ""
    llm_model: str = "gpt-4o-mini"

    ollama_url: str = "http://host.docker.internal:11434"

    embedding_api_key: str = ""

    chromadb_path: str = "./data/chromadb"

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()

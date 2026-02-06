from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    llm_provider: str = "openai"
    llm_api_key: str = ""
    llm_model: str = "gpt-4o-mini"
    embedding_api_key: str = ""
    chromadb_path: str = "/data/chromadb"

    model_config = {"env_file": ".env"}


settings = Settings()

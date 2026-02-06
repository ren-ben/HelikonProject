from fastapi import APIRouter

from config import settings
from llm import PROVIDER_MODELS

router = APIRouter()


@router.get("/models")
def list_models():
    """Return the available model names for the currently configured provider."""
    provider = settings.llm_provider.lower()
    models = PROVIDER_MODELS.get(provider, [])
    return {"provider": provider, "models": models}

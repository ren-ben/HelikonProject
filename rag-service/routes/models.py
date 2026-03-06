from fastapi import APIRouter

from config import settings
from llm import PROVIDER_MODELS
import requests
router = APIRouter()



@router.get("/models")
def list_models():
    """Return available models, dynamically from Ollama or static from config."""
    provider = settings.llm_provider.lower()

    if provider == "ollama":
        try:
            ollama_url = getattr(settings, 'ollama_base_url', 'http://localhost:11434')
            response = requests.get(f"{ollama_url}/api/tags", timeout=3)

            if response.status_code == 200:
                data = response.json()
                if "models" in data:
                    model_names = [m["name"] for m in data["models"] if "name" in m]
                    return {"provider": provider, "models": sorted(model_names)}
        except:
            pass  

    models = PROVIDER_MODELS.get(provider, [])
    return {"provider": provider, "models": models}

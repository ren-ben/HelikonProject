from config import settings

PROVIDER_MODELS: dict[str, list[str]] = {
    "openai": ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
    "ollama": ["llama3","deepseek-r1","mistral"],
}

_LLM_PARAMS = {"temperature": 0.7, "max_tokens": 2048, "top_p": 0.9}


def get_llm(model_name: str | None = None, temperature: float | None = None):
    """
    Return a LangChain chat model for the configured provider.

    Args:
        model_name: Override default model
        temperature: Override temperature (e.g. 0.0 for verify phase)
    """
    provider = settings.llm_provider.lower()
    model = model_name or settings.llm_model
    temp = temperature if temperature is not None else _LLM_PARAMS["temperature"]
    if provider == "ollama":
        from langchain_ollama import ChatOllama
        return ChatOllama(
            model=model,
            base_url=settings.ollama_url,
            temperature=temp,
            num_predict=_LLM_PARAMS.get("max_tokens", 2048),
        )

    if provider == "openai":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=model,
            api_key=settings.llm_api_key,
            temperature=temp,
            max_tokens=_LLM_PARAMS["max_tokens"],
        )


def _get_verify_llm(preferred_model: str | None, fallback_model: str | None, temperature: float = 0.0):
    """Try to use preferred_model (llama3) for verify phase, fall back to fallback_model."""
    available = PROVIDER_MODELS.get(settings.llm_provider.lower(), [])

    if preferred_model in available:
        model = preferred_model
    else:
        model = fallback_model or settings.llm_model

    return get_llm(model, temperature=temperature)

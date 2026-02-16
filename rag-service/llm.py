from config import settings

PROVIDER_MODELS: dict[str, list[str]] = {
    "openai": ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
    "ollama": ["llama3"],
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
    allowed = PROVIDER_MODELS.get(provider)

    if allowed is None:
        raise ValueError(f"Unsupported LLM provider: {provider}")

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

    if model not in allowed:
        raise ValueError(
            f"Model '{model}' not available for '{provider}'. Allowed: {allowed}"
        )

    if provider == "openai":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=model,
            api_key=settings.llm_api_key,
            temperature=temp,
            max_tokens=_LLM_PARAMS["max_tokens"],
        )


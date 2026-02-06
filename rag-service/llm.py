from config import settings

PROVIDER_MODELS: dict[str, list[str]] = {
    "openai": ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
    "groq":   ["llama3-8b-8192", "llama3-70b-8192", "mixtral-8x7b-32768"],
}

_LLM_PARAMS = {"temperature": 0.7, "max_tokens": 2048, "top_p": 0.9}


def get_llm(model_name: str | None = None):
    """Return a LangChain chat model for the configured provider.
    """
    provider = settings.llm_provider.lower()
    allowed = PROVIDER_MODELS.get(provider)
    if allowed is None:
        raise ValueError(f"Unsupported LLM provider: {provider}")

    model = model_name or settings.llm_model
    if model not in allowed:
        raise ValueError(
            f"Model '{model}' is not available for provider '{provider}'. "
            f"Allowed: {allowed}"
        )

    if provider == "openai":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(model=model, api_key=settings.llm_api_key, **_LLM_PARAMS)

    # provider == "groq"
    from langchain_groq import ChatGroq
    return ChatGroq(model=model, api_key=settings.llm_api_key, **_LLM_PARAMS)

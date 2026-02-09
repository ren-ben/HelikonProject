import pathlib

from langchain_core.messages import SystemMessage, HumanMessage

from llm import get_llm
from vector_store import get_vectorstore

# load system prompt & save in cache
_PROMPT_PATH = pathlib.Path(__file__).parent / "prompts" / "bloom_taxonomy.txt"
_SYSTEM_PROMPT: str | None = None


def _load_system_prompt() -> str:
    global _SYSTEM_PROMPT
    if _SYSTEM_PROMPT is None:
        _SYSTEM_PROMPT = _PROMPT_PATH.read_text(encoding="utf-8")
    return _SYSTEM_PROMPT


# Exact HTML-formatting suffix
_HTML_SUFFIX = (
    "\n\nIMPORTANT: Please format your response using proper HTML tags for better "
    "presentation. Use headings (<h1>, <h2>, <h3>), paragraphs (<p>), lists "
    "(<ul>, <ol>, <li>), emphasis (<strong>, <em>), and other appropriate HTML "
    "elements. Please provide a well-structured HTML response that can be "
    "directly rendered in a web application."
)


def _build_filter(user_id: str, subject: str | None = None) -> dict:
    """Build a ChromaDB where-filter, optionally scoped to a subject."""
    if subject:
        return {"$and": [{"user_id": user_id}, {"subject": subject}]}
    return {"user_id": user_id}


# Parametric generation (no retrieval)

def parametric_generate(
    user_prompt: str,
    model_name: str | None = None,
) -> str:
    """Generate material using system prompt.

    Returns raw HTML that becomes a formattedResponse.
    """
    system_prompt = _load_system_prompt()
    enhanced_prompt = user_prompt + _HTML_SUFFIX

    llm = get_llm(model_name)
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=enhanced_prompt),
    ])
    return response.content


# RAG-augmented parametric generation (retrieve → context → Bloom prompt)

def rag_parametric_generate(
    user_prompt: str,
    user_id: str,
    subject: str | None = None,
    model_name: str | None = None,
    top_k: int = 5,
) -> str:
    """Parametric generation augmented with RAG context from user's documents.

    Retrieves relevant chunks filtered by user_id + optional subject,
    injects them as context into the Bloom's Taxonomy prompt flow.
    Returns raw HTML.
    """
    vs = get_vectorstore()
    results = vs.similarity_search(
        user_prompt,
        k=top_k,
        filter=_build_filter(user_id, subject),
    )

    if results:
        context = "\n\n".join(doc.page_content for doc in results)
        context_block = (
            "\n\nDie folgenden Auszuege aus hochgeladenen Dokumenten sollen als "
            "zusaetzlicher Kontext fuer die Materialerstellung dienen. "
            "Beziehe relevante Informationen daraus ein:\n\n"
            f"--- Dokumentkontext ---\n{context}\n--- Ende Dokumentkontext ---\n"
        )
    else:
        context_block = ""

    system_prompt = _load_system_prompt()
    enhanced_prompt = user_prompt + context_block + _HTML_SUFFIX

    llm = get_llm(model_name)
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=enhanced_prompt),
    ])
    return response.content


# RAG query generation (retrieve → context → answer)

def rag_generate(
    query: str,
    user_id: str,
    top_k: int = 5,
    subject: str | None = None,
) -> dict:
    """Retrieve chunks for user_id, inject as context, generate.

    Returns {"answer": str, "sources": [metadata_dict, ...]}.
    """
    vs = get_vectorstore()
    results = vs.similarity_search(
        query,
        k=top_k,
        filter=_build_filter(user_id, subject),
    )

    context = "\n\n".join(doc.page_content for doc in results)
    prompt = f"Context:\n{context}\n\nQuestion: {query}\n\nAnswer:"

    llm = get_llm()
    response = llm.invoke([HumanMessage(content=prompt)])

    sources = [doc.metadata for doc in results]
    return {"answer": response.content, "sources": sources}

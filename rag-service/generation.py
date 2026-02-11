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


def _truncate_snippet(text: str, max_len: int = 200) -> str:
    """Truncate text at a word boundary, append ellipsis."""
    if len(text) <= max_len:
        return text
    cut = text[:max_len].rsplit(" ", 1)[0]
    return cut + "..."


def _build_source(doc, distance: float, ref_number: int | None = None) -> dict:
    """Build a source dict from a LangChain Document + cosine distance."""
    relevance = max(0.0, min(1.0, 1.0 - distance))
    meta = doc.metadata
    source = {
        "filename": meta.get("filename", ""),
        "doc_id": meta.get("doc_id", ""),
        "chunk_index": meta.get("chunk_index"),
        "subject": meta.get("subject", ""),
        "score": round(relevance, 4),
        "snippet": _truncate_snippet(doc.page_content),
    }
    page = meta.get("page_number")
    if page is not None:
        source["page_number"] = page
    if ref_number is not None:
        source["ref_number"] = ref_number
    return source


def _source_label(doc, ref_num: int) -> str:
    """Human-readable label for a source reference in the context block."""
    meta = doc.metadata
    name = meta.get("filename", "Dokument")
    page = meta.get("page_number")
    if page is not None:
        return f"[{ref_num}] (Datei: {name}, Seite {page})"
    chunk = meta.get("chunk_index")
    if chunk is not None:
        return f"[{ref_num}] (Datei: {name}, Abschnitt {chunk + 1})"
    return f"[{ref_num}] (Datei: {name})"


_CITATION_INSTRUCTIONS = {
    "numbered": (
        "\n\nWICHTIG zu Zitationen: Jeder Kontext-Abschnitt oben hat eine eigene "
        "Nummer [1], [2], [3] usw. — auch wenn mehrere Abschnitte aus derselben "
        "Datei stammen. Verwende diese Nummern als Inline-Zitationen im Text "
        "(z.B. [1], [3]). Fuege KEINEN eigenen Quellen-Abschnitt am Ende hinzu "
        "— die Quellenangaben werden automatisch vom System angezeigt."
    ),
    "apa": (
        "\n\nWICHTIG zu Zitationen: Jeder Kontext-Abschnitt hat eine Quellenangabe "
        "mit Dateiname und Seite/Abschnitt. Zitiere im Text im Format "
        "(Dateiname, Seite X) bzw. (Dateiname, Abschnitt X). "
        "Fuege KEINEN eigenen Quellen-Abschnitt am Ende hinzu — die "
        "Quellenangaben werden automatisch vom System angezeigt."
    ),
    "simple": (
        "\n\nWICHTIG zu Zitationen: Wenn du Informationen aus dem Dokumentkontext "
        "verwendest, fuege den Dateinamen in Klammern als Quellenangabe ein. "
        "Fuege KEINEN eigenen Quellen-Abschnitt am Ende hinzu — die "
        "Quellenangaben werden automatisch vom System angezeigt."
    ),
    "none": "",
}


# Parametric generation (no retrieval)

def parametric_generate(
    user_prompt: str,
    model_name: str | None = None,
) -> dict:
    """Generate material using system prompt.

    Returns {"formattedResponse": str, "sources": []}.
    """
    system_prompt = _load_system_prompt()
    enhanced_prompt = user_prompt + _HTML_SUFFIX

    llm = get_llm(model_name)
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=enhanced_prompt),
    ])
    return {"formattedResponse": response.content, "sources": []}


# RAG-augmented parametric generation (retrieve → context → Bloom prompt)

def rag_parametric_generate(
    user_prompt: str,
    user_id: str,
    subject: str | None = None,
    model_name: str | None = None,
    top_k: int = 5,
    citation_style: str = "numbered",
) -> dict:
    """Parametric generation augmented with RAG context.

    Returns {"formattedResponse": str, "sources": [...]}.
    """
    vs = get_vectorstore()
    results_with_score = vs.similarity_search_with_score(
        user_prompt,
        k=top_k,
        filter=_build_filter(user_id, subject),
    )

    sources = []
    if results_with_score:
        # Build numbered context block with source labels
        context_parts = []
        for i, (doc, dist) in enumerate(results_with_score):
            ref_num = i + 1
            label = _source_label(doc, ref_num)
            context_parts.append(f"{label}:\n{doc.page_content}")
            sources.append(_build_source(doc, dist, ref_number=ref_num))

        context = "\n\n".join(context_parts)
        citation_instr = _CITATION_INSTRUCTIONS.get(citation_style, "")
        context_block = (
            "\n\nDie folgenden Auszuege aus hochgeladenen Dokumenten sollen als "
            "zusaetzlicher Kontext fuer die Materialerstellung dienen. "
            "Beziehe relevante Informationen daraus ein:\n\n"
            f"--- Dokumentkontext ---\n{context}\n--- Ende Dokumentkontext ---"
            f"{citation_instr}\n"
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
    return {"formattedResponse": response.content, "sources": sources}


# RAG query generation (retrieve → context → answer)

def rag_generate(
    query: str,
    user_id: str,
    top_k: int = 5,
    subject: str | None = None,
) -> dict:
    """Retrieve chunks for user_id, inject as context, generate.

    Returns {"answer": str, "sources": [enriched source dicts]}.
    """
    vs = get_vectorstore()
    results_with_score = vs.similarity_search_with_score(
        query,
        k=top_k,
        filter=_build_filter(user_id, subject),
    )

    context = "\n\n".join(doc.page_content for doc, _ in results_with_score)
    prompt = f"Context:\n{context}\n\nQuestion: {query}\n\nAnswer:"

    llm = get_llm()
    response = llm.invoke([HumanMessage(content=prompt)])

    sources = [
        _build_source(doc, dist)
        for doc, dist in results_with_score
    ]
    return {"answer": response.content, "sources": sources}

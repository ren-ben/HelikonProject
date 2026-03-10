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
    enhanced_prompt = user_prompt

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
    enhanced_prompt = user_prompt + context_block

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


import time

# two phase prompting to check
def two_phase_parametric_generate(
    user_prompt: str,
    model_name: str | None = None,
) -> dict:
    """
    Two-phase generation matching your quiz_agent.py logic:

    Phase 1: Generate raw content (temperature=0.7, creative)
    Phase 2: Verify and perfect content (temperature=0.0, precise)

    Returns {
        "formattedResponse": str,    # Final HTML
        "rawContent": str,           # Before verification
        "sources": [],
        "timings": {...}
    }
    """
    system_prompt = _load_system_prompt()

    generator_llm = get_llm(model_name, temperature=0.7)
    enhanced_prompt = user_prompt

    start_gen = time.time()
    raw_response = generator_llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=enhanced_prompt),
    ])
    gen_time = time.time() - start_gen
    raw_content = raw_response.content


    perfection_llm = get_llm(model_name, temperature=0.0)

    verify_prompt = f"""Review and perfect this educational content:

--- CONTENT TO REVIEW ---
{raw_content}
--- END CONTENT ---

Your task:
1. Check for accuracy, clarity, and completeness
2. Fix any errors (grammar, facts, structure)
3. Ensure proper HTML formatting
4. Return the CORRECTED version (or original if already perfect)

Be thorough but preserve the original intent."""

    start_verify = time.time()
    perfect_response = perfection_llm.invoke([
        HumanMessage(content=verify_prompt)
    ])
    verify_time = time.time() - start_verify
    final_content = perfect_response.content

    total_time = gen_time + verify_time



    return {
        "formattedResponse": final_content,
        "rawContent": raw_content,
        "sources": [],
        "timings": {
            "generate": f"{gen_time:.1f}s",
            "verify": f"{verify_time:.1f}s",
            "total": f"{total_time:.1f}s"
        }
    }





def rag_two_phase_generate(
    user_prompt: str,
    user_id: str,
    subject: str | None = None,
    model_name: str | None = None,
    top_k: int = 5,
    citation_style: str = "numbered",
) -> dict:
    """
    RAG-augmented two-phase generation:
    1. Retrieve relevant documents from ChromaDB
    2. Phase 1: Generate with documents + custom prompts (temp=0.7)
    3. Phase 2: Verify and perfect (temp=0.0)

    Returns both raw and final content with document sources.
    """

    vs = get_vectorstore()
    results_with_score = vs.similarity_search_with_score(
        user_prompt,
        k=top_k,
        filter=_build_filter(user_id, subject),
    )
    sources = []
    if results_with_score:
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
            "zusaetzlicher Kontext fuer die Materialerstellung dienen:\n\n"
            f"--- Dokumentkontext ---\n{context}\n--- Ende Dokumentkontext ---"
            f"{citation_instr}\n"
        )
    else:
        context_block = ""

    system_prompt = _load_system_prompt()
    enhanced_prompt = user_prompt + context_block

    generator_llm = get_llm(model_name, temperature=0.7)

    start_gen = time.time()
    raw_response = generator_llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=enhanced_prompt),
    ])
    gen_time = time.time() - start_gen
    raw_content = raw_response.content


    perfection_llm = get_llm(model_name, temperature=0.0)

    verify_prompt = f"""You are a senior programming teacher reviewing colleague's teaching materials.

                        CHECKLIST:
                        ✅ Technical accuracy (code works, concepts correct)
                        ✅ Pedagogical quality (clear objectives, good differentiation)
                        ✅ Complete solutions
                        ✅ Classroom-ready format

                        FIX EVERYTHING automatically. Output ONLY final, perfect Markdown for teachers without unnecessary text like:Here is the reviewed and finalized version of the Python Basics Quiz:

                        in the output only give what is required e.g. I want quiz :only output quiz without asking the user or thanking the user or showing the user something.


--- CONTENT TO REVIEW ---
{raw_content}
--- END CONTENT ---
Review this raw material and create the FINAL teacher-ready version:

Return ONLY perfect Markdown and return only what is provided here  and nothing more this will be directly exported and only the quiz is neededwith:
same struture as the given raw material. """

    start_verify = time.time()
    perfect_response = perfection_llm.invoke([
        HumanMessage(content=verify_prompt)
    ])
    verify_time = time.time() - start_verify
    final_content = perfect_response.content

    total_time = gen_time + verify_time


    return {
        "formattedResponse": final_content,
        "rawContent": raw_content,
        "sources": sources,
        "timings": {
            "generate": f"{gen_time:.1f}s",
            "verify": f"{verify_time:.1f}s",
            "total": f"{total_time:.1f}s"
        }
    }

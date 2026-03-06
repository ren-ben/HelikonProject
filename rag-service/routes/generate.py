from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class GenerateRequest(BaseModel):
    """Mirrors Java MaterialRequest field-for-field."""
    materialType: str
    topic: str
    prompt: str
    subject: str
    languageLevel: str = "B1"
    vocabPercentage: int = 30
    contentFocus: str = "balanced"
    includeVocabList: bool = True
    description: str = ""
    modelName: str | None = None
    useDocumentContext: bool = False
    userId: str | None = None
    contextSubject: str | None = None
    citationStyle: str = "numbered"
    useTwoPhase: bool = True


class SourceInfo(BaseModel):
    ref_number: int | None = None
    filename: str = ""
    doc_id: str = ""
    chunk_index: int | None = None
    page_number: int | None = None
    subject: str = ""
    score: float = 0.0
    snippet: str = ""


class GenerateResponse(BaseModel):
    """Mirrors Java ClilResponse."""
    formattedResponse: str
    sources: list[SourceInfo] = []
    rawContent: str | None = None
    timings: dict | None = None


from generation import (
    parametric_generate,
    rag_parametric_generate,
    two_phase_parametric_generate,
    rag_two_phase_generate
)


@router.post("/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest):
    """CLIL material generation with RAG and two-phase support.

    Routing logic:
    - RAG + Two-Phase: useDocumentContext=true + useTwoPhase=true
    - RAG Only: useDocumentContext=true + useTwoPhase=false
    - Two-Phase Only: useDocumentContext=false + useTwoPhase=true
    - Basic: useDocumentContext=false + useTwoPhase=false
    """
    try:
        use_rag = req.useDocumentContext and req.userId
        use_two_phase = req.useTwoPhase

        if use_rag and use_two_phase:
            result = rag_two_phase_generate(
                user_prompt=req.prompt,
                user_id=req.userId,
                subject=req.contextSubject or req.subject,
                model_name=req.modelName,
                citation_style=req.citationStyle,
            )
            return GenerateResponse(
                formattedResponse=result["formattedResponse"],
                sources=result.get("sources", []),
                rawContent=result.get("rawContent"),
                timings=result.get("timings"),
            )

        elif use_rag and not use_two_phase:
            result = rag_parametric_generate(
                user_prompt=req.prompt,
                user_id=req.userId,
                subject=req.contextSubject or req.subject,
                model_name=req.modelName,
                citation_style=req.citationStyle,
            )
            return GenerateResponse(
                formattedResponse=result["formattedResponse"],
                sources=result.get("sources", []),
            )

        elif not use_rag and use_two_phase:
            result = two_phase_parametric_generate(
                user_prompt=req.prompt,
                model_name=req.modelName,
            )
            return GenerateResponse(
                formattedResponse=result["formattedResponse"],
                sources=result.get("sources", []),
                rawContent=result.get("rawContent"),
                timings=result.get("timings"),
            )

        else:
            result = parametric_generate(
                user_prompt=req.prompt,
                model_name=req.modelName,
            )
            return GenerateResponse(
                formattedResponse=result["formattedResponse"],
                sources=result.get("sources", []),
            )

    except Exception as exc:
        error_html = (
            "<div class='error'>"
            "<h3>Error generating content</h3>"
            f"<p>{exc}</p>"
            "</div>"
        )
        return GenerateResponse(formattedResponse=error_html)

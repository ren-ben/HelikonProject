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
    """CLIL material generation with RAG and two-phase support."""
    try:
        if req.useDocumentContext and req.userId:
            result = rag_two_phase_generate(
                user_prompt=req.prompt,
                user_id=req.userId,
                subject=req.contextSubject,
                model_name=req.modelName,
                citation_style=req.citationStyle,
            )
            return GenerateResponse(
                formattedResponse=result["formattedResponse"],
                sources=result.get("sources", []),
                rawContent=result.get("rawContent"),
                timings=result.get("timings"),
            )

        elif req.useTwoPhase:
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


    except Exception as exc:
        error_html = (
            "<div class='error'>"
            "<h3>Error generating content</h3>"
            f"<p>{exc}</p>"
            "</div>"
        )
        return GenerateResponse(formattedResponse=error_html)

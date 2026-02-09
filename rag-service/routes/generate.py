from fastapi import APIRouter
from pydantic import BaseModel

from generation import parametric_generate, rag_parametric_generate

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


class GenerateResponse(BaseModel):
    """Mirrors Java ClilResponse — single key."""
    formattedResponse: str


@router.post("/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest):
    """CLIL material generation — parametric or RAG-augmented.

    Always returns HTTP 200.  On error the HTML error div is placed in
    ``formattedResponse``.
    """
    try:
        if req.useDocumentContext and req.userId:
            html = rag_parametric_generate(
                user_prompt=req.prompt,
                user_id=req.userId,
                subject=req.contextSubject,
                model_name=req.modelName,
            )
        else:
            html = parametric_generate(
                user_prompt=req.prompt,
                model_name=req.modelName,
            )
        return GenerateResponse(formattedResponse=html)

    except Exception as exc:
        error_html = (
            "<div class='error'>"
            "<h3>Error generating content</h3>"
            f"<p>{exc}</p>"
            "</div>"
        )
        return GenerateResponse(formattedResponse=error_html)

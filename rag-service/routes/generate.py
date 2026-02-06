from fastapi import APIRouter
from pydantic import BaseModel

from generation import parametric_generate

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


class GenerateResponse(BaseModel):
    """Mirrors Java ClilResponse — single key."""
    formattedResponse: str


@router.post("/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest):
    """Parametric CLIL material generation.

    Always returns HTTP 200.  On error the HTML error div is placed in
    ``formattedResponse`` — matching OllamaService's ``onErrorResume`` behaviour
    so the frontend rendering path stays identical.
    """
    try:
        # `req.prompt` is the user-assembled prompt from the Vue wizard Step 4;
        # parametric_generate appends the HTML-formatting suffix internally.
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

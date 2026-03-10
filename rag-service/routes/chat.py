from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from generation import parametric_generate, rag_parametric_generate
import time

router = APIRouter()


class ChatRequest(BaseModel):
    prompt: str
    content: str
    language: str
    languageLevel: str
    subject: str
    modelName: Optional[str] = "llama3"
    useDocumentContext: Optional[bool] = False
    userId: str


class ChatResponse(BaseModel):
    formattedResponse: str
    rawContent: Optional[str] = None
    timings: Optional[dict] = None
    sources: list = []


@router.post("/chat")
def chat_with_material(req: ChatRequest) -> ChatResponse:
    """
    Chat with existing material - uses existing generation functions.
    """

    try:
        enhanced_prompt = f"""You are editing existing teaching material.

CURRENT MATERIAL:
{req.content}

USER REQUEST:
{req.prompt}

Context:
- Subject: {req.subject}
- Language: {req.language}
- Language Level: {req.languageLevel}

Task: Update the material according to the user's request. Keep the original structure unless asked to change it. Return ONLY the updated material content, no explanations."""

        start_time = time.time()

        if req.useDocumentContext:
            result = rag_parametric_generate(
                user_prompt=enhanced_prompt,
                user_id=req.userId,
                subject=req.subject,
                model_name=req.modelName,
                top_k=3,
                citation_style="numbered"
            )
        else:
            result = parametric_generate(
                user_prompt=enhanced_prompt,
                model_name=req.modelName
            )

        elapsed_time = time.time() - start_time

        print(f"✅ Chat completed in {elapsed_time:.1f}s using model: {req.modelName}, RAG: {req.useDocumentContext}")

        return ChatResponse(
            formattedResponse=result["formattedResponse"],
            rawContent=None,
            timings={
                "total": f"{elapsed_time:.1f}s"
            },
            sources=result.get("sources", [])
        )

    except Exception as e:
        print(f"❌ Chat error: {e}")
        import traceback
        traceback.print_exc()
        return ChatResponse(
            formattedResponse=f"<div class='error'>Chat failed: {str(e)}</div>",
            sources=[]
        )

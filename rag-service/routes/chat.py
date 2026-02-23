from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from generation import get_llm  # Just get the LLM directly
from langchain_core.messages import HumanMessage
import time

router = APIRouter()


class ChatRequest(BaseModel):
    prompt: str
    content: str
    language: str
    languageLevel: str
    subject: str
    modelName: Optional[str] = "llama3"


class ChatResponse(BaseModel):
    formattedResponse: str
    rawContent: Optional[str] = None
    timings: Optional[dict] = None
    sources: list = []


@router.post("/chat")
def chat_with_material(req: ChatRequest) -> ChatResponse:
    """
    Chat with existing material - simple single-phase generation.
    """

    try:
        # Build the prompt
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
        llm = get_llm("llama3", temperature=0.7)

        start_time = time.time()
        response = llm.invoke([HumanMessage(content=enhanced_prompt)])
        elapsed_time = time.time() - start_time

        updated_content = response.content

        print(f"Chat completed in {elapsed_time:.1f}s")

        return ChatResponse(
            formattedResponse=updated_content,
            rawContent=None,
            timings={
                "total": f"{elapsed_time:.1f}s"
            },
            sources=[]
        )

    except Exception as e:
        print(f"❌ Chat error: {e}")
        import traceback
        traceback.print_exc()
        return ChatResponse(
            formattedResponse=f"<div class='error'>Chat failed: {str(e)}</div>"
        )

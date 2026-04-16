"""
Endpoint-ul Djarvis — agent conversational local (RAG + Ollama).

POST /api/v1/agent/ask
  { "question": "Cand depun D300?", "history": [{"role":"user"/"assistant","content":"..."}] }
  -> { "answer": "...", "sources": [{"source":"Cod Fiscal art.X","score":0.8}], "used_rag": bool }

E destinat sa fie apelat din backend-ul `backend` (port 3777) care face chat-ul.
Returneaza 503 cand modelul Ollama nu e pull-uit inca, ca sa stie callerul sa
foloseasca fallback-ul FAQ.
"""
from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from loguru import logger

from app.agent.prompt import SYSTEM_PROMPT, build_user_prompt
from app.agent.ollama_client import genereaza, model_disponibil
from app.agent.retriever import retriever

router = APIRouter(prefix="/agent", tags=["Djarvis Agent"])


class MesajIstoric(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class CerereIntrebare(BaseModel):
    question: str = Field(min_length=2, max_length=4000)
    history: list[MesajIstoric] = Field(default_factory=list, max_length=20)
    top_k: int = Field(default=5, ge=1, le=10)


class SursaRezultat(BaseModel):
    source: str
    score: float
    excerpt: str | None = None


class RaspunsAgent(BaseModel):
    answer: str
    sources: list[SursaRezultat]
    used_rag: bool
    model: str


@router.get("/health")
async def health():
    """Rapid — verifica daca Ollama + retriever sunt operationale."""
    ollama_ok = await model_disponibil()
    r = retriever()
    index_ok = r.incarca() if not r._incarcat else True
    return {
        "ollama_model": ollama_ok,
        "legislatie_index": index_ok,
        "ready": ollama_ok,  # RAG e optional — putem raspunde si fara
    }


@router.post("/ask", response_model=RaspunsAgent)
async def ask(cerere: CerereIntrebare):
    """Intrebare -> raspuns Djarvis cu RAG (daca exista index) + context istoric."""
    if not await model_disponibil():
        raise HTTPException(
            status_code=503,
            detail="Modelul Ollama nu e pregatit (pull in curs sau container oprit).",
        )

    # 1) Retrieval — poate returna [] daca indexul nu e gata; e ok, raspundem fara context
    r = retriever()
    chunks = r.cauta(cerere.question, k=cerere.top_k)

    context_pt_prompt = [{"source": c["source"], "text": c["text"]} for c in chunks]

    # 2) Construim mesajele: system prompt fix + istoricul (ultimile N mesaje) + intrebarea noua
    user_prompt = build_user_prompt(cerere.question, context_pt_prompt)

    # Prepend istoricul ca pseudo-dialog inainte de user_prompt.
    # Simplu si robust: il includem textual la inceput.
    if cerere.history:
        istoric_text = "\n".join(
            f"{'Utilizator' if m.role=='user' else 'Djarvis'}: {m.content}"
            for m in cerere.history[-10:]
        )
        user_prompt = (
            "Conversatie anterioara (pt context):\n"
            f"{istoric_text}\n\n"
            + user_prompt
        )

    logger.info(
        f"Djarvis ask — q_len={len(cerere.question)} chunks={len(chunks)} "
        f"top_score={chunks[0]['score']:.3f}" if chunks else f"Djarvis ask — q_len={len(cerere.question)} chunks=0"
    )

    try:
        raspuns_text = await genereaza(SYSTEM_PROMPT, user_prompt)
    except Exception as e:
        logger.error(f"Ollama generate failed: {e}")
        raise HTTPException(status_code=502, detail=f"Generare esuata: {e}")

    from app.agent.ollama_client import OLLAMA_MODEL
    return RaspunsAgent(
        answer=raspuns_text or "Nu am putut formula un raspuns. Spune-mi putin mai mult despre situatie.",
        sources=[
            SursaRezultat(source=c["source"], score=c["score"], excerpt=c["text"][:220])
            for c in chunks
        ],
        used_rag=len(chunks) > 0,
        model=OLLAMA_MODEL,
    )

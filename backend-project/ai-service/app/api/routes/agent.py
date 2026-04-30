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

import re
from typing import Literal

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from loguru import logger

from app.agent.prompt import SYSTEM_PROMPT, build_user_prompt
from app.agent.ollama_client import genereaza, model_disponibil
from app.agent.retriever import retriever
from app.agent.suggestions import sugereaza, lista_toate
from app.api.deps import require_role


_BRACKET_REF = re.compile(r"\s*\[(\d+)\]")


def _curata_referinte_numerice(text: str, surse: list[dict]) -> str:
    """
    Inlocuieste orice marcaj rezidual de tip [1], [2] cu numele real al sursei
    sau, daca indicele e in afara listei, le elimina cu totul.

    Modelul e instruit sa NU le foloseasca, dar qwen2.5 mai scapa una pe ici-colo.
    Asta e plasa de siguranta pentru raspunsul afisat in chat.
    """
    if not text:
        return text

    def _inloc(m: re.Match) -> str:
        idx = int(m.group(1)) - 1
        if 0 <= idx < len(surse):
            nume = (surse[idx].get("source") or "").strip()
            if nume:
                # Daca textul dinainte se termina cu "conform"/"potrivit" sau ", "
                # inseram doar numele sursei. Altfel, inseram " (conform <nume>)".
                anterior = text[max(0, m.start() - 12):m.start()].lower()
                if any(k in anterior for k in ("conform", "potrivit", "vezi", "in baza")):
                    return f" {nume}"
                return f" (conform {nume})"
        return ""  # indice invalid -> stergem marcajul

    return _BRACKET_REF.sub(_inloc, text).strip()

router = APIRouter(prefix="/agent", tags=["Djarvis Agent"])


@router.get("/suggestions")
def suggestions(after: str | None = None, limit: int = 5, rol: str | None = None):
    """
    Intrebari sugerate pentru user.
    - fara `after` -> starter (diferit per rol: client / contabil / default)
    - cu `after=<ultimul mesaj>` -> intrebari din aceeasi categorie + cateva diverse
    - `rol` optional: "client" / "contabil" / "admin" — influenteaza starter-ul
    """
    return {"suggestions": sugereaza(after, limit=min(max(limit, 1), 10), rol=rol)}


@router.get("/suggestions/all")
def suggestions_all():
    """Lista completa — pentru pagina FAQ sau debug."""
    return {"items": lista_toate(), "total": len(lista_toate())}


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


@router.post("/legislatie/add")
async def adauga_articol_legislatie(
    payload: dict,
    user=Depends(require_role("admin", "super_admin")),
):
    """Adauga un articol nou in corpusul RAG al lui Djarvis.

    Articolul este appended intr-un fisier `user_added.jsonl` din directorul de
    legislatie. Indexul FAISS se reconstruieste manual prin scriptul
    `scripts/build_legislation_index.py` — necesita embedder MiniLM, costisitor.

    Body: {"titlu": "...", "sursa": "...", "continut": "...", "categorie": "..."}
    """
    import json
    import os
    from pathlib import Path

    titlu = (payload.get("titlu") or "").strip()
    continut = (payload.get("continut") or "").strip()
    sursa = (payload.get("sursa") or "").strip()
    categorie = (payload.get("categorie") or "altele").strip()

    if not titlu or not continut:
        raise HTTPException(status_code=400, detail="Titlu si continut obligatorii")

    legislatie_dir = Path(os.getenv("TRAINING_DATA_PATH", "/app/training_data")) / "legislatie"
    legislatie_dir.mkdir(parents=True, exist_ok=True)
    target = legislatie_dir / "user_added.jsonl"

    entry = {
        "source": f"{titlu} ({sursa})" if sursa else titlu,
        "text": continut,
        "category": categorie,
    }
    with target.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    return {
        "status": "ok",
        "file": str(target),
        "message": (
            "Articol adaugat in corpusul Djarvis. Pentru ca raspunsurile sa il foloseasca, "
            "ruleaza `docker exec ai_contabil_ai_service python scripts/build_legislation_index.py` "
            "ca sa reconstruiesti indexul FAISS."
        ),
    }


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
        # Limitam raspunsul la 500 tokeni — rapid pe CPU, suficient pt contabilitate
        raspuns_text = await genereaza(SYSTEM_PROMPT, user_prompt, max_tokens=500)
    except Exception as e:
        logger.error(f"Ollama generate failed: {e}")
        raise HTTPException(status_code=502, detail=f"Generare esuata: {e}")

    # Plasa de siguranta — modelul nu trebuie sa scoata [1]/[2] catre user
    raspuns_text = _curata_referinte_numerice(raspuns_text, context_pt_prompt)

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

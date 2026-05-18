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

import json
import re
from datetime import date as _date
from typing import Any, Literal

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


# ============================================
# === Auto-fill formulare generator (LLM JSON) ===============
# ============================================

FormType = Literal[
    "factura", "chitanta", "contract", "stat_plata", "aviz", "ordin_plata",
]

# Schemele descrise in limbaj natural pentru LLM — ii spunem ce campuri sa scoata,
# in ce format si exemple. Modelul intoarce JSON strict (vezi prompt-ul).
_FORM_SCHEMAS: dict[str, dict[str, Any]] = {
    "factura": {
        "descriere": "Factura fiscala pentru un client (factura de vanzare).",
        "campuri": {
            "serie": "string scurt, prefix de serie. Default 'FA'.",
            "numar": "string numeric, numar factura. Ex: '001'.",
            "data": "data emiterii in format YYYY-MM-DD. Daca nu e specificat, foloseste data de azi.",
            "vendor_nume": "denumire furnizor (cel care emite). Ex: 'Compania Mea SRL'.",
            "vendor_cui": "IDNO/CUI furnizor (13 cifre).",
            "vendor_adresa": "adresa furnizor.",
            "client_nume": "denumire cumparator. OBLIGATORIU.",
            "client_cui": "IDNO cumparator (13 cifre) sau gol daca persoana fizica.",
            "client_adresa": "adresa cumparator sau gol.",
            "items": "array de articole. Fiecare element: {denumire: string, cantitate: number, pret_unitar: number, cota_tva: number}. Cota TVA standard RM = 20. Cota redusa = 8.",
            "note": "note suplimentare, opt.",
        },
        "exemplu": {
            "serie": "FA", "numar": "001", "data": "2026-05-18",
            "vendor_nume": "Compania Mea SRL", "vendor_cui": "1010600000000",
            "vendor_adresa": "mun. Chisinau, str. Stefan cel Mare 1",
            "client_nume": "Beta Trade SRL", "client_cui": "1003600123456",
            "client_adresa": "mun. Balti, str. Independentei 25",
            "items": [
                {"denumire": "Servicii consultanta IT", "cantitate": 1, "pret_unitar": 5000, "cota_tva": 20}
            ],
            "note": "",
        },
    },
    "chitanta": {
        "descriere": "Chitanta de incasare numerar.",
        "campuri": {
            "numar": "numar chitanta. Ex: '001'.",
            "data": "data emiterii YYYY-MM-DD.",
            "suma": "suma incasata in MDL (numar).",
            "de_la": "numele platitorului (cine a platit). OBLIGATORIU.",
            "pentru": "motivul incasarii (ce s-a platit). OBLIGATORIU.",
        },
        "exemplu": {"numar": "001", "data": "2026-05-18", "suma": 1500, "de_la": "Ion Popescu", "pentru": "Servicii consultanta luna mai"},
    },
    "contract": {
        "descriere": "Contract de prestari servicii intre doua parti.",
        "campuri": {
            "numar": "numar contract.",
            "data": "data semnarii YYYY-MM-DD.",
            "parte_a_nume": "Prestator (cel care presteaza servicii). OBLIGATORIU.",
            "parte_a_cui": "IDNO prestator. OBLIGATORIU.",
            "parte_b_nume": "Beneficiar. OBLIGATORIU.",
            "parte_b_cui": "IDNO beneficiar sau gol.",
            "obiect": "obiectul contractului (ce servicii). OBLIGATORIU.",
            "valoare": "valoare contract in MDL (numar). OBLIGATORIU.",
            "durata": "durata contractului. Default '12 luni'.",
            "clauze_extra": "clauze suplimentare, opt.",
        },
        "exemplu": {"numar": "001", "data": "2026-05-18", "parte_a_nume": "Compania Mea SRL", "parte_a_cui": "1010600000000", "parte_b_nume": "Beta Trade SRL", "parte_b_cui": "1003600123456", "obiect": "Servicii consultanta contabila lunare", "valoare": 60000, "durata": "12 luni", "clauze_extra": ""},
    },
    "stat_plata": {
        "descriere": "Stat de plata salariu pentru un angajat (calcul fiscal automat IVS 12% + CAS 6% + CAM 9%).",
        "campuri": {
            "luna": "luna stat plata. Ex: 'Aprilie 2026'.",
            "angajat_nume": "numele complet al angajatului. OBLIGATORIU.",
            "angajat_idnp": "IDNP angajat (13 cifre) sau gol.",
            "functie": "functia. OBLIGATORIU.",
            "salariu_brut": "salariu brut MDL (numar).",
            "zile_lucrate": "zile lucrate in luna (int). Default 22.",
            "angajator": "denumire angajator. OBLIGATORIU.",
        },
        "exemplu": {"luna": "Aprilie 2026", "angajat_nume": "Maria Ionescu", "angajat_idnp": "2005001234567", "functie": "Contabil", "salariu_brut": 12000, "zile_lucrate": 22, "angajator": "Compania Mea SRL"},
    },
    "aviz": {
        "descriere": "Aviz de insotire a marfii (transport bunuri).",
        "campuri": {
            "numar": "numar aviz.",
            "data": "data emiterii YYYY-MM-DD.",
            "expeditor": "denumire expeditor. OBLIGATORIU.",
            "destinatar": "denumire destinatar. OBLIGATORIU.",
            "transport": "nr auto / detalii transport (opt).",
            "items": "array de articole [{denumire, cantitate, pret_unitar=0, cota_tva=0}]. Pretul nu e relevant pe aviz.",
        },
        "exemplu": {"numar": "001", "data": "2026-05-18", "expeditor": "Compania Mea SRL", "destinatar": "Beta Trade SRL", "transport": "MD-CD-123", "items": [{"denumire": "Cutii ambalaj", "cantitate": 50, "pret_unitar": 0, "cota_tva": 0}]},
    },
    "ordin_plata": {
        "descriere": "Ordin de plata bancara (transfer bancar).",
        "campuri": {
            "numar": "numar ordin.",
            "data": "data emiterii YYYY-MM-DD.",
            "platitor": "denumire platitor. OBLIGATORIU.",
            "platitor_cont": "IBAN platitor (incepe cu MD).",
            "beneficiar": "denumire beneficiar. OBLIGATORIU.",
            "beneficiar_cont": "IBAN beneficiar (incepe cu MD).",
            "suma": "suma MDL (numar).",
            "detalii_plata": "detalii / scop plata. OBLIGATORIU.",
        },
        "exemplu": {"numar": "001", "data": "2026-05-18", "platitor": "Compania Mea SRL", "platitor_cont": "MD24EX0000000000000123456", "beneficiar": "Beta Trade SRL", "beneficiar_cont": "MD24EX0000000000000654321", "suma": 5000, "detalii_plata": "Plata factura FA-001 din 2026-05-10"},
    },
}


class GenerateFormRequest(BaseModel):
    form_type: FormType
    prompt: str = Field(min_length=3, max_length=2000)


class GenerateFormResponse(BaseModel):
    form_type: str
    fields: dict[str, Any]
    used_prompt: str
    model: str


_JSON_BLOCK = re.compile(r"\{[\s\S]*\}")


def _extrage_json(text: str) -> dict[str, Any]:
    """Extrage primul bloc JSON dintr-un text. Tolereaza markdown si text in jur."""
    if not text:
        raise ValueError("Raspuns gol de la LLM")
    # Curatam fence-uri Markdown daca exista (```json ... ```)
    t = text.strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:json)?\s*", "", t)
        t = re.sub(r"\s*```\s*$", "", t)
    m = _JSON_BLOCK.search(t)
    if not m:
        raise ValueError(f"Nu am gasit JSON valid in raspunsul LLM: {text[:200]}")
    return json.loads(m.group(0))


@router.post("/generate-form", response_model=GenerateFormResponse)
async def generate_form(cerere: GenerateFormRequest):
    """
    Primeste un prompt in limbaj natural si tipul formularului, intoarce
    JSON cu campurile populate. Folosit de Generatorul de documente din UI:
    user-ul scrie 'fa-mi o factura catre X SRL pe 5000 MDL servicii IT',
    LLM-ul extrage structura, frontend-ul populeaza formularul.
    """
    if not await model_disponibil():
        raise HTTPException(
            status_code=503,
            detail="Modelul Ollama nu e pregatit (pull in curs sau container oprit).",
        )

    schema = _FORM_SCHEMAS.get(cerere.form_type)
    if not schema:
        raise HTTPException(status_code=400, detail=f"form_type necunoscut: {cerere.form_type}")

    azi = _date.today().isoformat()

    sys_prompt = (
        "Esti un asistent care extrage date structurate pentru completarea automata "
        "a unui formular contabil din Republica Moldova. Raspunzi DOAR cu un obiect JSON valid, "
        "fara comentarii, fara markdown, fara explicatii. Daca un camp nu e specificat de user, "
        "foloseste o valoare implicita rezonabila (ex: data = azi, cota TVA = 20, durata = '12 luni'). "
        f"Data de azi: {azi}. Toate sumele sunt in MDL. IDNO are 13 cifre."
    )

    user_prompt = (
        f"Tip document: {cerere.form_type}\n"
        f"Descriere: {schema['descriere']}\n\n"
        "Schema (cheie: descriere):\n"
        + "\n".join(f"  - {k}: {v}" for k, v in schema["campuri"].items())
        + "\n\nExemplu format raspuns:\n"
        + json.dumps(schema["exemplu"], ensure_ascii=False, indent=2)
        + f"\n\nCererea utilizatorului:\n\"{cerere.prompt}\"\n\n"
        "Raspuns (DOAR JSON, fara nimic in plus):"
    )

    try:
        text = await genereaza(sys_prompt, user_prompt, temperatura=0.15, max_tokens=800)
    except Exception as e:
        logger.error(f"Ollama generate-form failed: {e}")
        raise HTTPException(status_code=502, detail=f"Generare esuata: {e}")

    try:
        fields = _extrage_json(text)
    except (ValueError, json.JSONDecodeError) as e:
        logger.warning(f"LLM a returnat JSON invalid pentru {cerere.form_type}: {text[:300]}")
        raise HTTPException(
            status_code=502,
            detail=f"AI-ul nu a returnat date valide. Incearca din nou cu un prompt mai clar. ({e})",
        )

    from app.agent.ollama_client import OLLAMA_MODEL
    return GenerateFormResponse(
        form_type=cerere.form_type,
        fields=fields,
        used_prompt=cerere.prompt,
        model=OLLAMA_MODEL,
    )

"""
Endpoint de overview pentru cei 6 agenti AI ai aplicatiei.

GET /api/v1/agents/overview
  -> { "agents": [{id, name, kind, status, mode, description, ...}, ...], "summary": {...} }

E destinat dashboard-ului admin sa arate ca toti agentii sunt operationali
(inclusiv cei care ruleaza pe fallback rule-based / regex, nu doar BERT trainable).

Status:
  - "online"  : functional (fie ML loaded, fie fallback activ)
  - "degraded": functional dar cu probleme partiale (ex: Djarvis fara Ollama)
  - "offline" : nu poate raspunde (rar — practic doar daca ai-service e jos)

Mode:
  - "ml"        : model ML antrenat e in RAM (BERT, ML clasifier urgenta)
  - "fallback"  : reguli/regex/keywords cand ML nu e antrenat
  - "rule-based": doar reguli (nu are nevoie de ML)
  - "llm"       : agent conversational (Djarvis prin Ollama)
  - "ocr"       : motor OCR (PaddleOCR)
"""
from __future__ import annotations

from typing import Any
from fastapi import APIRouter
from loguru import logger

router = APIRouter(prefix="/agents", tags=["AI Agents"])


def _safe_attr(obj, name, default=None):
    """Citeste un atribut fara sa arunce eroare. Util pentru introspectare singleton."""
    try:
        return getattr(obj, name, default)
    except Exception:
        return default


async def _djarvis_status() -> dict[str, Any]:
    """Djarvis = Ollama LLM + FAISS legislatie. Online daca Ollama raspunde."""
    try:
        from app.agent.ollama_client import model_disponibil, OLLAMA_MODEL
        from app.agent.retriever import retriever
        ollama_ok = await model_disponibil()
        r = retriever()
        index_ok = r._incarcat or r.incarca()
    except Exception as e:
        logger.warning(f"djarvis status check failed: {e}")
        return {
            "id": "djarvis",
            "name": "Djarvis",
            "kind": "Chat conversational",
            "tech": "Ollama qwen2.5:3b + FAISS RAG",
            "status": "offline",
            "mode": "llm",
            "description": "Raspunde la intrebari despre legislatia RM (fiscal/contabil) cu citari.",
            "details": {"error": str(e)},
        }

    if ollama_ok and index_ok:
        status = "online"
    elif index_ok and not ollama_ok:
        status = "degraded"  # poate cauta legislatie, dar nu poate genera raspuns
    elif ollama_ok and not index_ok:
        status = "degraded"  # poate genera, dar fara context legislativ
    else:
        status = "offline"

    return {
        "id": "djarvis",
        "name": "Djarvis",
        "kind": "Chat conversational",
        "tech": f"Ollama {OLLAMA_MODEL} + FAISS RAG",
        "status": status,
        "mode": "llm",
        "description": "Raspunde la intrebari despre legislatia RM (fiscal/contabil) cu citari.",
        "details": {
            "ollama_model_ready": ollama_ok,
            "legislatie_index_ready": index_ok,
        },
    }


def _ocr_status() -> dict[str, Any]:
    """PaddleOCR — lazy loaded la primul document. Online daca modulul e importabil."""
    try:
        from app.processors.ocr_processor import OCRProcessor  # noqa: F401
        return {
            "id": "ocr",
            "name": "OCR PaddleOCR",
            "kind": "Recunoastere text",
            "tech": "PaddleOCR + OpenCV",
            "status": "online",
            "mode": "ocr",
            "description": "Extrage text + bounding boxes + confidence din poze/PDF facturi.",
            "details": {"lazy_load": True, "note": "Engine OCR se incarca la primul document procesat."},
        }
    except Exception as e:
        return {
            "id": "ocr",
            "name": "OCR PaddleOCR",
            "kind": "Recunoastere text",
            "tech": "PaddleOCR + OpenCV",
            "status": "offline",
            "mode": "ocr",
            "description": "Extrage text + bounding boxes + confidence din poze/PDF facturi.",
            "details": {"error": str(e)},
        }


def _classifier_status() -> dict[str, Any]:
    """Document Classifier — BERT antrenat SAU keyword fallback. Mereu online."""
    try:
        from app.processors.classifier import document_classifier
        loaded = bool(_safe_attr(document_classifier, "_model_loaded", False))
        return {
            "id": "classifier",
            "name": "Document Classifier",
            "kind": "Clasificare tip document",
            "tech": "BERT multilingual" if loaded else "Keyword matching (fallback)",
            "status": "online",
            "mode": "ml" if loaded else "fallback",
            "description": "Clasifica documentul in 10 tipuri (factura, chitanta, contract, etc.).",
            "details": {
                "ml_model_loaded": loaded,
                "fallback_active": not loaded,
                "categories": 10,
            },
        }
    except Exception as e:
        return {
            "id": "classifier",
            "name": "Document Classifier",
            "kind": "Clasificare tip document",
            "tech": "BERT / keywords",
            "status": "offline",
            "mode": "fallback",
            "description": "Clasifica documentul in 10 tipuri (factura, chitanta, contract, etc.).",
            "details": {"error": str(e)},
        }


def _ner_status() -> dict[str, Any]:
    """NER Extractor — BERT antrenat SAU regex fallback. Mereu online."""
    try:
        from app.processors.ner_extractor import ner_extractor
        loaded = bool(_safe_attr(ner_extractor, "_model_loaded", False))
        return {
            "id": "ner",
            "name": "NER Extractor",
            "kind": "Extragere entitati",
            "tech": "BERT token classification" if loaded else "Regex patterns (fallback)",
            "status": "online",
            "mode": "ml" if loaded else "fallback",
            "description": "Extrage IDNO, sume, date, TVA, nume furnizor, IBAN din text.",
            "details": {
                "ml_model_loaded": loaded,
                "fallback_active": not loaded,
                "entity_types": ["INVOICE_NUM", "DATE", "VENDOR", "CUI", "AMOUNT", "VAT", "TOTAL", "IBAN"],
            },
        }
    except Exception as e:
        return {
            "id": "ner",
            "name": "NER Extractor",
            "kind": "Extragere entitati",
            "tech": "BERT / regex",
            "status": "offline",
            "mode": "fallback",
            "description": "Extrage IDNO, sume, date, TVA, nume furnizor, IBAN din text.",
            "details": {"error": str(e)},
        }


def _urgency_status() -> dict[str, Any]:
    """Urgency Scorer — reguli + ML hybrid. Mereu online (reguli always-on)."""
    try:
        from app.processors.urgency_scorer import urgency_scorer
        ml_loaded = bool(_safe_attr(urgency_scorer, "_ml_loaded", False))
        rule_w = float(_safe_attr(urgency_scorer, "_rule_weight", 1.0))
        ml_w = float(_safe_attr(urgency_scorer, "_ml_weight", 0.0))
        return {
            "id": "urgency",
            "name": "Urgency Scorer",
            "kind": "Scor urgenta document",
            "tech": f"Hybrid (rule {rule_w:.0%} + ML {ml_w:.0%})" if ml_loaded else "Rule-based",
            "status": "online",
            "mode": "ml" if ml_loaded else "rule-based",
            "description": "Calculeaza scor 0-100 in functie de scadenta, suma, tip, termen fiscal.",
            "details": {
                "ml_model_loaded": ml_loaded,
                "rule_weight": rule_w,
                "ml_weight": ml_w,
                "rules_count": 14,
            },
        }
    except Exception as e:
        return {
            "id": "urgency",
            "name": "Urgency Scorer",
            "kind": "Scor urgenta document",
            "tech": "Rule-based",
            "status": "offline",
            "mode": "rule-based",
            "description": "Calculeaza scor 0-100 in functie de scadenta, suma, tip, termen fiscal.",
            "details": {"error": str(e)},
        }


def _recommender_status() -> dict[str, Any]:
    """Recommender — sentence-transformers + FAISS. Online cand indexul e loaded."""
    try:
        from app.processors.recommender import document_recommender
        loaded = bool(_safe_attr(document_recommender, "_loaded", False))
        doc_ids = _safe_attr(document_recommender, "_doc_ids", []) or []
        return {
            "id": "recommender",
            "name": "Document Recommender",
            "kind": "Sugestii documente similare",
            "tech": "sentence-transformers + FAISS" if loaded else "sentence-transformers (lazy)",
            "status": "online",
            "mode": "ml" if loaded else "fallback",
            "description": "Sugereaza documente lipsa (ex: ai factura, lipseste bon fiscal).",
            "details": {
                "index_loaded": loaded,
                "indexed_documents": len(doc_ids),
                "note": "Functioneaza ca recomandare baza pe similaritate; se imbogateste pe masura ce se proceseaza documente.",
            },
        }
    except Exception as e:
        return {
            "id": "recommender",
            "name": "Document Recommender",
            "kind": "Sugestii documente similare",
            "tech": "FAISS",
            "status": "offline",
            "mode": "ml",
            "description": "Sugereaza documente lipsa (ex: ai factura, lipseste bon fiscal).",
            "details": {"error": str(e)},
        }


@router.get("/overview")
async def overview():
    """
    Returneaza statusul tuturor celor 6 agenti AI ai aplicatiei.

    Cei 6 agenti:
      1. Djarvis            — chat conversational legislatie (Ollama LLM + FAISS)
      2. OCR PaddleOCR      — recunoastere text din imagini/PDF
      3. Document Classifier — clasificare tip document (BERT/keywords)
      4. NER Extractor      — extragere entitati (BERT/regex)
      5. Urgency Scorer     — scor urgenta (reguli + ML)
      6. Document Recommender — sugestii documente lipsa (FAISS)

    Toti agentii au fallback robust si raman functionali chiar daca modelele
    ML nu sunt antrenate inca.
    """
    agents = [
        await _djarvis_status(),
        _ocr_status(),
        _classifier_status(),
        _ner_status(),
        _urgency_status(),
        _recommender_status(),
    ]

    online = sum(1 for a in agents if a["status"] == "online")
    degraded = sum(1 for a in agents if a["status"] == "degraded")
    offline = sum(1 for a in agents if a["status"] == "offline")
    ml_active = sum(1 for a in agents if a["mode"] == "ml")

    return {
        "agents": agents,
        "summary": {
            "total": len(agents),
            "online": online,
            "degraded": degraded,
            "offline": offline,
            "ml_models_active": ml_active,
        },
    }


@router.get("/health")
async def health():
    """Health rapid — doar numara online/offline fara detalii."""
    o = await overview()
    return {
        "ok": o["summary"]["offline"] == 0,
        **o["summary"],
    }

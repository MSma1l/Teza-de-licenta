"""
Chat API - Sistem inteligent de raspunsuri cu 3 nivele:

1. Clientul trimite intrebare
2. FAQ keyword match (SequenceMatcher) - daca confidence >= 0.97 -> raspunde instant
3. Altfel -> Djarvis (agent RAG local cu Ollama + legislatie RM) raspunde
4. Daca Djarvis nu reuseste (timeout, ollama down) -> escaladeaza la contabil
5. Contabilul raspunde -> raspunsul se salveaza in FAQ pentru viitor
"""
import logging
import os
from difflib import SequenceMatcher

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.faq import FaqEntry, ChatConversation, ChatMessage
from app.schemas.chat import (
    ChatMessageRequest,
    ChatMessageResponse,
    ConversationResponse,
    FaqEntryCreate,
    FaqEntryResponse,
)

log = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["Chat & FAQ"])

CONFIDENCE_THRESHOLD = 0.97

# URL-ul ai-service (Djarvis endpoint). Intern in reteaua Docker.
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://ai-service:3778")
DJARVIS_TIMEOUT = float(os.getenv("DJARVIS_TIMEOUT", "90"))


@router.get("/suggestions")
def get_djarvis_suggestions(
    after: str | None = None,
    limit: int = 5,
    current_user: User = Depends(get_current_user),
):
    """Proxy catre ai-service pentru intrebari sugerate Djarvis.

    Returneaza starter questions cand `after` lipseste. Starter-ul e personalizat
    per rol: client vede ghiduri de utilizare + legislatie de baza; contabil vede
    flow-ul sau de lucru + legislatie avansata.
    """
    try:
        # current_user.role poate fi enum UserRole sau string — extragem `.value` daca e enum
        rol_value = getattr(current_user.role, "value", current_user.role) or ""
        params = {"limit": str(limit), "rol": str(rol_value).lower()}
        if after:
            params["after"] = after
        with httpx.Client(timeout=5) as c:
            r = c.get(f"{AI_SERVICE_URL}/api/v1/agent/suggestions", params=params)
            r.raise_for_status()
            return r.json()
    except Exception as e:
        log.warning(f"Suggestions fetch failed: {e}")
        return {"suggestions": []}


def intreaba_djarvis(intrebare: str, istoric: list[dict] | None = None) -> str | None:
    """
    Apeleaza /api/v1/agent/ask in ai-service si intoarce raspunsul text.
    Intoarce None la orice esec — caller-ul va escalada la contabil.
    """
    payload = {"question": intrebare, "history": istoric or [], "top_k": 5}
    try:
        with httpx.Client(timeout=DJARVIS_TIMEOUT) as c:
            r = c.post(f"{AI_SERVICE_URL}/api/v1/agent/ask", json=payload)
            if r.status_code == 503:
                log.info("Djarvis indisponibil (503) — escaladam")
                return None
            r.raise_for_status()
            raspuns = (r.json().get("answer") or "").strip()
            return raspuns or None
    except Exception as e:
        log.warning(f"Djarvis call failed: {e}")
        return None


def find_best_faq_match(question: str, db: Session) -> tuple[FaqEntry | None, float]:
    """Cauta cea mai buna potrivire in baza FAQ."""
    faqs = db.query(FaqEntry).filter(FaqEntry.is_active == True).all()
    if not faqs:
        return None, 0.0

    question_lower = question.lower().strip()
    best_match = None
    best_score = 0.0

    for faq in faqs:
        # Score 1: Similaritate directa cu intrebarea
        q_score = SequenceMatcher(None, question_lower, faq.question.lower()).ratio()

        # Score 2: Keyword matching
        kw_score = 0.0
        if faq.keywords:
            keywords = [kw.strip().lower() for kw in faq.keywords.split(",")]
            matched = sum(1 for kw in keywords if kw in question_lower)
            kw_score = matched / len(keywords) if keywords else 0.0

        # Score combinat: 70% similaritate text, 30% keywords
        combined = q_score * 0.7 + kw_score * 0.3

        if combined > best_score:
            best_score = combined
            best_match = faq

    return best_match, best_score


@router.post("/send", response_model=ChatMessageResponse)
def send_message(
    data: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Trimite un mesaj in chat. AI raspunde sau escaladeaza."""
    # Creaza sau gaseste conversatia
    if data.conversation_id:
        conversation = db.query(ChatConversation).filter(
            ChatConversation.id == data.conversation_id,
            ChatConversation.user_id == current_user.id,
        ).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversatie negasita")
    else:
        conversation = ChatConversation(user_id=current_user.id)
        db.add(conversation)
        db.flush()

    # Salveaza mesajul clientului
    client_msg = ChatMessage(
        conversation_id=conversation.id,
        sender_type="client",
        content=data.message,
    )
    db.add(client_msg)
    db.flush()

    # Cauta raspuns in FAQ
    faq_match, confidence = find_best_faq_match(data.message, db)

    if faq_match and confidence >= CONFIDENCE_THRESHOLD:
        # Raspuns automat AI
        faq_match.usage_count += 1
        ai_msg = ChatMessage(
            conversation_id=conversation.id,
            sender_type="ai",
            content=faq_match.answer,
            confidence=confidence,
            faq_entry_id=faq_match.id,
        )
        db.add(ai_msg)
        db.commit()
        db.refresh(ai_msg)
        return ai_msg
    else:
        # Nu am match FAQ sigur -> cere Djarvis (agent RAG local).
        # Trimitem si ultimile 6 mesaje din conversatie ca istoric.
        istoric = []
        mesaje_recente = (
            db.query(ChatMessage)
            .filter(ChatMessage.conversation_id == conversation.id)
            .filter(ChatMessage.id != client_msg.id)
            .order_by(ChatMessage.created_at.desc())
            .limit(6)
            .all()
        )
        for m in reversed(mesaje_recente):
            rol = "user" if m.sender_type == "client" else "assistant"
            istoric.append({"role": rol, "content": m.content or ""})

        raspuns_djarvis = intreaba_djarvis(data.message, istoric)

        if raspuns_djarvis:
            ai_msg = ChatMessage(
                conversation_id=conversation.id,
                sender_type="ai",
                content=raspuns_djarvis,
                confidence=None,  # raspuns de la Djarvis, nu dintr-un FAQ
            )
            db.add(ai_msg)
            db.commit()
            db.refresh(ai_msg)
            return ai_msg

        # Djarvis indisponibil / a esuat -> escaladare la contabil (fallback)
        conversation.is_escalated = True
        escalation_text = (
            "Nu am putut formula un raspuns sigur acum. "
            "Am creat o solicitare pentru contabilul tau — vei primi notificare cand "
            "raspunsul profesional e gata."
        )

        ai_msg = ChatMessage(
            conversation_id=conversation.id,
            sender_type="ai",
            content=escalation_text,
            confidence=confidence,
        )
        db.add(ai_msg)
        db.commit()
        db.refresh(ai_msg)
        return ai_msg


@router.get("/conversations", response_model=list[ConversationResponse])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista conversatii ale userului curent."""
    convos = db.query(ChatConversation).filter(
        ChatConversation.user_id == current_user.id
    ).order_by(ChatConversation.updated_at.desc()).limit(20).all()
    return convos


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Detalii conversatie cu toate mesajele."""
    convo = db.query(ChatConversation).filter(
        ChatConversation.id == conversation_id,
        ChatConversation.user_id == current_user.id,
    ).first()
    if not convo:
        raise HTTPException(status_code=404, detail="Conversatie negasita")
    return convo


# === FAQ Management (doar contabili/admin) ===

@router.post("/faq", response_model=FaqEntryResponse, status_code=201)
def create_faq(
    data: FaqEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Adauga o noua intrare FAQ (contabil/admin)."""
    if current_user.role.value not in ("contabil", "admin"):
        raise HTTPException(status_code=403, detail="Doar contabilii pot adauga FAQ")
    entry = FaqEntry(
        question=data.question,
        answer=data.answer,
        category=data.category,
        keywords=data.keywords,
        created_by=current_user.id,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/faq", response_model=list[FaqEntryResponse])
def list_faq(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista FAQ entries."""
    return db.query(FaqEntry).filter(FaqEntry.is_active == True).order_by(FaqEntry.usage_count.desc()).all()


@router.get("/escalated", response_model=list[ConversationResponse])
def get_escalated(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista conversatii escalate (doar contabili/admin)."""
    if current_user.role.value not in ("contabil", "admin"):
        raise HTTPException(status_code=403, detail="Acces restrictionat")
    return db.query(ChatConversation).filter(
        ChatConversation.is_escalated == True,
        ChatConversation.is_resolved == False,
    ).order_by(ChatConversation.created_at.desc()).all()


@router.post("/respond/{conversation_id}", response_model=ChatMessageResponse)
def respond_to_escalation(
    conversation_id: str,
    data: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Contabilul raspunde la o conversatie escalata + salveaza in FAQ."""
    if current_user.role.value not in ("contabil", "admin"):
        raise HTTPException(status_code=403, detail="Doar contabilii pot raspunde")

    convo = db.query(ChatConversation).filter(
        ChatConversation.id == conversation_id,
    ).first()
    if not convo:
        raise HTTPException(status_code=404, detail="Conversatie negasita")

    # Salveaza raspunsul contabilului
    msg = ChatMessage(
        conversation_id=conversation_id,
        sender_type="contabil",
        content=data.message,
        confidence=1.0,
    )
    db.add(msg)

    # Marcheaza conversatia ca rezolvata
    convo.is_resolved = True
    convo.escalated_to = current_user.id

    # Gaseste intrebarea originala a clientului si salveaza in FAQ
    client_msg = db.query(ChatMessage).filter(
        ChatMessage.conversation_id == conversation_id,
        ChatMessage.sender_type == "client",
    ).first()

    if client_msg:
        faq = FaqEntry(
            question=client_msg.content,
            answer=data.message,
            category="consultare",
            created_by=current_user.id,
        )
        db.add(faq)

    db.commit()
    db.refresh(msg)
    return msg

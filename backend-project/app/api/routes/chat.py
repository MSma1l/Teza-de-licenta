"""
Chat API - Sistem inteligent de raspunsuri cu escaladare.

Flux:
1. Clientul trimite intrebare
2. AI cauta in baza FAQ cea mai potrivita intrebare/raspuns
3. Daca confidence >= 0.97 -> raspunde automat
4. Daca confidence < 0.97 -> escaladeaza la contabil, notifica clientul
5. Contabilul raspunde, raspunsul se salveaza in FAQ pentru viitor
"""
from difflib import SequenceMatcher
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

router = APIRouter(prefix="/chat", tags=["Chat & FAQ"])

CONFIDENCE_THRESHOLD = 0.97


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
        # Escaladare la contabil
        conversation.is_escalated = True
        escalation_text = (
            "Multumim pentru intrebare! Nu sunt suficient de sigur pe raspuns "
            "(precizie {:.0f}%). Am creat o solicitare catre contabilul nostru. "
            "Veti primi o notificare cand raspunsul profesional este gata."
        ).format(confidence * 100)

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

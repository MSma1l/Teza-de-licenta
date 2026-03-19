"""
Celery tasks: pipeline-ul complet de procesare documente.
Upload → OCR → Classification → Extraction → Urgency → Duplicate check → Auto-process/Queue.
"""

import asyncio
from pathlib import Path
from typing import Optional
from uuid import UUID

from celery import states
from loguru import logger

from app.tasks.celery_app import celery_app
from app.core.config import settings


def _run_async(coro):
    """Helper pentru a rula async code în Celery (sync).
    Folosește asyncio.run() care creează + curăță event loop corect."""
    return asyncio.run(coro)


@celery_app.task(bind=True, name="process_document")
def process_document_task(
    self,
    document_id: str,
    company_id: str,
    file_path: str,
    filename: str,
    encryption_key_ref: Optional[str] = None,
):
    """
    Pipeline complet de procesare document:
    1. OCR (PaddleOCR)
    2. Clasificare (BERT / keyword fallback)
    3. Extracție entități (NER / regex fallback)
    4. Urgency scoring (rules + ML)
    5. Duplicate detection (hash + FAISS)
    6. Auto-process sau adaugă în queue
    """
    doc_uuid = UUID(document_id)
    company_uuid = UUID(company_id)

    logger.info(f"[Task] Procesare document {document_id}: {filename}")

    try:
        # === STEP 1: OCR ===
        self.update_state(state="OCR_PROCESSING", meta={"step": "ocr", "progress": 10})
        logger.info(f"[{document_id}] Step 1: OCR processing")

        file_bytes = Path(file_path).read_bytes()

        from app.processors.ocr_processor import ocr_processor

        if filename.lower().endswith(".pdf"):
            ocr_result = ocr_processor.process_pdf(file_bytes, filename)
        else:
            ocr_result = ocr_processor.process_image(file_bytes, filename)

        if ocr_result.get("error"):
            logger.error(f"[{document_id}] OCR error: {ocr_result['error']}")
            _run_async(_update_document_status(doc_uuid, "ocr_failed", ocr_result))
            return {"status": "ocr_failed", "error": ocr_result["error"]}

        ocr_text = ocr_result.get("text", "")
        avg_confidence = ocr_result.get("avg_confidence", 0.0)
        flagged_words = ocr_result.get("flagged_words", [])

        logger.info(
            f"[{document_id}] OCR completat: {ocr_result.get('word_count', 0)} cuvinte, "
            f"confidence: {avg_confidence:.2%}"
        )

        # === STEP 2: Classification ===
        self.update_state(state="CLASSIFYING", meta={"step": "classify", "progress": 30})
        logger.info(f"[{document_id}] Step 2: Classification")

        from app.processors.classifier import document_classifier
        doc_type, type_confidence = document_classifier.classify(ocr_text)

        logger.info(f"[{document_id}] Clasificat ca: {doc_type} ({type_confidence:.2%})")

        # === STEP 3: Entity Extraction ===
        self.update_state(state="EXTRACTING", meta={"step": "extract", "progress": 50})
        logger.info(f"[{document_id}] Step 3: Entity extraction")

        from app.processors.ner_extractor import ner_extractor
        entities = ner_extractor.extract(ocr_text)

        entity_count = sum(len(v) for v in entities.values())
        logger.info(f"[{document_id}] Extrase {entity_count} entități din {len(entities)} tipuri")

        # === STEP 4: Urgency Scoring ===
        self.update_state(state="SCORING", meta={"step": "urgency", "progress": 65})
        logger.info(f"[{document_id}] Step 4: Urgency scoring")

        from app.processors.urgency_scorer import urgency_scorer

        total_amount = None
        if "total" in entities and entities["total"]:
            try:
                total_str = entities["total"][0]["value"].replace(",", ".").replace(" ", "")
                total_amount = float(total_str)
            except (ValueError, IndexError):
                pass

        urgency_score, urgency_breakdown = urgency_scorer.score(
            document_type=doc_type,
            total_amount=total_amount,
            avg_ocr_confidence=avg_confidence,
            ocr_text=ocr_text,
        )

        logger.info(f"[{document_id}] Urgency score: {urgency_score}")

        # === STEP 5: Duplicate Detection ===
        self.update_state(state="DUPLICATE_CHECK", meta={"step": "duplicate", "progress": 80})
        logger.info(f"[{document_id}] Step 5: Duplicate check")

        from app.core.security import compute_document_fingerprint
        from app.services.document_service import compute_file_hash

        file_hash = compute_file_hash(file_bytes)

        vendor_cui = ""
        if "cui" in entities and entities["cui"]:
            vendor_cui = entities["cui"][0]["value"]
        date_str = ""
        if "date" in entities and entities["date"]:
            date_str = entities["date"][0]["value"]
        total_str = str(total_amount or "")

        fingerprint = compute_document_fingerprint(vendor_cui, date_str, total_str, doc_type)

        duplicate_id = _run_async(
            _check_duplicate(company_uuid, fingerprint, file_hash)
        )

        is_duplicate = duplicate_id is not None
        if is_duplicate:
            logger.warning(f"[{document_id}] DUPLICAT detectat: {duplicate_id}")

        # === STEP 6: Save Results + Auto-process ===
        self.update_state(state="FINALIZING", meta={"step": "finalize", "progress": 90})
        logger.info(f"[{document_id}] Step 6: Saving results")

        result = _run_async(_save_processing_results(
            document_id=doc_uuid,
            company_id=company_uuid,
            ocr_text=ocr_text,
            ocr_data=ocr_result,
            doc_type=doc_type,
            type_confidence=type_confidence,
            entities=entities,
            urgency_score=urgency_score,
            urgency_breakdown=urgency_breakdown,
            avg_confidence=avg_confidence,
            has_flagged=len(flagged_words) > 0,
            fingerprint=fingerprint,
            file_hash=file_hash,
            duplicate_id=duplicate_id,
            encryption_key_ref=encryption_key_ref,
        ))

        # FAISS index update
        try:
            from app.processors.recommender import document_recommender
            document_recommender.add_document(document_id, ocr_text)
            document_recommender.save_index()
        except Exception as e:
            logger.warning(f"[{document_id}] FAISS update failed: {e}")

        # WebSocket notification
        _notify_websocket(document_id, result)

        logger.info(f"[{document_id}] Procesare completă. Status: {result['status']}")
        return result

    except Exception as e:
        logger.exception(f"[{document_id}] Eroare la procesare: {e}")
        _run_async(_update_document_status(doc_uuid, "processing_failed", {"error": str(e)}))
        raise


async def _update_document_status(document_id: UUID, status: str, extra_data: dict = None):
    """Update status document în DB."""
    from app.core.database import AsyncSessionLocal
    from app.models.document import Document
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        stmt = select(Document).where(Document.id == document_id)
        result = await db.execute(stmt)
        doc = result.scalar_one_or_none()
        if doc:
            doc.status = status
            await db.commit()


async def _check_duplicate(company_id: UUID, fingerprint: str, file_hash: str):
    """Check duplicate în DB."""
    from app.core.database import AsyncSessionLocal
    from app.services.document_service import check_duplicate

    async with AsyncSessionLocal() as db:
        return await check_duplicate(db, company_id, fingerprint, file_hash)


async def _save_processing_results(
    document_id, company_id, ocr_text, ocr_data,
    doc_type, type_confidence, entities,
    urgency_score, urgency_breakdown,
    avg_confidence, has_flagged, fingerprint, file_hash,
    duplicate_id, encryption_key_ref,
) -> dict:
    """Salvează toate rezultatele procesării în DB."""
    from app.core.database import AsyncSessionLocal
    from app.core.security import get_encryption
    from app.models.document import Document
    from app.services.document_service import create_extracted_fields, should_auto_process
    from sqlalchemy import select
    from datetime import datetime, timezone

    async with AsyncSessionLocal() as db:
        stmt = select(Document).where(Document.id == document_id)
        result = await db.execute(stmt)
        doc = result.scalar_one_or_none()

        if not doc:
            return {"status": "error", "error": "Document not found"}

        # Criptăm textul OCR
        try:
            enc = get_encryption(encryption_key_ref)
            doc.raw_ocr_text_encrypted = enc.encrypt(ocr_text)
        except Exception:
            doc.raw_ocr_text_encrypted = ocr_text

        doc.ocr_data = {
            "blocks": ocr_data.get("blocks", []),
            "sections": ocr_data.get("sections", {}),
            "word_count": ocr_data.get("word_count", 0),
        }
        doc.document_type = doc_type
        doc.document_type_confidence = type_confidence
        doc.avg_ocr_confidence = avg_confidence
        doc.has_flagged_fields = has_flagged
        doc.urgency_score = urgency_score
        doc.urgency_breakdown = urgency_breakdown
        doc.fingerprint = fingerprint
        doc.file_hash = file_hash
        doc.processed_at = datetime.now(timezone.utc)

        if duplicate_id:
            doc.duplicate_of_id = duplicate_id
            doc.status = "duplicate_detected"
        elif await should_auto_process(doc, entities, db):
            doc.status = "pending_approval"
        else:
            doc.status = "requires_manual_completion"

        # Salvează câmpurile extrase
        await create_extracted_fields(db, document_id, entities, encryption_key_ref)

        await db.commit()

        return {
            "status": doc.status,
            "document_type": doc_type,
            "urgency_score": urgency_score,
            "entity_count": sum(len(v) for v in entities.values()),
            "avg_confidence": avg_confidence,
            "is_duplicate": duplicate_id is not None,
        }


def _notify_websocket(document_id: str, result: dict):
    """Trimite notificare WebSocket (via Redis pub/sub)."""
    try:
        import redis
        r = redis.from_url(settings.REDIS_URL)
        import json
        r.publish(
            f"document:{document_id}",
            json.dumps({"event": "processing_complete", "data": result}),
        )
        r.publish(
            "queue:update",
            json.dumps({"event": "queue_updated", "document_id": document_id}),
        )
    except Exception as e:
        logger.warning(f"WebSocket notification failed: {e}")


@celery_app.task(name="recalculate_urgency_scores")
def recalculate_urgency_scores_task():
    """Task zilnic: recalculează urgency scores pentru documentele active."""
    logger.info("[Task] Recalculare urgency scores")
    _run_async(_recalculate_all_scores())


async def _recalculate_all_scores():
    """Recalculează scorul de urgență pentru toate documentele active."""
    from app.core.database import AsyncSessionLocal
    from app.models.document import Document
    from app.processors.urgency_scorer import urgency_scorer
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        stmt = select(Document).where(
            Document.status.in_([
                "pending_approval",
                "requires_manual_completion",
            ])
        )
        result = await db.execute(stmt)
        docs = result.scalars().all()

        for doc in docs:
            new_score, breakdown = urgency_scorer.score(
                document_type=doc.document_type or "other",
                avg_ocr_confidence=doc.avg_ocr_confidence or 1.0,
            )
            doc.urgency_score = new_score
            doc.urgency_breakdown = breakdown

        await db.commit()
        logger.info(f"[Task] Recalculate urgency: {len(docs)} documente actualizate")

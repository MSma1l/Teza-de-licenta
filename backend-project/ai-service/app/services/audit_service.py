"""
Service: Audit Log - append-only cu integritate blockchain-style.
"""

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from loguru import logger
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import compute_audit_hash, get_encryption
from app.models.audit_log import AuditLog


async def append_audit_log(
    db: AsyncSession,
    action: str,
    user_id: UUID,
    document_id: Optional[UUID] = None,
    details: str = "",
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    encryption_key: Optional[str] = None,
) -> AuditLog:
    """
    Adaugă o intrare în audit log cu hash chain.
    """
    # Obținem ultimul hash
    stmt = select(AuditLog).order_by(desc(AuditLog.timestamp)).limit(1)
    result = await db.execute(stmt)
    last_entry = result.scalar_one_or_none()
    previous_hash = last_entry.entry_hash if last_entry else "0" * 64

    timestamp = datetime.now(timezone.utc)

    # Calculăm hash-ul curent
    entry_hash = compute_audit_hash(
        action=action,
        user_id=user_id,
        document_id=document_id,
        timestamp=timestamp,
        details=details,
        previous_hash=previous_hash,
    )

    # Criptăm detaliile
    details_encrypted = None
    if details:
        try:
            enc = get_encryption(encryption_key)
            details_encrypted = enc.encrypt(details)
        except Exception:
            details_encrypted = details  # Fallback fără criptare

    entry = AuditLog(
        action_type=action,
        user_id=user_id,
        document_id=document_id,
        ip_address=ip_address,
        user_agent=user_agent,
        details_encrypted=details_encrypted,
        previous_hash=previous_hash,
        entry_hash=entry_hash,
        timestamp=timestamp,
    )

    db.add(entry)
    logger.debug(f"Audit log: {action} by {user_id}")
    return entry


async def verify_audit_chain(db: AsyncSession) -> dict:
    """
    Verifică integritatea lanțului de audit.
    Returnează {"valid": bool, "broken_at": int | None}.
    """
    stmt = select(AuditLog).order_by(AuditLog.timestamp)
    result = await db.execute(stmt)
    entries = result.scalars().all()

    if not entries:
        return {"valid": True, "total_entries": 0}

    previous_hash = "0" * 64
    for i, entry in enumerate(entries):
        if entry.previous_hash != previous_hash:
            logger.error(f"Audit chain broken at entry {i} (id={entry.id})")
            return {"valid": False, "broken_at": i, "entry_id": str(entry.id)}
        previous_hash = entry.entry_hash

    return {"valid": True, "total_entries": len(entries)}

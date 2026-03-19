"""
Securitate: AES-256-GCM encryption, JWT validation, audit log.
"""

import os
import base64
import hashlib
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from jose import jwt, JWTError
from loguru import logger

from app.core.config import settings


# ==========================================
#  AES-256-GCM Field Encryption
# ==========================================

class FieldEncryption:
    """Criptare/decriptare câmpuri cu AES-256-GCM.
    Cheia este per company (tenant isolation)."""

    def __init__(self, key: bytes):
        if len(key) != 32:
            raise ValueError("AES-256 necesită cheie de 32 bytes")
        self.aesgcm = AESGCM(key)

    def encrypt(self, plaintext: str) -> str:
        """Criptează text -> base64(nonce + ciphertext)."""
        nonce = os.urandom(12)
        ct = self.aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
        return base64.b64encode(nonce + ct).decode("utf-8")

    def decrypt(self, ciphertext: str) -> str:
        """Decriptează base64(nonce + ciphertext) -> text."""
        data = base64.b64decode(ciphertext)
        nonce, ct = data[:12], data[12:]
        return self.aesgcm.decrypt(nonce, ct, None).decode("utf-8")


def get_encryption(key_base64: Optional[str] = None) -> FieldEncryption:
    """Obține instanța de criptare pentru o cheie dată."""
    key_b64 = key_base64 or settings.ENCRYPTION_KEY_DEFAULT
    if not key_b64:
        raise ValueError("ENCRYPTION_KEY_DEFAULT nu este setat")
    key_bytes = base64.b64decode(key_b64)
    return FieldEncryption(key_bytes)


# ==========================================
#  JWT Token Validation
# ==========================================

def verify_token(token: str) -> dict:
    """Verifică și decodifică un JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        if payload.get("type") != "access":
            raise JWTError("Token invalid: tip incorect")
        return payload
    except JWTError as e:
        logger.warning(f"Token JWT invalid: {e}")
        raise


# ==========================================
#  Audit Log Hashing (blockchain-style)
# ==========================================

def compute_audit_hash(
    action: str,
    user_id: UUID,
    document_id: Optional[UUID],
    timestamp: datetime,
    details: str,
    previous_hash: str,
) -> str:
    """Calculează hash-ul pentru o intrare audit log (tamper-evident)."""
    entry_data = f"{action}|{user_id}|{document_id}|{timestamp.isoformat()}|{details}"
    combined = entry_data + previous_hash
    return hashlib.sha256(combined.encode("utf-8")).hexdigest()


def compute_document_fingerprint(
    vendor_cui: str,
    date: str,
    total_amount: str,
    doc_type: str,
) -> str:
    """Generează fingerprint unic pentru detectarea duplicatelor exacte."""
    data = f"{vendor_cui}|{date}|{total_amount}|{doc_type}"
    return hashlib.sha256(data.encode("utf-8")).hexdigest()

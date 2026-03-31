"""
Teste pytest pentru procesoarele AI: classifier, NER, urgency, encryption.
Nu necesită PyTorch/PaddleOCR - testează logica fallback (regex/keyword).
"""

import pytest
import base64
import os


class TestClassifierKeywordFallback:
    """Testează clasificarea pe baza de cuvinte cheie (fallback)."""

    @pytest.fixture(autouse=True)
    def setup(self):
        from app.processors.classifier import document_classifier
        self.classifier = document_classifier

    def test_classify_invoice(self):
        text = "FACTURA FISCALĂ nr. FA-2026-001 din 15.03.2026 Furnizor: SC Test SRL"
        doc_type, confidence = self.classifier.classify(text)
        assert doc_type == "invoice"
        assert confidence > 0

    def test_classify_receipt(self):
        text = "BON FISCAL Nr. 00234 Data: 15.03.2026 Total: 45.50 RON"
        doc_type, confidence = self.classifier.classify(text)
        assert doc_type == "receipt"

    def test_classify_contract(self):
        text = "CONTRACT DE PRESTĂRI SERVICII încheiat între părțile semnatare"
        doc_type, confidence = self.classifier.classify(text)
        assert doc_type == "contract"

    def test_classify_bank_statement(self):
        text = "EXTRAS DE CONT pentru perioada 01.03-31.03.2026 Sold inițial: 15000 RON"
        doc_type, confidence = self.classifier.classify(text)
        assert doc_type == "bank_statement"

    def test_classify_payroll(self):
        text = "STAT DE PLATĂ pentru luna martie 2026 Salariu brut: 8500 RON"
        doc_type, confidence = self.classifier.classify(text)
        assert doc_type == "payroll"

    def test_classify_tax_declaration(self):
        text = "DECLARAȚIA 112 privind obligațiile de plată ANAF contribuții sociale"
        doc_type, confidence = self.classifier.classify(text)
        assert doc_type == "tax_declaration"

    def test_classify_unknown(self):
        text = "Lorem ipsum dolor sit amet consectetur adipiscing elit"
        doc_type, confidence = self.classifier.classify(text)
        assert doc_type == "other"


class TestNERRegexFallback:
    """Testează extracția de entități cu regex (fallback)."""

    @pytest.fixture(autouse=True)
    def setup(self):
        from app.processors.ner_extractor import ner_extractor
        self.extractor = ner_extractor

    def test_extract_invoice_number(self):
        text = "Nr. factura: FA 00123 din data de 15.03.2026"
        entities = self.extractor.extract(text)
        assert "invoice_num" in entities
        assert any("00123" in e["value"] for e in entities["invoice_num"])

    def test_extract_date(self):
        text = "Data emiterii: 15.03.2026 Scadenta: 30.03.2026"
        entities = self.extractor.extract(text)
        assert "date" in entities
        assert len(entities["date"]) >= 1

    def test_extract_cui(self):
        text = "CUI: RO12345678 Furnizor: SC Test SRL"
        entities = self.extractor.extract(text)
        assert "cui" in entities
        assert any("12345678" in e["value"] for e in entities["cui"])

    def test_extract_total(self):
        text = "Total de plata: 1500.00 RON TVA inclus"
        entities = self.extractor.extract(text)
        assert "total" in entities
        assert any("1500" in e["value"] for e in entities["total"])

    def test_extract_iban(self):
        text = "IBAN: RO49AAAA1B31007593840000"
        entities = self.extractor.extract(text)
        assert "iban" in entities

    def test_extract_vat(self):
        text = "TVA 19%: 285.00 lei Subtotal: 1500.00"
        entities = self.extractor.extract(text)
        assert "vat" in entities

    def test_extract_empty_text(self):
        entities = self.extractor.extract("")
        assert isinstance(entities, dict)

    def test_confidence_is_regex_level(self):
        text = "CUI: RO12345678"
        entities = self.extractor.extract(text)
        if "cui" in entities:
            assert entities["cui"][0]["confidence"] == 0.7  # regex confidence


class TestUrgencyScorer:
    """Testează scorul de urgență bazat pe reguli."""

    @pytest.fixture(autouse=True)
    def setup(self):
        from app.processors.urgency_scorer import urgency_scorer
        self.scorer = urgency_scorer

    def test_invoice_base_score(self):
        score, breakdown = self.scorer.score(
            document_type="invoice",
            total_amount=1000,
            avg_ocr_confidence=0.95,
        )
        assert 0 <= score <= 100
        assert isinstance(breakdown, dict)

    def test_high_amount_increases_urgency(self):
        score_low, _ = self.scorer.score(document_type="invoice", total_amount=100)
        score_high, _ = self.scorer.score(document_type="invoice", total_amount=100000)
        assert score_high >= score_low

    def test_tax_declaration_high_urgency(self):
        score, breakdown = self.scorer.score(document_type="tax_declaration")
        assert score > 0  # tax declarations have base urgency

    def test_score_capped_at_100(self):
        score, _ = self.scorer.score(
            document_type="tax_declaration",
            total_amount=999999,
            avg_ocr_confidence=0.3,
            ocr_text="urgent termen limita scadent astazi overdue",
        )
        assert score <= 100


class TestEncryption:
    """Testează AES-256-GCM encryption/decryption."""

    def test_encrypt_decrypt_roundtrip(self):
        from app.core.security import FieldEncryption
        key = os.urandom(32)
        enc = FieldEncryption(key)

        plaintext = "RO12345678 - CUI Test Company"
        ciphertext = enc.encrypt(plaintext)
        assert ciphertext != plaintext

        decrypted = enc.decrypt(ciphertext)
        assert decrypted == plaintext

    def test_different_nonces(self):
        from app.core.security import FieldEncryption
        key = os.urandom(32)
        enc = FieldEncryption(key)

        ct1 = enc.encrypt("same text")
        ct2 = enc.encrypt("same text")
        assert ct1 != ct2  # different nonces = different ciphertext

    def test_wrong_key_fails(self):
        from app.core.security import FieldEncryption
        key1 = os.urandom(32)
        key2 = os.urandom(32)
        enc1 = FieldEncryption(key1)
        enc2 = FieldEncryption(key2)

        ct = enc1.encrypt("secret data")
        with pytest.raises(Exception):
            enc2.decrypt(ct)

    def test_invalid_key_length(self):
        from app.core.security import FieldEncryption
        with pytest.raises(ValueError, match="32 bytes"):
            FieldEncryption(b"short")

    def test_encrypt_unicode(self):
        from app.core.security import FieldEncryption
        key = os.urandom(32)
        enc = FieldEncryption(key)

        text = "Factura românească: ăâîșț €"
        assert enc.decrypt(enc.encrypt(text)) == text


class TestAuditHash:
    """Testează integritatea hash-urilor audit."""

    def test_compute_audit_hash(self):
        from app.core.security import compute_audit_hash
        from datetime import datetime, timezone
        from uuid import uuid4

        h = compute_audit_hash(
            action="document_upload",
            user_id=uuid4(),
            document_id=uuid4(),
            timestamp=datetime.now(timezone.utc),
            details="test upload",
            previous_hash="0" * 64,
        )
        assert len(h) == 64  # SHA256 hex

    def test_hash_chain_integrity(self):
        from app.core.security import compute_audit_hash
        from datetime import datetime, timezone
        from uuid import uuid4

        prev = "0" * 64
        hashes = []
        for i in range(5):
            h = compute_audit_hash(
                action=f"action_{i}",
                user_id=uuid4(),
                document_id=None,
                timestamp=datetime.now(timezone.utc),
                details=f"detail {i}",
                previous_hash=prev,
            )
            hashes.append(h)
            prev = h

        # All hashes should be unique
        assert len(set(hashes)) == 5

    def test_hash_deterministic(self):
        from app.core.security import compute_audit_hash
        from datetime import datetime, timezone
        from uuid import UUID

        uid = UUID("12345678-1234-5678-1234-567812345678")
        ts = datetime(2026, 3, 31, 12, 0, 0, tzinfo=timezone.utc)

        h1 = compute_audit_hash("test", uid, None, ts, "details", "0" * 64)
        h2 = compute_audit_hash("test", uid, None, ts, "details", "0" * 64)
        assert h1 == h2


class TestDocumentFingerprint:
    """Testează generarea fingerprint-ului de document."""

    def test_same_data_same_fingerprint(self):
        from app.core.security import compute_document_fingerprint
        fp1 = compute_document_fingerprint("RO12345678", "15.03.2026", "1500.00", "invoice")
        fp2 = compute_document_fingerprint("RO12345678", "15.03.2026", "1500.00", "invoice")
        assert fp1 == fp2

    def test_different_data_different_fingerprint(self):
        from app.core.security import compute_document_fingerprint
        fp1 = compute_document_fingerprint("RO12345678", "15.03.2026", "1500.00", "invoice")
        fp2 = compute_document_fingerprint("RO87654321", "15.03.2026", "1500.00", "invoice")
        assert fp1 != fp2

    def test_fingerprint_length(self):
        from app.core.security import compute_document_fingerprint
        fp = compute_document_fingerprint("CUI", "DATE", "AMOUNT", "TYPE")
        assert len(fp) == 64

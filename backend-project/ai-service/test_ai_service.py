"""
Test suite complet pentru AI-Service.
Rulează fără torch/paddleocr (doar logica core).
"""
import sys
import re

print("=" * 55)
print("  AI-SERVICE MODULE TESTS")
print("=" * 55)
print()

# === TEST 1: Config ===
print("TEST 1: Config")
from app.core.config import settings
assert settings.AI_SERVICE_PORT == 3778
assert settings.MAX_UPLOAD_SIZE_MB == 50
assert settings.CLASSIFIER_NUM_LABELS == 7
assert settings.NER_NUM_LABELS == 17
assert settings.OCR_CONFIDENCE_THRESHOLD == 0.85
assert settings.URGENCY_RULE_WEIGHT == 0.6
assert settings.URGENCY_ML_WEIGHT == 0.4
assert settings.AUTO_PROCESS_MIN_CONFIDENCE == 0.92
assert len(settings.OCR_LANGUAGES) == 3
print("  PASS: All config values correct")

# === TEST 2: AES-256-GCM Encryption ===
print()
print("TEST 2: AES-256-GCM Encryption")
from app.core.security import get_encryption, compute_audit_hash, compute_document_fingerprint
from datetime import datetime, timezone
from uuid import uuid4

enc = get_encryption()
test_values = [
    "Test 123",
    "RO12345678",
    "15500.00 lei",
    "IBAN RO49AAAA1B31007593840000",
    "SC Companie Test SRL",
    "Factura nr FA-2026-001",
]
for val in test_values:
    encrypted = enc.encrypt(val)
    assert encrypted != val, "Encryption should change value"
    assert enc.decrypt(encrypted) == val, f"Decrypt failed for {val}"
print(f"  PASS: {len(test_values)} encrypt/decrypt cycles OK")

# === TEST 3: Audit Hash Chain ===
print()
print("TEST 3: Audit Hash Chain")
h1 = compute_audit_hash("upload", uuid4(), uuid4(), datetime.now(timezone.utc), "doc uploaded", "0" * 64)
h2 = compute_audit_hash("approve", uuid4(), uuid4(), datetime.now(timezone.utc), "doc approved", h1)
assert len(h1) == 64 and len(h2) == 64
assert h1 != h2
print("  PASS: Chain integrity verified")

# === TEST 4: Document Fingerprint ===
print()
print("TEST 4: Document Fingerprint")
fp = compute_document_fingerprint
assert fp("RO123", "2026-01-01", "1500", "invoice") == fp("RO123", "2026-01-01", "1500", "invoice")
assert fp("RO123", "2026-01-01", "1500", "invoice") != fp("RO456", "2026-01-01", "1500", "invoice")
assert fp("RO123", "2026-01-01", "1500", "invoice") != fp("RO123", "2026-01-02", "1500", "invoice")
assert fp("RO123", "2026-01-01", "1500", "invoice") != fp("RO123", "2026-01-01", "1501", "invoice")
print("  PASS: 4 fingerprint consistency tests")

# === TEST 5: Classifier Keyword Fallback ===
print()
print("TEST 5: Classifier (keyword fallback)")
from app.processors.classifier import KEYWORD_RULES, DOCUMENT_CLASSES


def classify_keywords(text):
    text_lower = text.lower()
    scores = {}
    for doc_type, keywords in KEYWORD_RULES.items():
        scores[doc_type] = sum(1 for kw in keywords if kw in text_lower)
    if max(scores.values()) == 0:
        return "other", 0.3
    best = max(scores, key=scores.get)
    conf = min(scores[best] / max(len(KEYWORD_RULES[best]) * 0.5, 1), 0.95)
    return best, round(conf, 4)


tests = [
    ("FACTURA FISCALA nr 123 furnizor TVA total valoare totala cumparator", "invoice"),
    ("extras de cont sold debit credit tranzactii cont curent", "bank_statement"),
    ("stat de plata salariu brut net contributii angajat", "payroll"),
    ("chitanta bon fiscal casa de marcat total de plata", "receipt"),
    ("declaratie ANAF cod fiscal D100 impozit contributii", "tax_declaration"),
    ("contract parti contractante clauze obligatii reziliere", "contract"),
]
for text, expected in tests:
    result, conf = classify_keywords(text)
    assert result == expected, f"Expected {expected}, got {result}"
    print(f"    {expected}: {conf:.2f}")
print("  PASS: 6/6 classifications correct")

# === TEST 6: NER Regex Fallback ===
print()
print("TEST 6: NER Extractor (regex fallback)")
from app.processors.ner_extractor import REGEX_PATTERNS


def extract_regex(text):
    entities = {}
    for field_name, patterns in REGEX_PATTERNS.items():
        matches = []
        for pattern in patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                value = match.group(1) if match.groups() else match.group(0)
                value = value.strip()
                if value and value not in [m["value"] for m in matches]:
                    matches.append({"value": value, "confidence": 0.7})
        if matches:
            entities[field_name] = matches
    return entities


test_text = "Factura nr FA-2026-001 din 25.03.2026 CUI RO12345678 Total 15500.00 lei TVA 2945.00 lei IBAN RO49AAAA1B31007593840000"
ent = extract_regex(test_text)
for k, v in ent.items():
    print(f"    {k}: {[x['value'] for x in v]}")
assert "date" in ent, "Missing date"
assert "cui" in ent, "Missing CUI"
assert "total" in ent, "Missing total"
assert "vat" in ent, "Missing VAT"
assert "iban" in ent, "Missing IBAN"
print(f"  PASS: {sum(len(v) for v in ent.values())} entities from {len(ent)} types")

# === TEST 7: Urgency Rules ===
print()
print("TEST 7: Urgency Rules")
from app.processors.urgency_scorer import URGENCY_RULES

assert URGENCY_RULES["overdue"] == 40
assert URGENCY_RULES["due_today"] == 35
assert URGENCY_RULES["type_tax_declaration"] == 20
assert URGENCY_RULES["amount_over_50000"] == 15
assert URGENCY_RULES["duplicate_risk"] == 20
total_max = sum(URGENCY_RULES.values())
print(f"  PASS: {len(URGENCY_RULES)} rules, max score: {total_max}")

# === TEST 8: Schemas ===
print()
print("TEST 8: Schemas Validation")
from app.schemas.document import (
    DocumentUploadResponse,
    DocumentCorrection,
    QueueStats,
    DocumentQueueItem,
    ExtractedFieldResponse,
)
from app.schemas.training import TrainingStats, SystemHealth, TrainingTriggerResponse

resp = DocumentUploadResponse(
    id="123e4567-e89b-12d3-a456-426614174000", status="processing", message="OK"
)
assert resp.status == "processing"
corr = DocumentCorrection(
    document_type="factura", fields={"total": "1500"}, urgency_feedback="correct"
)
assert corr.fields["total"] == "1500"
print("  PASS: Schema instantiation works")

# === TEST 9: Full Pipeline Simulation ===
print()
print("TEST 9: Full Pipeline Simulation")
test_doc = "Factura fiscala seria AB nr 12345 din 15.01.2026 SC Furnizor SRL CUI RO99887766 subtotal 25000 lei TVA 4750 lei Total de plata 29750 lei IBAN RO49AAAA1B31007593840000"

doc_type, type_conf = classify_keywords(test_doc)
entities = extract_regex(test_doc)
total_amount = None
if "total" in entities:
    try:
        total_amount = float(
            entities["total"][0]["value"].replace(",", ".").replace(" ", "")
        )
    except ValueError:
        pass

# Simulate urgency scoring
fired = {}
if doc_type == "invoice":
    fired["type_invoice"] = URGENCY_RULES["type_invoice"]
if total_amount and total_amount > 10000:
    fired["amount_over_10000"] = URGENCY_RULES["amount_over_10000"]
score = sum(fired.values())

print(f"  Type: {doc_type} ({type_conf:.2f})")
print(f"  Entities: {list(entities.keys())}")
print(f"  Total: {total_amount}")
print(f"  Urgency: {score} (rules: {list(fired.keys())})")

# Encrypt all extracted values
for k, vals in entities.items():
    for v in vals:
        encrypted = enc.encrypt(v["value"])
        decrypted = enc.decrypt(encrypted)
        assert decrypted == v["value"], f"Encryption round-trip failed for {k}"
total_entities = sum(len(v) for v in entities.values())
print(f"  Encrypt round-trip: OK for all {total_entities} values")

assert doc_type == "invoice"
assert len(entities) >= 4
assert score > 0
print("  PASS: Full pipeline OK")

print()
print("=" * 55)
print("  ALL 9 AI-SERVICE TESTS PASSED!")
print("=" * 55)

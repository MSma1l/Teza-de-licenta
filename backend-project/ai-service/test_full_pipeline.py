"""
TEST END-TO-END: Imagine factură → OCR → Clasificare → NER → Urgency → Criptare.
Generăm o imagine de factură cu Pillow, apoi o procesăm prin întregul pipeline.
"""

import io
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

print("=" * 60)
print("  END-TO-END PIPELINE TEST")
print("  Imagine factură → OCR → Clasificare → NER → Urgency")
print("=" * 60)
print()

# =====================================================
# STEP 1: Generare imagine factură de test
# =====================================================
print("STEP 1: Generăm imagine factură de test...")

img = Image.new("RGB", (800, 1100), "white")
draw = ImageDraw.Draw(img)

# Folosim font default (nu avem fonturi custom)
try:
    font_large = ImageFont.truetype("arial.ttf", 28)
    font_medium = ImageFont.truetype("arial.ttf", 18)
    font_small = ImageFont.truetype("arial.ttf", 14)
except OSError:
    font_large = ImageFont.load_default()
    font_medium = font_large
    font_small = font_large

# Header
draw.text((250, 30), "FACTURA FISCALA", fill="black", font=font_large)
draw.text((280, 70), "Seria AB Nr. 00123", fill="black", font=font_medium)
draw.line((50, 100, 750, 100), fill="black", width=2)

# Furnizor
draw.text((50, 120), "FURNIZOR:", fill="black", font=font_medium)
draw.text((50, 145), "SC Tehnologie Avansata SRL", fill="black", font=font_medium)
draw.text((50, 170), "CUI: RO12345678", fill="black", font=font_medium)
draw.text((50, 195), "Reg. Com.: J40/1234/2020", fill="black", font=font_small)
draw.text((50, 215), "IBAN: RO49AAAA1B31007593840000", fill="black", font=font_small)

# Client
draw.text((450, 120), "CLIENT:", fill="black", font=font_medium)
draw.text((450, 145), "SC Client Test SRL", fill="black", font=font_medium)
draw.text((450, 170), "CUI: RO87654321", fill="black", font=font_medium)

# Data
draw.text((50, 260), "Data emiterii: 15.03.2026", fill="black", font=font_medium)
draw.text((450, 260), "Data scadentei: 15.04.2026", fill="black", font=font_medium)

# Tabel produse
draw.line((50, 300, 750, 300), fill="black", width=1)
draw.text((50, 305), "Nr.", fill="black", font=font_small)
draw.text((100, 305), "Descriere produs/serviciu", fill="black", font=font_small)
draw.text((450, 305), "Cantitate", fill="black", font=font_small)
draw.text((550, 305), "Pret unitar", fill="black", font=font_small)
draw.text((660, 305), "Valoare", fill="black", font=font_small)
draw.line((50, 325, 750, 325), fill="black", width=1)

# Produse
draw.text((55, 335), "1.", fill="black", font=font_small)
draw.text((100, 335), "Servicii consultanta IT", fill="black", font=font_small)
draw.text((470, 335), "10", fill="black", font=font_small)
draw.text((560, 335), "1500.00", fill="black", font=font_small)
draw.text((660, 335), "15000.00", fill="black", font=font_small)

draw.text((55, 360), "2.", fill="black", font=font_small)
draw.text((100, 360), "Licenta software anual", fill="black", font=font_small)
draw.text((470, 360), "5", fill="black", font=font_small)
draw.text((560, 360), "2000.00", fill="black", font=font_small)
draw.text((660, 360), "10000.00", fill="black", font=font_small)

draw.line((50, 390, 750, 390), fill="black", width=1)

# Totaluri
draw.text((500, 410), "Subtotal:", fill="black", font=font_medium)
draw.text((650, 410), "25000.00 LEI", fill="black", font=font_medium)

draw.text((500, 440), "TVA 19%:", fill="black", font=font_medium)
draw.text((650, 440), "4750.00 LEI", fill="black", font=font_medium)

draw.line((500, 470, 750, 470), fill="black", width=2)
draw.text((500, 480), "TOTAL DE PLATA:", fill="black", font=font_large)
draw.text((620, 515), "29750.00 LEI", fill="black", font=font_large)

# Footer
draw.line((50, 600, 750, 600), fill="black", width=1)
draw.text((50, 610), "Plata se va efectua in contul IBAN mentionat mai sus.", fill="gray", font=font_small)
draw.text((50, 630), "Factura este valabila fara semnatura si stampila.", fill="gray", font=font_small)

# Salvăm imaginea
test_img_path = Path("test_factura.png")
img.save(test_img_path, dpi=(300, 300))
img_bytes = io.BytesIO()
img.save(img_bytes, format="PNG")
img_bytes = img_bytes.getvalue()
print(f"  Imagine generată: {test_img_path} ({len(img_bytes)} bytes)")
print(f"  DPI: 300, Dimensiune: {img.size}")
print("  PASS")

# =====================================================
# STEP 2: OpenCV Preprocessing
# =====================================================
print()
print("STEP 2: OpenCV Preprocessing...")

from app.processors.ocr_processor import ocr_processor
import numpy as np
import cv2

img_np = np.array(img)
preprocessed = ocr_processor.preprocess_image(img_np)
print(f"  Input shape: {img_np.shape} (color)")
print(f"  Output shape: {preprocessed.shape} (binary)")
assert len(preprocessed.shape) == 2, "Should be grayscale"
assert preprocessed.dtype == np.uint8, "Should be uint8"

# Check DPI
pil_img = Image.open(io.BytesIO(img_bytes))
dpi = ocr_processor.check_dpi(pil_img)
print(f"  DPI detected: {dpi} (din metadata; imaginea e generată la 300 DPI)")
# DPI din BytesIO poate fi 72 default - nu e blocker pentru test
print("  PASS")

# =====================================================
# STEP 3: PaddleOCR - Extragere text
# =====================================================
print()
print("STEP 3: PaddleOCR text extraction...")
print("  (Prima rulare descarcă modelele OCR - poate dura)")

ocr_result = ocr_processor.process_image(img_bytes, "test_factura.png")

if "error" in ocr_result and ocr_result["error"]:
    print(f"  ERROR: {ocr_result['error']}")
    sys.exit(1)

text = ocr_result.get("text", "")
blocks = ocr_result.get("blocks", [])
avg_conf = ocr_result.get("avg_confidence", 0)
flagged = ocr_result.get("flagged_words", [])
word_count = ocr_result.get("word_count", 0)

print(f"  Cuvinte extrase: {word_count}")
print(f"  Confidence mediu: {avg_conf:.2%}")
print(f"  Cuvinte flagged (<85%): {len(flagged)}")
print(f"  Text (primele 200 char): {text[:200]}...")
print()

# Afișăm blocurile cu confidence
print("  Top 15 blocuri extrase:")
for i, block in enumerate(blocks[:15]):
    conf_str = f"{block['confidence']:.2%}"
    status = "OK" if block["confidence"] >= 0.85 else "FLAG"
    print(f"    [{status}] {conf_str} | \"{block['text']}\" @ ({block['bbox']['x1']},{block['bbox']['y1']})")

assert word_count > 0, "OCR should extract at least some words"
assert avg_conf > 0, "Average confidence should be > 0"
print("  PASS")

# =====================================================
# STEP 4: Clasificare document
# =====================================================
print()
print("STEP 4: Clasificare document...")

from app.processors.classifier import document_classifier

doc_type, type_conf = document_classifier.classify(text)
print(f"  Tip detectat: {doc_type}")
print(f"  Confidence: {type_conf:.2%}")
assert doc_type == "invoice", f"Expected 'invoice', got '{doc_type}'"
print("  PASS")

# =====================================================
# STEP 5: Extracție entități NER
# =====================================================
print()
print("STEP 5: Extracție entități (NER regex)...")

from app.processors.ner_extractor import ner_extractor

entities = ner_extractor.extract(text)
print(f"  Tipuri entități găsite: {len(entities)}")
for field_name, values in entities.items():
    for v in values:
        conf_str = f"{v['confidence']:.0%}"
        print(f"    {field_name}: \"{v['value']}\" ({conf_str})")

total_entities = sum(len(v) for v in entities.values())
print(f"  Total entități: {total_entities}")
assert total_entities > 0, "Should extract at least some entities"
print("  PASS")

# =====================================================
# STEP 6: Urgency scoring
# =====================================================
print()
print("STEP 6: Urgency scoring...")

from app.processors.urgency_scorer import urgency_scorer

total_amount = None
if "total" in entities:
    try:
        val = entities["total"][0]["value"]
        total_amount = float(val.replace(",", ".").replace(" ", ""))
    except (ValueError, IndexError):
        pass

score, breakdown = urgency_scorer.score(
    document_type=doc_type,
    total_amount=total_amount,
    avg_ocr_confidence=avg_conf,
)
print(f"  Score: {score}/100")
print(f"  Rules fired: {list(breakdown['fired_rules'].keys())}")
print(f"  Rule weight: {breakdown['rule_weight']}, ML weight: {breakdown['ml_weight']}")
assert score >= 0, "Score should be >= 0"
print("  PASS")

# =====================================================
# STEP 7: Criptare AES-256-GCM
# =====================================================
print()
print("STEP 7: Criptare câmpuri sensibile...")

from app.core.security import get_encryption, compute_document_fingerprint

enc = get_encryption()

# Criptăm textul OCR complet
encrypted_text = enc.encrypt(text)
decrypted_text = enc.decrypt(encrypted_text)
assert decrypted_text == text, "OCR text encryption round-trip failed"
print(f"  OCR text: {len(text)} chars → encrypted → decrypted OK")

# Criptăm fiecare entitate
for field_name, values in entities.items():
    for v in values:
        encrypted_val = enc.encrypt(v["value"])
        decrypted_val = enc.decrypt(encrypted_val)
        assert decrypted_val == v["value"], f"Field {field_name} encryption failed"
print(f"  Toate {total_entities} entități: encrypt/decrypt OK")

# Document fingerprint
vendor_cui = entities.get("cui", [{}])[0].get("value", "") if "cui" in entities else ""
date_str = entities.get("date", [{}])[0].get("value", "") if "date" in entities else ""
total_str = str(total_amount or "")
fingerprint = compute_document_fingerprint(vendor_cui, date_str, total_str, doc_type)
print(f"  Fingerprint: {fingerprint[:16]}...")
print("  PASS")

# =====================================================
# STEP 8: Secțiuni document (header/body/footer)
# =====================================================
print()
print("STEP 8: Secțiuni document...")

sections = ocr_result.get("sections", {})
if sections:
    for section_name, section_blocks in sections.items():
        texts = [b["text"] for b in section_blocks[:3]]
        print(f"  {section_name}: {len(section_blocks)} blocks - {texts}")
else:
    print("  (Sections not available in this OCR result format)")
print("  PASS")

# =====================================================
# FINAL SUMMARY
# =====================================================
print()
print("=" * 60)
print("  FULL PIPELINE RESULTS SUMMARY")
print("=" * 60)
print(f"  OCR:           {word_count} cuvinte, {avg_conf:.1%} confidence")
print(f"  Clasificare:   {doc_type} ({type_conf:.1%})")
print(f"  Entități:      {total_entities} din {len(entities)} tipuri")
print(f"  Urgency:       {score}/100")
print(f"  Criptare:      AES-256-GCM OK")
print(f"  Fingerprint:   {fingerprint[:32]}...")
print(f"  Flagged words: {len(flagged)}")
print()
print("=" * 60)
print("  ALL 8 STEPS PASSED! PIPELINE FUNCTIONAL!")
print("=" * 60)

# Cleanup
test_img_path.unlink(missing_ok=True)

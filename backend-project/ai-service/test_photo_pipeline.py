"""
TEST: Simulare poza de telefon - calitate slaba, rotita, cu zgomot.
Verificam daca pipeline-ul functioneaza si pe fotografii, nu doar scanari.
"""
import io
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont

print("=" * 60)
print("  TEST: OCR pe FOTOGRAFIE (nu scanare)")
print("=" * 60)
print()

# === Generam imagine care simuleaza o poza de telefon ===
print("STEP 1: Generam imagine tip fotografie (zgomot, rotatie, umbre)...")

img = Image.new("RGB", (800, 1100), (240, 235, 220))  # fundal bej (nu alb pur)
draw = ImageDraw.Draw(img)

try:
    font_large = ImageFont.truetype("arial.ttf", 28)
    font_medium = ImageFont.truetype("arial.ttf", 18)
    font_small = ImageFont.truetype("arial.ttf", 14)
except OSError:
    font_large = ImageFont.load_default()
    font_medium = font_large
    font_small = font_large

# Scriem textul facturii
draw.text((250, 30), "FACTURA FISCALA", fill=(20, 20, 20), font=font_large)
draw.text((280, 70), "Seria AB Nr. 00456", fill=(30, 30, 30), font=font_medium)
draw.line((50, 100, 750, 100), fill=(60, 60, 60), width=1)
draw.text((50, 120), "FURNIZOR: SC Contabilitate Pro SRL", fill=(25, 25, 25), font=font_medium)
draw.text((50, 150), "CUI: RO44556677", fill=(25, 25, 25), font=font_medium)
draw.text((50, 180), "Data: 20.03.2026", fill=(25, 25, 25), font=font_medium)
draw.text((50, 220), "Servicii consultanta", fill=(30, 30, 30), font=font_medium)
draw.text((500, 220), "5000.00 LEI", fill=(30, 30, 30), font=font_medium)
draw.text((50, 260), "TVA 19%:", fill=(30, 30, 30), font=font_medium)
draw.text((500, 260), "950.00 LEI", fill=(30, 30, 30), font=font_medium)
draw.text((50, 310), "TOTAL DE PLATA:", fill=(15, 15, 15), font=font_large)
draw.text((450, 310), "5950.00 LEI", fill=(15, 15, 15), font=font_large)

# Convertim la numpy
img_np = np.array(img)

# === Adaugam defecte de fotografie ===
# 1. Zgomot gaussian (camera telefon)
noise = np.random.normal(0, 12, img_np.shape).astype(np.int16)
img_np = np.clip(img_np.astype(np.int16) + noise, 0, 255).astype(np.uint8)

# 2. Rotatie usoara (telefon nu e perfect drept)
h, w = img_np.shape[:2]
M = cv2.getRotationMatrix2D((w // 2, h // 2), 2.5, 1.0)  # 2.5 grade
img_np = cv2.warpAffine(img_np, M, (w, h), borderValue=(230, 225, 210))

# 3. Blur usor (focus imperfect)
img_np = cv2.GaussianBlur(img_np, (3, 3), 0.8)

# 4. Umbra in colt (lumina neuniformna)
shadow = np.ones_like(img_np, dtype=np.float32)
for y in range(h):
    for x in range(w):
        factor = 1.0 - 0.15 * (x / w) * (y / h)
        shadow[y, x] = factor
img_np = np.clip(img_np * shadow, 0, 255).astype(np.uint8)

# Salvam DPI scazut (ca un telefon)
photo = Image.fromarray(img_np)
buf = io.BytesIO()
photo.save(buf, format="PNG")  # fara DPI metadata = default 72
photo_bytes = buf.getvalue()

print(f"  Dimensiune: {photo.size}, ~{len(photo_bytes)} bytes")
print(f"  Defecte aplicate: zgomot gaussian, rotatie 2.5 grade, blur, umbra")
print("  PASS")

# === Testam OCR pe fotografie ===
print()
print("STEP 2: OCR pe fotografie...")

from app.processors.ocr_processor import ocr_processor

result = ocr_processor.process_image(photo_bytes, "poza_telefon.jpg")

if result.get("error"):
    print(f"  ERROR: {result['error']}")
else:
    text = result.get("text", "")
    blocks = result.get("blocks", [])
    avg_conf = result.get("avg_confidence", 0)
    flagged = result.get("flagged_words", [])

    print(f"  Cuvinte extrase: {result['word_count']}")
    print(f"  Confidence mediu: {avg_conf:.2%}")
    print(f"  Cuvinte flagged: {len(flagged)}")
    print()
    print("  Blocuri extrase:")
    for b in blocks:
        status = "OK" if b["confidence"] >= 0.85 else "FLAG"
        print(f"    [{status}] {b['confidence']:.0%} | \"{b['text']}\"")

    # === Clasificare ===
    print()
    print("STEP 3: Clasificare...")
    from app.processors.classifier import document_classifier
    doc_type, conf = document_classifier.classify(text)
    print(f"  Tip: {doc_type} ({conf:.2%})")

    # === NER ===
    print()
    print("STEP 4: Extragere entitati...")
    from app.processors.ner_extractor import ner_extractor
    entities = ner_extractor.extract(text)
    for k, v in entities.items():
        for e in v:
            print(f"    {k}: \"{e['value']}\"")

    print()
    print("=" * 60)
    if result["word_count"] > 0:
        print(f"  FOTOGRAFIE: OCR FUNCTIONAL! ({result['word_count']} cuvinte, {avg_conf:.0%} conf)")
    else:
        print("  FOTOGRAFIE: OCR NU A EXTRAS TEXT")
    print("=" * 60)

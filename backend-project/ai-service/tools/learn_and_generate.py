"""
Generator inteligent: invata din documente REALE si genereaza variatii.

FLUX:
  1. Pui 5-10 documente reale in: training_data/real_templates/
  2. Le procesezi prin OCR si adnotezi (manual sau prin interfata /training)
  3. Rulezi acest script: el citeste structura reala si genereaza sute de variatii

Rulare:
  python tools/learn_and_generate.py --templates training_data/real_templates/ --count 500

Ce face:
  - Citeste documentele reale prin OCR
  - Extrage layout-ul: unde e titlul, unde e CUI, unde e totalul, etc.
  - Genereaza documente noi cu ACEEASI structura dar DATE DIFERITE
  - Adauga variatie realista: zgomot, rotatie, calitate diferita
  - Output: imagini + annotations JSON (ground truth)
"""

import argparse
import json
import os
import random
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from loguru import logger

# Adauga path-ul proiectului
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.processors.ocr_processor import ocr_processor
from app.processors.ner_extractor import ner_extractor


# =====================================================
# DATE REALISTE PENTRU SUBSTITUTIE
# =====================================================

FIRMS = [
    {"name": "SC Tehnologie Avansata SRL", "cui": "RO12345678", "iban": "RO49AAAA1B31007593840000"},
    {"name": "SC Contabilitate Pro SRL", "cui": "RO44556677", "iban": "RO62BRDE240SV00234567890"},
    {"name": "SC Digital Solutions SA", "cui": "RO98765432", "iban": "RO15RNCB0082044444440001"},
    {"name": "SC AgroBusiness SRL", "cui": "RO11223344", "iban": "RO55TREZ0462069XXX001234"},
    {"name": "SC TransLogistic SRL", "cui": "RO55667788", "iban": "RO73INGB0001000123456789"},
    {"name": "SC MediaPrint SA", "cui": "RO33445566", "iban": "RO80BACX0000000012345678"},
    {"name": "SC AutoService Plus SRL", "cui": "RO77889900", "iban": "RO29PORL8207120000123456"},
    {"name": "SC Constructii Moderne SRL", "cui": "RO22334455", "iban": "RO42CECEB10000RON0123456"},
    {"name": "SC FoodService Pro SRL", "cui": "RO66778899", "iban": "RO96BRDE080SV12345678900"},
    {"name": "SC IT Consulting Group SA", "cui": "RO99001122", "iban": "RO82RZBR0000060013579246"},
    {"name": "SC Eurodesign SRL", "cui": "RO10203040", "iban": "RO49BTRL00301201X12345XX"},
    {"name": "SC BioFarm Prod SRL", "cui": "RO50607080", "iban": "RO17RNCB0082044444440002"},
    {"name": "SC Logistica Rapida SRL", "cui": "RO13579024", "iban": "RO31RNCB0082044444440003"},
    {"name": "SC Audit Expert SA", "cui": "RO24680135", "iban": "RO44BRDE240SV00345678901"},
    {"name": "SC Electro Service SRL", "cui": "RO86420975", "iban": "RO57INGB0001000234567890"},
]

def random_date():
    start = datetime(2024, 1, 1)
    d = start + timedelta(days=random.randint(0, 730))
    return d.strftime("%d.%m.%Y")

def random_amount(min_v=100, max_v=50000):
    return f"{random.uniform(min_v, max_v):.2f}"

def random_invoice_num():
    series = random.choice(["AB", "BC", "TM", "CJ", "IS", "CT", "BV"])
    num = random.randint(1, 9999)
    return f"{series} {num:04d}"


class TemplateAnalyzer:
    """Analizeaza un document real si extrage structura lui."""

    def analyze(self, image_path: str) -> dict:
        """
        Proceseaza documentul prin OCR si extrage:
        - Textul complet
        - Layout: pozitia fiecarui bloc de text
        - Entitati detectate (CUI, date, sume)
        - Tipul documentului
        """
        logger.info(f"Analizam template: {image_path}")

        img_bytes = Path(image_path).read_bytes()

        # Determine file type
        if image_path.lower().endswith(".pdf"):
            ocr_result = ocr_processor.process_pdf(img_bytes, image_path)
        else:
            ocr_result = ocr_processor.process_image(img_bytes, image_path)

        if ocr_result.get("error"):
            logger.error(f"OCR error: {ocr_result['error']}")
            return None

        text = ocr_result.get("text", "")
        blocks = ocr_result.get("blocks", [])

        # Clasificam documentul
        from app.processors.classifier import document_classifier
        doc_type, _ = document_classifier.classify(text)

        # Extragem entitatile
        entities = ner_extractor.extract(text)

        # Construim template-ul
        template = {
            "source_file": image_path,
            "document_type": doc_type,
            "text": text,
            "blocks": blocks,
            "entities": entities,
            "layout": self._extract_layout(blocks),
        }

        logger.info(f"  Tip: {doc_type}, {len(blocks)} blocuri, {sum(len(v) for v in entities.values())} entitati")
        return template

    def _extract_layout(self, blocks: list) -> dict:
        """Extrage layout-ul: pozitia relativa a fiecarui bloc."""
        if not blocks:
            return {"zones": []}

        max_y = max(b["bbox"]["y2"] for b in blocks)
        max_x = max(b["bbox"]["x2"] for b in blocks)

        zones = []
        for b in blocks:
            zone = {
                "text": b["text"],
                "rel_x": b["bbox"]["x1"] / max(max_x, 1),
                "rel_y": b["bbox"]["y1"] / max(max_y, 1),
                "rel_w": (b["bbox"]["x2"] - b["bbox"]["x1"]) / max(max_x, 1),
                "rel_h": (b["bbox"]["y2"] - b["bbox"]["y1"]) / max(max_y, 1),
                "is_entity": False,
                "entity_type": None,
            }
            zones.append(zone)

        return {"zones": zones, "width": max_x, "height": max_y}


class VariationGenerator:
    """Genereaza variatii ale unui template cu date noi."""

    def generate(self, template: dict, count: int, output_dir: Path):
        """Genereaza `count` variatii ale template-ului."""
        annotations = []

        for i in range(count):
            # Generam date noi
            new_entities = self._randomize_entities(template["entities"])
            new_text = self._substitute_text(template["text"], template["entities"], new_entities)

            # Generam imagine
            img = self._render_document(template, new_text, new_entities)

            # Adaugam variatie vizuala
            img_np = np.array(img)
            img_np = self._add_variation(img_np)
            img = Image.fromarray(img_np)

            # Salvam
            fname = f"{template['document_type']}_{i:05d}.png"
            img.save(output_dir / "images" / fname, dpi=(300, 300))

            annotation = {
                "id": i,
                "filename": fname,
                "document_type": template["document_type"],
                "source_template": template["source_file"],
                "entities": {k: v[0]["value"] if v else "" for k, v in new_entities.items()},
            }
            annotations.append(annotation)

        return annotations

    def _randomize_entities(self, original_entities: dict) -> dict:
        """Genereaza entitati noi pastrand tipul."""
        new = {}
        firm = random.choice(FIRMS)

        for entity_type, values in original_entities.items():
            if entity_type == "date":
                new[entity_type] = [{"value": random_date(), "confidence": 1.0}]
            elif entity_type == "cui":
                new[entity_type] = [{"value": firm["cui"].replace("RO", ""), "confidence": 1.0}]
            elif entity_type == "vendor":
                new[entity_type] = [{"value": firm["name"], "confidence": 1.0}]
            elif entity_type == "iban":
                new[entity_type] = [{"value": firm["iban"], "confidence": 1.0}]
            elif entity_type == "invoice_num":
                new[entity_type] = [{"value": random_invoice_num(), "confidence": 1.0}]
            elif entity_type in ("amount", "total", "vat"):
                new[entity_type] = [{"value": random_amount(), "confidence": 1.0}]
            else:
                new[entity_type] = values  # pastram valoarea originala

        return new

    def _substitute_text(self, text: str, old_entities: dict, new_entities: dict) -> str:
        """Inlocuieste entitatile vechi cu cele noi in text."""
        result = text
        for entity_type in old_entities:
            if entity_type in new_entities:
                old_vals = old_entities[entity_type]
                new_vals = new_entities[entity_type]
                if old_vals and new_vals:
                    old_val = old_vals[0]["value"]
                    new_val = new_vals[0]["value"]
                    if old_val and new_val:
                        result = result.replace(old_val, new_val)
        return result

    def _render_document(self, template: dict, text: str, entities: dict) -> Image.Image:
        """Randeaza documentul cu textul nou."""
        bg = random.choice([(255, 255, 255), (250, 248, 242), (245, 243, 238)])
        img = Image.new("RGB", (800, 1100), bg)
        draw = ImageDraw.Draw(img)

        try:
            font = ImageFont.truetype("arial.ttf", 16)
        except OSError:
            font = ImageFont.load_default()

        # Randam textul pe baza layout-ului original
        layout = template.get("layout", {})
        zones = layout.get("zones", [])
        w_scale = 800
        h_scale = 1100

        if zones:
            for zone in zones:
                x = int(zone["rel_x"] * w_scale)
                y = int(zone["rel_y"] * h_scale)
                # Inlocuim textul din zona cu cel nou
                zone_text = zone["text"]
                # Cautam daca zona contine o entitate
                for etype, vals in entities.items():
                    if vals and vals[0]["value"]:
                        for old_etype, old_vals in template["entities"].items():
                            if old_etype == etype and old_vals:
                                if old_vals[0]["value"] in zone_text:
                                    zone_text = zone_text.replace(old_vals[0]["value"], vals[0]["value"])
                draw.text((x, y), zone_text, fill="black", font=font)
        else:
            # Fallback: scriem textul linie cu linie
            lines = text.split("\n") if "\n" in text else [text[i:i+80] for i in range(0, len(text), 80)]
            y = 30
            for line in lines[:40]:
                draw.text((50, y), line.strip(), fill="black", font=font)
                y += 22

        return img

    def _add_variation(self, img_np: np.ndarray) -> np.ndarray:
        """Adauga variatie vizuala realista."""
        variation = random.choice(["clean", "light_noise", "photo_sim"])

        if variation == "clean":
            return img_np

        if variation == "light_noise":
            noise = np.random.normal(0, 6, img_np.shape).astype(np.int16)
            return np.clip(img_np.astype(np.int16) + noise, 0, 255).astype(np.uint8)

        if variation == "photo_sim":
            # Simuleaza fotografie
            noise = np.random.normal(0, 12, img_np.shape).astype(np.int16)
            img_np = np.clip(img_np.astype(np.int16) + noise, 0, 255).astype(np.uint8)
            angle = random.uniform(-2, 2)
            h, w = img_np.shape[:2]
            M = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)
            img_np = cv2.warpAffine(img_np, M, (w, h), borderValue=(240, 235, 220))
            img_np = cv2.GaussianBlur(img_np, (3, 3), 0.5)
            return img_np

        return img_np


def main():
    parser = argparse.ArgumentParser(description="Invata din documente reale si genereaza variatii")
    parser.add_argument("--templates", type=str, default="training_data/real_templates",
                        help="Director cu documente reale (PNG, JPG, PDF)")
    parser.add_argument("--count", type=int, default=100,
                        help="Cate variatii per template")
    parser.add_argument("--output", type=str, default="training_data/synthetic",
                        help="Director output")
    args = parser.parse_args()

    templates_dir = Path(args.templates)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "images").mkdir(exist_ok=True)

    if not templates_dir.exists():
        templates_dir.mkdir(parents=True, exist_ok=True)
        print(f"Directorul {templates_dir} a fost creat.")
        print(f"Pune documentele reale aici (PNG, JPG, PDF) si ruleaza din nou.")
        print()
        print("Exemplu structura:")
        print(f"  {templates_dir}/")
        print(f"  {templates_dir}/factura_model_1.png")
        print(f"  {templates_dir}/factura_model_2.jpg")
        print(f"  {templates_dir}/chitanta_exemplu.png")
        print(f"  {templates_dir}/extras_cont.pdf")
        return

    # Gasim template-urile
    extensions = {".png", ".jpg", ".jpeg", ".tiff", ".tif", ".pdf"}
    template_files = [f for f in templates_dir.iterdir() if f.suffix.lower() in extensions]

    if not template_files:
        print(f"Nu am gasit documente in {templates_dir}/")
        print(f"Pune fisiere PNG/JPG/PDF acolo si ruleaza din nou.")
        return

    print(f"Gasit {len(template_files)} template-uri reale")
    print(f"Generam {args.count} variatii per template = {len(template_files) * args.count} total")
    print()

    analyzer = TemplateAnalyzer()
    generator = VariationGenerator()
    all_annotations = []

    for template_file in template_files:
        print(f"Procesam: {template_file.name}")
        template = analyzer.analyze(str(template_file))

        if template is None:
            print(f"  SKIP: nu s-a putut analiza")
            continue

        annotations = generator.generate(template, args.count, output_dir)
        all_annotations.extend(annotations)
        print(f"  Generat {len(annotations)} variatii")

    # Salvam
    annotations_path = output_dir / "annotations.json"
    with open(annotations_path, "w", encoding="utf-8") as f:
        json.dump(all_annotations, f, ensure_ascii=False, indent=2)

    print()
    print(f"GATA! {len(all_annotations)} documente generate.")
    print(f"  Imagini: {output_dir}/images/")
    print(f"  Adnotari: {annotations_path}")
    print()
    print("Pasul urmator:")
    print("  1. Verifica cateva imagini sa arate bine")
    print("  2. Ruleaza antrenarea: POST /api/training/trigger")


if __name__ == "__main__":
    main()

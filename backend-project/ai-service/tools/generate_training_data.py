"""
Generator de date sintetice pentru antrenarea modelelor AI.
Generează mii de documente cu date realiste moldovenești/românești.

Rulare:
  python tools/generate_training_data.py --count 500 --output training_data/synthetic

Fiecare document generat conține:
  - Imaginea documentului (PNG)
  - JSON cu adnotările corecte (ground truth)
  - Folosite direct pentru antrenarea Classifier + NER

Aceasta e echivalentul a luni de colectare manuală, gata în minute.
"""

import argparse
import json
import os
import random
import string
import sys
from datetime import datetime, timedelta
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

# =====================================================
# BAZA DE DATE REALISTE (firme, produse, conturi)
# =====================================================

COMPANIES = [
    {"name": "SC Tehnologie Avansata SRL", "cui": "RO12345678", "reg": "J40/1234/2020", "iban": "RO49AAAA1B31007593840000"},
    {"name": "SC Contabilitate Pro SRL", "cui": "RO44556677", "reg": "J22/5678/2019", "iban": "RO62BRDE240SV00234567890"},
    {"name": "SC Digital Solutions SA", "cui": "RO98765432", "reg": "J40/9012/2021", "iban": "RO15RNCB0082044444440001"},
    {"name": "SC AgroBusiness SRL", "cui": "RO11223344", "reg": "J03/3456/2018", "iban": "RO55TREZ0462069XXX001234"},
    {"name": "SC TransLogistic SRL", "cui": "RO55667788", "reg": "J40/7890/2022", "iban": "RO73INGB0001000123456789"},
    {"name": "SC MediaPrint SA", "cui": "RO33445566", "reg": "J12/1111/2017", "iban": "RO80BACX0000000012345678"},
    {"name": "SC AutoService Plus SRL", "cui": "RO77889900", "reg": "J40/2222/2023", "iban": "RO29PORL8207120000123456"},
    {"name": "SC Constructii Moderne SRL", "cui": "RO22334455", "reg": "J06/3333/2016", "iban": "RO42CECEB10000RON0123456"},
    {"name": "SC FoodService Pro SRL", "cui": "RO66778899", "reg": "J40/4444/2024", "iban": "RO96BRDE080SV12345678900"},
    {"name": "SC IT Consulting Group SA", "cui": "RO99001122", "reg": "J40/5555/2015", "iban": "RO82RZBR0000060013579246"},
    {"name": "SC Eurodesign SRL", "cui": "RO10203040", "reg": "J40/6666/2020", "iban": "RO49BTRL00301201X12345XX"},
    {"name": "SC BioFarm Prod SRL", "cui": "RO50607080", "reg": "J23/7777/2019", "iban": "RO17RNCB0082044444440002"},
]

PRODUCTS_INVOICE = [
    ("Servicii consultanta IT", 800, 5000),
    ("Licenta software anual", 500, 3000),
    ("Mentenanta echipamente", 200, 1500),
    ("Servicii contabilitate luna", 300, 2000),
    ("Hosting si domeniu web", 50, 500),
    ("Materiale de birou", 30, 300),
    ("Combustibil motorina", 100, 2000),
    ("Transport marfa", 200, 5000),
    ("Servicii curatenie", 150, 800),
    ("Reparatii auto", 100, 3000),
    ("Publicitate online", 200, 4000),
    ("Echipamente IT", 500, 10000),
    ("Mobilier birou", 300, 5000),
    ("Asigurare RCA", 200, 1500),
    ("Servicii juridice", 500, 3000),
    ("Chirie spatiu comercial", 1000, 5000),
    ("Utilitati (energie electrica)", 200, 2000),
    ("Utilitati (gaz natural)", 100, 1500),
    ("Telefonie si internet", 50, 500),
    ("Cursuri formare profesionala", 300, 2000),
]

PRODUCTS_RECEIPT = [
    ("Alimente si bauturi", 10, 200),
    ("Produse curatenie", 15, 100),
    ("Rechizite birou", 5, 50),
    ("Cafea si bauturi calde", 3, 20),
    ("Taxi / transport", 10, 100),
    ("Parcare", 2, 20),
    ("Benzina", 50, 300),
    ("Toner imprimanta", 30, 150),
]


def random_date(start_year=2024, end_year=2026):
    start = datetime(start_year, 1, 1)
    end = datetime(end_year, 12, 31)
    delta = (end - start).days
    d = start + timedelta(days=random.randint(0, delta))
    return d.strftime("%d.%m.%Y")


def random_series():
    letters = random.choice(["AB", "BC", "TM", "CJ", "IS", "CT", "BV", "MM", "SB", "HD"])
    return letters


def random_invoice_number():
    return f"{random.randint(1, 9999):04d}"


# =====================================================
# GENERATOARE PE TIP DOCUMENT
# =====================================================

def generate_invoice(draw, font_l, font_m, font_s, w=800, h=1100):
    """Genereaza o factura si returneaza ground truth."""
    furnizor = random.choice(COMPANIES)
    client = random.choice([c for c in COMPANIES if c != furnizor])
    seria = random_series()
    nr = random_invoice_number()
    data_emit = random_date()
    data_scad = random_date()

    # Header
    y = 30
    draw.text((w // 2 - 120, y), "FACTURA FISCALA", fill="black", font=font_l)
    y += 40
    draw.text((w // 2 - 100, y), f"Seria {seria} Nr. {nr}", fill="black", font=font_m)
    y += 30
    draw.line((50, y, w - 50, y), fill="black", width=2)

    # Furnizor
    y += 15
    draw.text((50, y), "FURNIZOR:", fill="black", font=font_m)
    y += 25
    draw.text((50, y), furnizor["name"], fill="black", font=font_m)
    y += 25
    draw.text((50, y), f"CUI: {furnizor['cui']}", fill="black", font=font_m)
    y += 25
    draw.text((50, y), f"Reg. Com.: {furnizor['reg']}", fill="black", font=font_s)
    y += 20
    draw.text((50, y), f"IBAN: {furnizor['iban']}", fill="black", font=font_s)

    # Client
    cy = 115
    draw.text((450, cy), "CLIENT:", fill="black", font=font_m)
    cy += 25
    draw.text((450, cy), client["name"], fill="black", font=font_m)
    cy += 25
    draw.text((450, cy), f"CUI: {client['cui']}", fill="black", font=font_m)

    # Date
    y += 40
    draw.text((50, y), f"Data emiterii: {data_emit}", fill="black", font=font_m)
    draw.text((450, y), f"Data scadentei: {data_scad}", fill="black", font=font_m)

    # Produse
    y += 40
    draw.line((50, y, w - 50, y), fill="black", width=1)
    y += 5
    draw.text((55, y), "Nr.", fill="black", font=font_s)
    draw.text((100, y), "Descriere", fill="black", font=font_s)
    draw.text((480, y), "Cant.", fill="black", font=font_s)
    draw.text((550, y), "Pret", fill="black", font=font_s)
    draw.text((660, y), "Valoare", fill="black", font=font_s)
    y += 20
    draw.line((50, y, w - 50, y), fill="black", width=1)

    num_items = random.randint(1, 5)
    items = random.sample(PRODUCTS_INVOICE, min(num_items, len(PRODUCTS_INVOICE)))
    subtotal = 0

    for i, (name, min_p, max_p) in enumerate(items):
        y += 5
        cant = random.randint(1, 20)
        pret = round(random.uniform(min_p, max_p), 2)
        val = round(cant * pret, 2)
        subtotal += val

        draw.text((55, y), f"{i + 1}.", fill="black", font=font_s)
        draw.text((100, y), name[:35], fill="black", font=font_s)
        draw.text((480, y), str(cant), fill="black", font=font_s)
        draw.text((550, y), f"{pret:.2f}", fill="black", font=font_s)
        draw.text((660, y), f"{val:.2f}", fill="black", font=font_s)
        y += 25

    # Totaluri
    y += 15
    draw.line((50, y, w - 50, y), fill="black", width=1)
    y += 10
    tva = round(subtotal * 0.19, 2)
    total = round(subtotal + tva, 2)

    draw.text((500, y), "Subtotal:", fill="black", font=font_m)
    draw.text((650, y), f"{subtotal:.2f} LEI", fill="black", font=font_m)
    y += 30
    draw.text((500, y), "TVA 19%:", fill="black", font=font_m)
    draw.text((650, y), f"{tva:.2f} LEI", fill="black", font=font_m)
    y += 30
    draw.line((500, y, w - 50, y), fill="black", width=2)
    y += 10
    draw.text((500, y), "TOTAL:", fill="black", font=font_l)
    draw.text((620, y), f"{total:.2f} LEI", fill="black", font=font_l)

    return {
        "document_type": "invoice",
        "entities": {
            "invoice_num": f"{seria} {nr}",
            "date": data_emit,
            "vendor": furnizor["name"],
            "cui": furnizor["cui"],
            "amount": f"{subtotal:.2f}",
            "vat": f"{tva:.2f}",
            "total": f"{total:.2f}",
            "iban": furnizor["iban"],
        },
    }


def generate_receipt(draw, font_l, font_m, font_s, w=800, h=1100):
    """Genereaza o chitanta."""
    firma = random.choice(COMPANIES)
    nr = random.randint(1, 9999)
    data = random_date()

    y = 30
    draw.text((w // 2 - 80, y), "CHITANTA", fill="black", font=font_l)
    y += 40
    draw.text((w // 2 - 60, y), f"Nr. {nr}", fill="black", font=font_m)
    y += 35
    draw.text((50, y), f"Data: {data}", fill="black", font=font_m)
    y += 30
    draw.text((50, y), f"Am primit de la: {firma['name']}", fill="black", font=font_m)
    y += 25
    draw.text((50, y), f"CUI: {firma['cui']}", fill="black", font=font_m)
    y += 35

    total = 0
    items = random.sample(PRODUCTS_RECEIPT, random.randint(1, 4))
    for name, min_p, max_p in items:
        val = round(random.uniform(min_p, max_p), 2)
        total += val
        draw.text((50, y), f"- {name}: {val:.2f} LEI", fill="black", font=font_m)
        y += 25

    y += 20
    draw.text((50, y), f"Total de plata: {total:.2f} LEI", fill="black", font=font_l)

    return {
        "document_type": "receipt",
        "entities": {
            "date": data,
            "vendor": firma["name"],
            "cui": firma["cui"],
            "total": f"{total:.2f}",
        },
    }


def generate_tax_declaration(draw, font_l, font_m, font_s, w=800, h=1100):
    """Genereaza o declaratie fiscala."""
    firma = random.choice(COMPANIES)
    d_type = random.choice(["D100", "D112", "D300", "D390"])
    data = random_date()
    period = random.choice(["ianuarie 2026", "februarie 2026", "trimestrul I 2026", "luna martie 2026"])

    y = 30
    draw.text((w // 2 - 140, y), "DECLARATIE FISCALA", fill="black", font=font_l)
    y += 40
    draw.text((w // 2 - 30, y), d_type, fill="black", font=font_l)
    y += 40
    draw.text((50, y), f"Contribuabil: {firma['name']}", fill="black", font=font_m)
    y += 25
    draw.text((50, y), f"Cod fiscal: {firma['cui']}", fill="black", font=font_m)
    y += 25
    draw.text((50, y), f"Perioada: {period}", fill="black", font=font_m)
    y += 25
    draw.text((50, y), f"Data depunerii: {data}", fill="black", font=font_m)
    y += 40

    impozit = round(random.uniform(500, 50000), 2)
    contributii = round(random.uniform(200, 20000), 2)
    draw.text((50, y), f"Impozit pe venit: {impozit:.2f} LEI", fill="black", font=font_m)
    y += 25
    draw.text((50, y), f"Contributii sociale: {contributii:.2f} LEI", fill="black", font=font_m)
    y += 35
    total = round(impozit + contributii, 2)
    draw.text((50, y), f"Total obligatii: {total:.2f} LEI", fill="black", font=font_m)

    return {
        "document_type": "tax_declaration",
        "entities": {
            "date": data,
            "vendor": firma["name"],
            "cui": firma["cui"],
            "total": f"{total:.2f}",
        },
    }


def generate_bank_statement(draw, font_l, font_m, font_s, w=800, h=1100):
    """Genereaza un extras de cont."""
    firma = random.choice(COMPANIES)
    data = random_date()

    y = 30
    draw.text((w // 2 - 100, y), "EXTRAS DE CONT", fill="black", font=font_l)
    y += 40
    draw.text((50, y), f"Titular: {firma['name']}", fill="black", font=font_m)
    y += 25
    draw.text((50, y), f"CUI: {firma['cui']}", fill="black", font=font_m)
    y += 25
    draw.text((50, y), f"Cont: {firma['iban']}", fill="black", font=font_m)
    y += 25
    draw.text((50, y), f"Data extras: {data}", fill="black", font=font_m)
    y += 35

    sold_initial = round(random.uniform(1000, 100000), 2)
    draw.text((50, y), f"Sold initial: {sold_initial:.2f} LEI", fill="black", font=font_m)
    y += 35
    draw.text((55, y), "Data       | Descriere              | Debit      | Credit", fill="black", font=font_s)
    y += 20
    draw.line((50, y, w - 50, y), fill="black", width=1)

    total_debit = 0
    total_credit = 0
    for _ in range(random.randint(3, 8)):
        y += 5
        t_data = random_date()
        is_debit = random.random() > 0.4
        amount = round(random.uniform(50, 10000), 2)
        desc = random.choice(["Plata furnizor", "Incasare client", "Salariu", "Utilitati", "Transfer", "Comision bancar"])
        if is_debit:
            total_debit += amount
            draw.text((55, y), f"{t_data} | {desc:22s} | {amount:>10.2f} |", fill="black", font=font_s)
        else:
            total_credit += amount
            draw.text((55, y), f"{t_data} | {desc:22s} |            | {amount:>10.2f}", fill="black", font=font_s)
        y += 20

    y += 10
    draw.line((50, y, w - 50, y), fill="black", width=1)
    y += 10
    sold_final = round(sold_initial - total_debit + total_credit, 2)
    draw.text((50, y), f"Total debit: {total_debit:.2f}  |  Total credit: {total_credit:.2f}", fill="black", font=font_m)
    y += 25
    draw.text((50, y), f"Sold final: {sold_final:.2f} LEI", fill="black", font=font_l)

    return {
        "document_type": "bank_statement",
        "entities": {
            "date": data,
            "vendor": firma["name"],
            "cui": firma["cui"],
            "iban": firma["iban"],
            "total": f"{sold_final:.2f}",
        },
    }


def generate_payroll(draw, font_l, font_m, font_s, w=800, h=1100):
    """Genereaza un stat de plata."""
    firma = random.choice(COMPANIES)
    data = random_date()
    luna = random.choice(["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie",
                          "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"])

    y = 30
    draw.text((w // 2 - 100, y), "STAT DE PLATA", fill="black", font=font_l)
    y += 40
    draw.text((50, y), f"Angajator: {firma['name']}", fill="black", font=font_m)
    y += 25
    draw.text((50, y), f"CUI: {firma['cui']}", fill="black", font=font_m)
    y += 25
    draw.text((50, y), f"Luna: {luna} 2026", fill="black", font=font_m)
    y += 25
    draw.text((50, y), f"Data: {data}", fill="black", font=font_m)
    y += 35

    salariu_brut = round(random.uniform(3000, 15000), 2)
    cas = round(salariu_brut * 0.25, 2)
    cass = round(salariu_brut * 0.10, 2)
    impozit = round((salariu_brut - cas - cass) * 0.10, 2)
    net = round(salariu_brut - cas - cass - impozit, 2)

    draw.text((50, y), f"Salariu brut: {salariu_brut:.2f} LEI", fill="black", font=font_m)
    y += 25
    draw.text((50, y), f"CAS (25%): {cas:.2f} LEI", fill="black", font=font_m)
    y += 25
    draw.text((50, y), f"CASS (10%): {cass:.2f} LEI", fill="black", font=font_m)
    y += 25
    draw.text((50, y), f"Impozit pe venit (10%): {impozit:.2f} LEI", fill="black", font=font_m)
    y += 30
    draw.line((50, y, 400, y), fill="black", width=2)
    y += 10
    draw.text((50, y), f"Salariu NET: {net:.2f} LEI", fill="black", font=font_l)

    return {
        "document_type": "payroll",
        "entities": {
            "date": data,
            "vendor": firma["name"],
            "cui": firma["cui"],
            "amount": f"{salariu_brut:.2f}",
            "total": f"{net:.2f}",
        },
    }


def generate_contract(draw, font_l, font_m, font_s, w=800, h=1100):
    """Genereaza un contract."""
    part1 = random.choice(COMPANIES)
    part2 = random.choice([c for c in COMPANIES if c != part1])
    data = random_date()
    nr = random.randint(1, 999)

    y = 30
    draw.text((w // 2 - 80, y), "CONTRACT", fill="black", font=font_l)
    y += 35
    draw.text((w // 2 - 100, y), f"Nr. {nr} din {data}", fill="black", font=font_m)
    y += 35
    draw.text((50, y), "PARTI CONTRACTANTE:", fill="black", font=font_m)
    y += 30
    draw.text((50, y), f"1. {part1['name']}, CUI {part1['cui']}", fill="black", font=font_m)
    y += 25
    draw.text((70, y), f"Reg. Com.: {part1['reg']}", fill="black", font=font_s)
    y += 25
    draw.text((50, y), f"2. {part2['name']}, CUI {part2['cui']}", fill="black", font=font_m)
    y += 25
    draw.text((70, y), f"Reg. Com.: {part2['reg']}", fill="black", font=font_s)
    y += 35

    valoare = round(random.uniform(1000, 100000), 2)
    draw.text((50, y), "CLAUZE:", fill="black", font=font_m)
    y += 25
    draw.text((50, y), f"Valoarea contractului: {valoare:.2f} LEI", fill="black", font=font_m)
    y += 25
    draw.text((50, y), "Termen de executie: 12 luni", fill="black", font=font_m)
    y += 25
    draw.text((50, y), "Conditii de reziliere: cu preaviz de 30 zile", fill="black", font=font_m)
    y += 35
    draw.text((50, y), "Semnaturile partilor:", fill="black", font=font_m)

    return {
        "document_type": "contract",
        "entities": {
            "date": data,
            "vendor": part1["name"],
            "cui": part1["cui"],
            "total": f"{valoare:.2f}",
        },
    }


# =====================================================
# MAIN GENERATOR
# =====================================================

GENERATORS = {
    "invoice": generate_invoice,
    "receipt": generate_receipt,
    "tax_declaration": generate_tax_declaration,
    "bank_statement": generate_bank_statement,
    "payroll": generate_payroll,
    "contract": generate_contract,
}


def add_photo_noise(img_np, intensity="light"):
    """Adauga defecte realiste de fotografie."""
    import cv2

    if intensity == "none":
        return img_np

    h, w = img_np.shape[:2]

    if intensity in ("light", "heavy"):
        # Zgomot
        noise_level = 8 if intensity == "light" else 18
        noise = np.random.normal(0, noise_level, img_np.shape).astype(np.int16)
        img_np = np.clip(img_np.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    if intensity == "heavy":
        # Rotatie
        angle = random.uniform(-3, 3)
        M = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)
        img_np = cv2.warpAffine(img_np, M, (w, h), borderValue=(240, 235, 220))

        # Blur
        img_np = cv2.GaussianBlur(img_np, (3, 3), 0.7)

    return img_np


def main():
    parser = argparse.ArgumentParser(description="Generator date sintetice antrenare")
    parser.add_argument("--count", type=int, default=500, help="Numar total documente")
    parser.add_argument("--output", type=str, default="training_data/synthetic", help="Director output")
    parser.add_argument("--noise", choices=["none", "light", "heavy"], default="light", help="Nivel zgomot")
    args = parser.parse_args()

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "images").mkdir(exist_ok=True)

    try:
        font_l = ImageFont.truetype("arial.ttf", 28)
        font_m = ImageFont.truetype("arial.ttf", 18)
        font_s = ImageFont.truetype("arial.ttf", 14)
    except OSError:
        font_l = ImageFont.load_default()
        font_m = font_l
        font_s = font_l

    doc_types = list(GENERATORS.keys())
    per_type = args.count // len(doc_types)
    all_annotations = []

    print(f"Generare {args.count} documente in {output_dir}/")
    print(f"  Per tip: ~{per_type} documente")
    print(f"  Zgomot: {args.noise}")
    print()

    idx = 0
    for doc_type in doc_types:
        gen_func = GENERATORS[doc_type]
        n = per_type if doc_type != doc_types[-1] else args.count - idx

        for i in range(n):
            bg_color = random.choice([
                (255, 255, 255),
                (248, 248, 245),
                (240, 238, 230),
                (252, 250, 245),
            ])
            img = Image.new("RGB", (800, 1100), bg_color)
            draw = ImageDraw.Draw(img)

            ground_truth = gen_func(draw, font_l, font_m, font_s)

            # Adauga zgomot
            import cv2
            img_np = np.array(img)
            img_np = add_photo_noise(img_np, args.noise)
            img = Image.fromarray(img_np)

            # Salvare
            fname = f"{doc_type}_{idx:05d}.png"
            img.save(output_dir / "images" / fname, dpi=(300, 300))

            annotation = {
                "id": idx,
                "filename": fname,
                "document_type": ground_truth["document_type"],
                "entities": ground_truth["entities"],
            }
            all_annotations.append(annotation)
            idx += 1

        print(f"  {doc_type}: {n} documente generate")

    # Salvare annotations
    annotations_path = output_dir / "annotations.json"
    with open(annotations_path, "w", encoding="utf-8") as f:
        json.dump(all_annotations, f, ensure_ascii=False, indent=2)

    # Salvare dataset clasificare (text + label)
    classifier_path = output_dir / "classifier_dataset.jsonl"
    with open(classifier_path, "w", encoding="utf-8") as f:
        for ann in all_annotations:
            entry = {
                "text": json.dumps(ann["entities"]),
                "label": ann["document_type"],
            }
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    print()
    print(f"GATA! {idx} documente generate.")
    print(f"  Imagini: {output_dir}/images/")
    print(f"  Adnotari: {annotations_path}")
    print(f"  Dataset clasificare: {classifier_path}")
    print()
    print("Pasul urmator: ruleaza OCR pe imagini si compara cu ground truth:")
    print("  python tools/process_synthetic_data.py --input training_data/synthetic")


if __name__ == "__main__":
    import numpy as np
    main()

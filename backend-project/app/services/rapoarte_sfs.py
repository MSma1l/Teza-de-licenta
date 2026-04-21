"""
Generatori PDF pentru formularele fiscale SFS — Moldova.

Acoperire:
  - IPC21   (lunar, pana la 25 a lunii urmatoare) — contributii + impozit salarii
  - 2-INV   (trimestrial / anual) — situatia investitiilor brute
  - TL13    (semestrial) — taxele locale
  - TALS21  (anual) — raport anual consolidat
  - IRM19   (la cerere) — angajare/concediu/eliberare
  - SIMM24  (la cerere) — factura fiscala de vanzare

Notes:
- Layout-urile NU sunt pixel-perfect cu cele oficiale SFS (templatele sunt
  restrictionate). Reproducem corect: codul formularului, denumirea,
  campurile principale, calculele automate si totalul.
- Datele vin din baza de date (prin caller) sau din input user.
"""
from __future__ import annotations

import io
from datetime import datetime
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
)


# --- Stiluri comune ---

_styles = getSampleStyleSheet()


def _style(name: str, **kwargs) -> ParagraphStyle:
    base = _styles["Normal"]
    return ParagraphStyle(name=name, parent=base, **kwargs)


TITLU_FORM = _style("TitluForm", fontSize=14, leading=18, spaceAfter=6, alignment=1, fontName="Helvetica-Bold")
COD_FORM = _style("CodForm", fontSize=10, leading=12, alignment=1, textColor=colors.grey, spaceAfter=14)
H = _style("SectiuneH", fontSize=11, leading=14, fontName="Helvetica-Bold", spaceBefore=10, spaceAfter=6, textColor=colors.HexColor("#1e3a8a"))
P = _style("Para", fontSize=9.5, leading=13)
SMALL = _style("Small", fontSize=8, leading=10, textColor=colors.grey)


def _antet_sfs(perioada: str) -> list:
    """Header comun pentru toate formularele — imita antetul SFS."""
    return [
        Paragraph("<b>SERVICIUL FISCAL DE STAT — REPUBLICA MOLDOVA</b>", TITLU_FORM),
        Paragraph(f"Formular depus pentru perioada fiscala <b>{perioada}</b>", COD_FORM),
    ]


def _tabel_camp(randuri: list[tuple[str, str]]) -> Table:
    """Tabel simplu cu 2 coloane: eticheta + valoare."""
    data = [[Paragraph(f"<b>{et}</b>", P), Paragraph(str(val), P)] for et, val in randuri]
    t = Table(data, colWidths=[7 * cm, 9 * cm])
    t.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#e2e8f0")),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f8fafc")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return t


def _footer(semnatar: str | None = None) -> list:
    out = [Spacer(1, 18)]
    out.append(Paragraph(
        f"Prezentul formular a fost generat automat de AI-Contabil la <b>{datetime.now().strftime('%d.%m.%Y %H:%M')}</b>. "
        "Datele din acest document sunt pe raspunderea contribuabilului. Pentru depunere oficiala, "
        "formularul trebuie semnat electronic pe portalul SFS (sfs.md / e-Factura / CTAS).",
        SMALL,
    ))
    if semnatar:
        out.append(Spacer(1, 18))
        out.append(Paragraph(f"Contribuabil: <b>{semnatar}</b>", P))
        out.append(Paragraph("Semnatura electronica: __________________________", P))
    return out


# =====================================================================
#  IPC21 — Lunar: Impozit pe venit + contributii (salarii)
# =====================================================================

def build_ipc21_pdf(*, companie: str, cod_fiscal: str, perioada: str, salarizare: list[dict]) -> bytes:
    """
    salarizare: lista dict cu {nume_angajat, idnp, salariu_brut, zile_lucrate}
    Calculele (impozit 12%, CAS 9%, CAM 4.5%) sunt efectuate aici.
    """
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=2*cm, rightMargin=2*cm, topMargin=1.8*cm, bottomMargin=1.8*cm)
    story: list = []

    story += _antet_sfs(perioada)
    story.append(Paragraph("<b>IPC21 — DARE DE SEAMA PRIVIND IMPOZITUL PE VENIT SI CONTRIBUTIILE RETINUTE LA SURSA</b>", TITLU_FORM))
    story.append(Paragraph("Formular IPC21 (lunar) · Termen de depunere: pana in data de 25 a lunii urmatoare", COD_FORM))

    story.append(_tabel_camp([
        ("Denumire contribuabil", companie),
        ("Cod fiscal (IDNO/IDNP)", cod_fiscal),
        ("Perioada fiscala (AAAA-LL)", perioada),
        ("Nr. total angajati", str(len(salarizare))),
    ]))

    story.append(Spacer(1, 14))
    story.append(Paragraph("Anexa 1 — Lista angajatilor cu contributii si impozit", H))

    cap = ["Nume angajat", "IDNP", "Salariu brut", "Impozit 12%", "CAS 9%", "CAM 4.5%", "Net pe mana"]
    randuri = [cap]

    total_brut = total_imp = total_cas = total_cam = total_net = 0.0
    for a in salarizare:
        brut = float(a.get("salariu_brut", 0))
        # Simplificare: scutire personala aplicata lunar = 29700/12 ~= 2475 MDL
        scutire = 2475.0
        cas_ang = brut * 0.09
        cam_ang = brut * 0.045
        baza_imp = max(0.0, brut - scutire - cas_ang - cam_ang)
        imp = baza_imp * 0.12
        net = brut - cas_ang - cam_ang - imp
        randuri.append([
            a.get("nume_angajat", "?"),
            a.get("idnp", "?"),
            f"{brut:,.2f}",
            f"{imp:,.2f}",
            f"{cas_ang:,.2f}",
            f"{cam_ang:,.2f}",
            f"{net:,.2f}",
        ])
        total_brut += brut
        total_imp += imp
        total_cas += cas_ang
        total_cam += cam_ang
        total_net += net

    randuri.append(["TOTAL", "", f"{total_brut:,.2f}", f"{total_imp:,.2f}", f"{total_cas:,.2f}", f"{total_cam:,.2f}", f"{total_net:,.2f}"])

    t = Table(randuri, colWidths=[4*cm, 3*cm, 2.2*cm, 2*cm, 1.8*cm, 1.8*cm, 2.2*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a8a")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#fef3c7")),
        ("BOX", (0, 0), (-1, -1), 0.4, colors.HexColor("#475569")),
        ("INNERGRID", (0, 0), (-1, -1), 0.2, colors.HexColor("#cbd5e1")),
        ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t)

    story.append(Spacer(1, 12))
    story.append(Paragraph("Anexa 2 — Contributii patronale (platite de angajator)", H))
    cas_patr = total_brut * 0.24
    cam_patr = total_brut * 0.045
    story.append(_tabel_camp([
        ("Contributie sociala angajator (CAS 24%)", f"{cas_patr:,.2f} MDL"),
        ("Contributie medicala angajator (CAM 4.5%)", f"{cam_patr:,.2f} MDL"),
        ("TOTAL de virat la CNAS", f"{total_cas + cas_patr:,.2f} MDL"),
        ("TOTAL de virat la CNAM", f"{total_cam + cam_patr:,.2f} MDL"),
        ("TOTAL impozit la buget", f"{total_imp:,.2f} MDL"),
    ]))

    story += _footer(companie)
    doc.build(story)
    return buf.getvalue()


# =====================================================================
#  2-INV — Trimestrial / Anual: situatia investitiilor brute
# =====================================================================

def build_2inv_pdf(*, companie: str, cod_fiscal: str, perioada: str, investitii: list[dict], anual: bool = False) -> bytes:
    """
    investitii: [{categorie, denumire, valoare, data_achizitie}, ...]
    anual=True → 2-INV TALS21 anual; altfel 2-INV trimestrial.
    """
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=2*cm, rightMargin=2*cm, topMargin=1.8*cm, bottomMargin=1.8*cm)
    story: list = []
    story += _antet_sfs(perioada)

    if anual:
        titlu = "2-INV / TALS21 — SITUATIA ANUALA A INVESTITIILOR BRUTE"
        freq = "Formular 2-INV anual / TALS21 · Termen: pana la 30 aprilie anul urmator"
    else:
        titlu = "2-INV — SITUATIA TRIMESTRIALA A INVESTITIILOR BRUTE"
        freq = "Formular 2-INV trimestrial · Termen: pana in data de 25 a lunii de dupa trimestru"

    story.append(Paragraph(f"<b>{titlu}</b>", TITLU_FORM))
    story.append(Paragraph(freq, COD_FORM))

    story.append(_tabel_camp([
        ("Denumire contribuabil", companie),
        ("Cod fiscal (IDNO)", cod_fiscal),
        ("Perioada raportata", perioada),
        ("Nr. pozitii investitionale", str(len(investitii))),
    ]))

    story.append(Spacer(1, 12))
    story.append(Paragraph("Detaliu investitii (active imobilizate noi)", H))

    cap = ["Categorie", "Denumire", "Valoare (MDL)", "Data achizitie"]
    randuri = [cap]
    total = 0.0
    for inv in investitii:
        v = float(inv.get("valoare", 0))
        total += v
        randuri.append([
            inv.get("categorie", "-"),
            inv.get("denumire", "-"),
            f"{v:,.2f}",
            str(inv.get("data_achizitie", "-")),
        ])
    randuri.append(["TOTAL", "", f"{total:,.2f}", ""])

    t = Table(randuri, colWidths=[4*cm, 6*cm, 3.5*cm, 3*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a8a")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#fef3c7")),
        ("BOX", (0, 0), (-1, -1), 0.4, colors.HexColor("#475569")),
        ("INNERGRID", (0, 0), (-1, -1), 0.2, colors.HexColor("#cbd5e1")),
        ("ALIGN", (2, 0), (2, -1), "RIGHT"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
    ]))
    story.append(t)

    story += _footer(companie)
    doc.build(story)
    return buf.getvalue()


# =====================================================================
#  TL13 — Semestrial: taxele locale
# =====================================================================

def build_tl13_pdf(*, companie: str, cod_fiscal: str, perioada: str, localitate: str, taxe: list[dict]) -> bytes:
    """
    taxe: [{denumire, baza_impozabila, cota_pct, suma}, ...]
    """
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=2*cm, rightMargin=2*cm, topMargin=1.8*cm, bottomMargin=1.8*cm)
    story: list = []
    story += _antet_sfs(perioada)

    story.append(Paragraph("<b>TL13 — CALCULUL TAXELOR LOCALE (SEMESTRIAL)</b>", TITLU_FORM))
    story.append(Paragraph("Formular TL13 · Termen: 25 iulie (sem. I) / 25 ianuarie (sem. II)", COD_FORM))

    story.append(_tabel_camp([
        ("Denumire contribuabil", companie),
        ("Cod fiscal (IDNO)", cod_fiscal),
        ("Localitate (primarie)", localitate),
        ("Perioada semestriala", perioada),
    ]))

    story.append(Spacer(1, 12))
    story.append(Paragraph("Detaliu taxe locale", H))

    cap = ["Denumirea taxei", "Baza impozabila", "Cota (%)", "Suma (MDL)"]
    randuri = [cap]
    total = 0.0
    for tx in taxe:
        s = float(tx.get("suma", 0))
        total += s
        randuri.append([
            tx.get("denumire", "-"),
            str(tx.get("baza_impozabila", "-")),
            str(tx.get("cota_pct", "-")),
            f"{s:,.2f}",
        ])
    randuri.append(["TOTAL DE PLATA", "", "", f"{total:,.2f}"])

    t = Table(randuri, colWidths=[6*cm, 4*cm, 2.5*cm, 3.5*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a8a")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#fef3c7")),
        ("BOX", (0, 0), (-1, -1), 0.4, colors.HexColor("#475569")),
        ("INNERGRID", (0, 0), (-1, -1), 0.2, colors.HexColor("#cbd5e1")),
        ("ALIGN", (3, 0), (3, -1), "RIGHT"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
    ]))
    story.append(t)
    story += _footer(companie)
    doc.build(story)
    return buf.getvalue()


# =====================================================================
#  IRM19 — la cerere: angajare / concediu / eliberare
# =====================================================================

_IRM19_ACTIUNI = {
    "angajare": "Angajare noua",
    "concediu": "Acordare concediu",
    "eliberare": "Eliberare din functie",
    "modificare_salariu": "Modificare cuantum salariu",
    "suspendare": "Suspendare contract",
}


def build_irm19_pdf(*, companie: str, cod_fiscal: str, actiune: str, angajat: dict, detalii: dict | None = None) -> bytes:
    """
    actiune in _IRM19_ACTIUNI
    angajat: {nume, idnp, functie, salariu_brut, data_inceput, data_sfarsit (opt)}
    detalii: dict cu campuri suplimentare in functie de actiune
    """
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=2*cm, rightMargin=2*cm, topMargin=1.8*cm, bottomMargin=1.8*cm)
    story: list = []

    story.append(Paragraph("<b>SERVICIUL FISCAL DE STAT — REPUBLICA MOLDOVA</b>", TITLU_FORM))
    story.append(Paragraph(f"IRM19 — INFORMATIE DESPRE RELATIILE DE MUNCA | {datetime.now().strftime('%d.%m.%Y')}", COD_FORM))
    story.append(Paragraph(f"<b>Tipul informatiei: {_IRM19_ACTIUNI.get(actiune, actiune).upper()}</b>", TITLU_FORM))

    story.append(_tabel_camp([
        ("Angajator (denumire)", companie),
        ("Cod fiscal angajator (IDNO)", cod_fiscal),
        ("Data inregistrarii formular", datetime.now().strftime("%d.%m.%Y")),
    ]))

    story.append(Spacer(1, 14))
    story.append(Paragraph("Date despre angajat", H))
    story.append(_tabel_camp([
        ("Nume / Prenume", angajat.get("nume", "-")),
        ("IDNP", angajat.get("idnp", "-")),
        ("Functia / CAEN", angajat.get("functie", "-")),
        ("Salariu brut (MDL)", f"{float(angajat.get('salariu_brut', 0)):,.2f}"),
        ("Data inceput relatie", str(angajat.get("data_inceput", "-"))),
        ("Data sfarsit relatie", str(angajat.get("data_sfarsit", "-")) if angajat.get("data_sfarsit") else "—"),
    ]))

    if detalii:
        story.append(Spacer(1, 14))
        story.append(Paragraph("Detalii suplimentare", H))
        story.append(_tabel_camp([(k.replace("_", " ").capitalize(), str(v)) for k, v in detalii.items()]))

    story += _footer(companie)
    doc.build(story)
    return buf.getvalue()


# =====================================================================
#  SIMM24 — la cerere: factura fiscala de vanzare
# =====================================================================

def build_simm24_pdf(*, companie: str, cod_fiscal: str, furnizor_adresa: str,
                     cumparator: dict, pozitii: list[dict], serie: str, numar: str,
                     data_emiterii: str) -> bytes:
    """
    cumparator: {denumire, idno, adresa}
    pozitii: [{denumire, cantitate, pret_unitar, cota_tva}, ...]
    """
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=1.8*cm, rightMargin=1.8*cm, topMargin=1.5*cm, bottomMargin=1.5*cm)
    story: list = []

    story.append(Paragraph("<b>FACTURA FISCALA</b>", TITLU_FORM))
    story.append(Paragraph(f"Formular SIMM24 (e-Factura) · Seria <b>{serie}</b> nr. <b>{numar}</b> · Data emiterii: <b>{data_emiterii}</b>", COD_FORM))

    # Furnizor / cumparator
    t = Table([
        [Paragraph("<b>FURNIZOR</b>", P), Paragraph("<b>CUMPARATOR</b>", P)],
        [
            Paragraph(f"<b>{companie}</b><br/>IDNO: {cod_fiscal}<br/>{furnizor_adresa}", P),
            Paragraph(
                f"<b>{cumparator.get('denumire','-')}</b><br/>IDNO: {cumparator.get('idno','-')}<br/>{cumparator.get('adresa','-')}",
                P,
            ),
        ],
    ], colWidths=[8.5*cm, 8.5*cm])
    t.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#475569")),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#cbd5e1")),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a8a")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))

    # Linii factura
    cap = ["Nr.", "Denumire marfa / serviciu", "Cantitate", "Pret unitar (MDL)", "Cota TVA", "Total fara TVA", "TVA", "Total cu TVA"]
    randuri = [cap]
    subtotal = 0.0
    total_tva = 0.0
    for i, p in enumerate(pozitii, start=1):
        cant = float(p.get("cantitate", 1))
        pret = float(p.get("pret_unitar", 0))
        cota = float(p.get("cota_tva", 20))
        fara_tva = cant * pret
        tva = fara_tva * (cota / 100.0)
        cu_tva = fara_tva + tva
        subtotal += fara_tva
        total_tva += tva
        randuri.append([
            str(i),
            p.get("denumire", "-"),
            f"{cant:g}",
            f"{pret:,.2f}",
            f"{cota:g}%",
            f"{fara_tva:,.2f}",
            f"{tva:,.2f}",
            f"{cu_tva:,.2f}",
        ])
    total_general = subtotal + total_tva
    randuri.append(["", "TOTAL", "", "", "", f"{subtotal:,.2f}", f"{total_tva:,.2f}", f"{total_general:,.2f}"])

    t2 = Table(randuri, colWidths=[0.9*cm, 5*cm, 1.5*cm, 2.2*cm, 1.4*cm, 2.2*cm, 1.8*cm, 2.2*cm])
    t2.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a8a")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#fef3c7")),
        ("BOX", (0, 0), (-1, -1), 0.4, colors.HexColor("#475569")),
        ("INNERGRID", (0, 0), (-1, -1), 0.2, colors.HexColor("#cbd5e1")),
        ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
    ]))
    story.append(t2)

    story.append(Spacer(1, 12))
    story.append(Paragraph(f"<b>Total de plata: {total_general:,.2f} MDL</b>", H))

    story += _footer(companie)
    doc.build(story)
    return buf.getvalue()


# --- Orchestrare ---

SFS_GENERATORS = {
    "ipc21": build_ipc21_pdf,
    "2inv_trim": lambda **kw: build_2inv_pdf(anual=False, **kw),
    "tl13": build_tl13_pdf,
    "tals21": lambda **kw: build_2inv_pdf(anual=True, **kw),
    "irm19": build_irm19_pdf,
    "simm24": build_simm24_pdf,
}

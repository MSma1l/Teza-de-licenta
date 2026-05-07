"""
Generator de documente standard pentru afaceri mici si medii din Republica Moldova.

Tipuri suportate:
  - factura      — Factura fiscala (cu produse/servicii + TVA)
  - chitanta     — Chitanta de incasare
  - contract     — Contract de prestari servicii (forma scurta)
  - stat_plata   — Stat de plata salariu (cu calcul automat: brut, IVS 12%,
                   contributii sociale 24%, asigurare medicala 9%, net)
  - aviz         — Aviz de insotire a marfii
  - ordin_plata  — Ordin de plata bancara

Toate genereaza PDF (reportlab) si optional salveaza ca Document in DB
(asociat user-ului curent).
"""
from __future__ import annotations

import io
from datetime import datetime, date
from typing import Literal
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether,
)

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User


router = APIRouter(prefix="/templates", tags=["Document Templates"])


# ============================================
# === Schema-uri input ========================
# ============================================

class FacturaItem(BaseModel):
    denumire: str = Field(min_length=1, max_length=300)
    cantitate: float = Field(gt=0)
    pret_unitar: float = Field(ge=0)
    cota_tva: float = Field(ge=0, le=100, default=20.0)


class FacturaPayload(BaseModel):
    serie: str = Field(default="FA", max_length=10)
    numar: str = Field(min_length=1, max_length=20)
    data: date
    vendor_nume: str
    vendor_cui: str
    vendor_adresa: str | None = None
    client_nume: str
    client_cui: str | None = None
    client_adresa: str | None = None
    items: list[FacturaItem] = Field(min_length=1)
    moneda: str = "MDL"
    note: str | None = None


class ChitantaPayload(BaseModel):
    numar: str
    data: date
    suma: float
    moneda: str = "MDL"
    de_la: str
    pentru: str
    semnatura: str | None = None


class ContractPayload(BaseModel):
    numar: str
    data: date
    parte_a_nume: str
    parte_a_cui: str
    parte_b_nume: str
    parte_b_cui: str | None = None
    obiect: str
    valoare: float
    moneda: str = "MDL"
    durata: str = "12 luni"
    clauze_extra: str | None = None


class StatPlataPayload(BaseModel):
    luna: str  # ex: "Aprilie 2026"
    angajat_nume: str
    angajat_idnp: str | None = None
    functie: str
    salariu_brut: float
    zile_lucrate: int = 22
    angajator: str


class AvizPayload(BaseModel):
    numar: str
    data: date
    expeditor: str
    destinatar: str
    items: list[FacturaItem]
    transport: str | None = None


class OrdinPlataPayload(BaseModel):
    numar: str
    data: date
    platitor: str
    platitor_cont: str
    beneficiar: str
    beneficiar_cont: str
    suma: float
    moneda: str = "MDL"
    detalii_plata: str


# ============================================
# === Helpers PDF =============================
# ============================================

def _styles():
    s = getSampleStyleSheet()
    s.add(ParagraphStyle(name="HHeader", parent=s["Title"], fontSize=18, textColor=colors.HexColor("#1e3a8a"), alignment=1, spaceAfter=12))
    s.add(ParagraphStyle(name="HSub", parent=s["Heading2"], fontSize=12, textColor=colors.HexColor("#4338ca"), spaceAfter=6))
    s.add(ParagraphStyle(name="Body", parent=s["BodyText"], fontSize=10, leading=14))
    s.add(ParagraphStyle(name="Small", parent=s["BodyText"], fontSize=8, leading=10, textColor=colors.HexColor("#475569")))
    return s


def _new_doc() -> tuple[io.BytesIO, SimpleDocTemplate]:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=2 * cm, rightMargin=2 * cm,
        topMargin=2 * cm, bottomMargin=2 * cm,
    )
    return buf, doc


def _fmt_bani(val: float, moneda: str = "MDL") -> str:
    return f"{val:,.2f} {moneda}".replace(",", " ")


def _stream(buf: io.BytesIO, filename: str) -> StreamingResponse:
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ============================================
# === FACTURA FISCALA =========================
# ============================================

@router.post("/factura/pdf")
def gen_factura(
    p: FacturaPayload,
    current_user: User = Depends(get_current_user),
):
    s = _styles()
    buf, doc = _new_doc()
    elem: list = []

    elem.append(Paragraph("FACTURA FISCALA", s["HHeader"]))
    elem.append(Paragraph(f"Seria <b>{p.serie}</b> nr. <b>{p.numar}</b> · Data: {p.data.strftime('%d.%m.%Y')}", s["Body"]))
    elem.append(Spacer(1, 0.5 * cm))

    # Tabel furnizor / client
    info_data = [
        ["FURNIZOR", "CUMPARATOR"],
        [
            Paragraph(f"<b>{p.vendor_nume}</b><br/>CUI: {p.vendor_cui}<br/>{p.vendor_adresa or ''}", s["Body"]),
            Paragraph(f"<b>{p.client_nume}</b><br/>CUI: {p.client_cui or '—'}<br/>{p.client_adresa or ''}", s["Body"]),
        ],
    ]
    info_tbl = Table(info_data, colWidths=[8.5 * cm, 8.5 * cm])
    info_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e0e7ff")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cbd5e1")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elem.append(info_tbl)
    elem.append(Spacer(1, 0.6 * cm))

    # Tabel items
    head = ["Nr.", "Denumire", "Cant.", "Pret unitar", "Valoare", "TVA %", "Suma TVA", "Total"]
    rows: list[list] = [head]
    subtotal = 0.0
    tva_total = 0.0
    for i, it in enumerate(p.items, 1):
        valoare = it.cantitate * it.pret_unitar
        tva = valoare * it.cota_tva / 100
        total = valoare + tva
        subtotal += valoare
        tva_total += tva
        rows.append([
            str(i),
            it.denumire,
            f"{it.cantitate:g}",
            _fmt_bani(it.pret_unitar, p.moneda),
            _fmt_bani(valoare, p.moneda),
            f"{it.cota_tva:.0f}%",
            _fmt_bani(tva, p.moneda),
            _fmt_bani(total, p.moneda),
        ])
    total_general = subtotal + tva_total
    rows.append(["", "", "", "", _fmt_bani(subtotal, p.moneda), "", _fmt_bani(tva_total, p.moneda), _fmt_bani(total_general, p.moneda)])

    items_tbl = Table(rows, colWidths=[0.8 * cm, 5.5 * cm, 1.4 * cm, 2.2 * cm, 2.2 * cm, 1.2 * cm, 1.8 * cm, 2.2 * cm])
    items_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a8a")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
        ("ALIGN", (0, 0), (1, -1), "LEFT"),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#f1f5f9")),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#94a3b8")),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cbd5e1")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elem.append(items_tbl)
    elem.append(Spacer(1, 0.6 * cm))

    elem.append(Paragraph(f"<b>Total de plata:</b> {_fmt_bani(total_general, p.moneda)}", s["HSub"]))
    if p.note:
        elem.append(Paragraph(f"<b>Note:</b> {p.note}", s["Body"]))

    elem.append(Spacer(1, 1 * cm))
    sig = Table([
        ["Furnizor", "Cumparator"],
        ["___________________", "___________________"],
        [p.vendor_nume, p.client_nume],
    ], colWidths=[8.5 * cm, 8.5 * cm])
    sig.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
    ]))
    elem.append(sig)
    elem.append(Spacer(1, 0.6 * cm))
    elem.append(Paragraph(f"Generat de AI-Contabil · {datetime.now().strftime('%d.%m.%Y %H:%M')} · User: {current_user.username}", s["Small"]))

    doc.build(elem)
    return _stream(buf, f"Factura_{p.serie}{p.numar}.pdf")


# ============================================
# === CHITANTA ================================
# ============================================

@router.post("/chitanta/pdf")
def gen_chitanta(p: ChitantaPayload, current_user: User = Depends(get_current_user)):
    s = _styles()
    buf, doc = _new_doc()
    elem: list = []
    elem.append(Paragraph("CHITANTA", s["HHeader"]))
    elem.append(Paragraph(f"Numar: <b>{p.numar}</b> · Data: <b>{p.data.strftime('%d.%m.%Y')}</b>", s["Body"]))
    elem.append(Spacer(1, 0.8 * cm))

    body = (
        f"Subsemnatul <b>{p.de_la}</b>, am incasat suma de "
        f"<b>{_fmt_bani(p.suma, p.moneda)}</b> "
        f"pentru <b>{p.pentru}</b>."
    )
    elem.append(Paragraph(body, s["Body"]))
    elem.append(Spacer(1, 1.5 * cm))
    elem.append(Paragraph(f"Semnatura: <b>{p.semnatura or '_______________'}</b>", s["Body"]))
    elem.append(Spacer(1, 1 * cm))
    elem.append(Paragraph(f"Generat de AI-Contabil · {datetime.now().strftime('%d.%m.%Y %H:%M')}", s["Small"]))
    doc.build(elem)
    return _stream(buf, f"Chitanta_{p.numar}.pdf")


# ============================================
# === CONTRACT PRESTARI SERVICII ==============
# ============================================

@router.post("/contract/pdf")
def gen_contract(p: ContractPayload, current_user: User = Depends(get_current_user)):
    s = _styles()
    buf, doc = _new_doc()
    elem: list = []
    elem.append(Paragraph(f"CONTRACT DE PRESTARI SERVICII Nr. {p.numar}", s["HHeader"]))
    elem.append(Paragraph(f"Incheiat astazi, <b>{p.data.strftime('%d.%m.%Y')}</b>, intre:", s["Body"]))
    elem.append(Spacer(1, 0.4 * cm))

    elem.append(Paragraph(f"<b>1. {p.parte_a_nume}</b> (CUI: {p.parte_a_cui}), denumita in continuare <i>Prestator</i>;", s["Body"]))
    elem.append(Paragraph(f"<b>2. {p.parte_b_nume}</b>{f' (CUI: {p.parte_b_cui})' if p.parte_b_cui else ''}, denumita in continuare <i>Beneficiar</i>.", s["Body"]))
    elem.append(Spacer(1, 0.6 * cm))

    elem.append(Paragraph("ART. 1 — OBIECTUL CONTRACTULUI", s["HSub"]))
    elem.append(Paragraph(p.obiect, s["Body"]))

    elem.append(Paragraph("ART. 2 — VALOARE SI PLATA", s["HSub"]))
    elem.append(Paragraph(f"Valoarea totala a contractului este de <b>{_fmt_bani(p.valoare, p.moneda)}</b>, plata efectuandu-se conform termenilor stabiliti de comun acord.", s["Body"]))

    elem.append(Paragraph("ART. 3 — DURATA", s["HSub"]))
    elem.append(Paragraph(f"Prezentul contract intra in vigoare la data semnarii si este valabil pentru <b>{p.durata}</b>.", s["Body"]))

    if p.clauze_extra:
        elem.append(Paragraph("ART. 4 — CLAUZE SUPLIMENTARE", s["HSub"]))
        elem.append(Paragraph(p.clauze_extra, s["Body"]))

    elem.append(Spacer(1, 1 * cm))
    sig = Table([
        ["PRESTATOR", "BENEFICIAR"],
        ["___________________", "___________________"],
        [p.parte_a_nume, p.parte_b_nume],
    ], colWidths=[8.5 * cm, 8.5 * cm])
    sig.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ]))
    elem.append(sig)

    doc.build(elem)
    return _stream(buf, f"Contract_{p.numar}.pdf")


# ============================================
# === STAT DE PLATA (cu calcul automat) =======
# ============================================

@router.post("/stat-plata/pdf")
def gen_stat_plata(p: StatPlataPayload, current_user: User = Depends(get_current_user)):
    """Stat de plata cu calcul fiscal RM:
      - IVS (impozit pe venit): 12%
      - CAS (asigurare sociala angajat): 6%  (24% e cotizatie angajator, separat)
      - CAM (asigurare medicala angajat): 9%
      - Net = Brut - IVS - CAS - CAM
    """
    s = _styles()
    buf, doc = _new_doc()
    elem: list = []

    brut = p.salariu_brut
    cas = brut * 0.06    # contributii angajat
    cam = brut * 0.09    # asigurare medicala
    baza_impozabila = brut - cas - cam
    ivs = max(0.0, baza_impozabila * 0.12)
    net = brut - ivs - cas - cam

    # Cotizatii angajator (informativ — nu se scad din salariu)
    cas_angajator = brut * 0.24
    cam_angajator = brut * 0.0  # in RM 9% e doar la angajat

    elem.append(Paragraph("STAT DE PLATA", s["HHeader"]))
    elem.append(Paragraph(f"Luna: <b>{p.luna}</b> · Angajator: <b>{p.angajator}</b>", s["Body"]))
    elem.append(Spacer(1, 0.6 * cm))

    rows = [
        ["Date angajat", ""],
        ["Nume", p.angajat_nume],
        ["IDNP", p.angajat_idnp or "—"],
        ["Functie", p.functie],
        ["Zile lucrate", str(p.zile_lucrate)],
        ["", ""],
        ["Calcul salariu", "Suma (MDL)"],
        ["Salariu brut", _fmt_bani(brut)],
        ["CAS angajat (6%)", f"-{_fmt_bani(cas)}"],
        ["CAM angajat (9%)", f"-{_fmt_bani(cam)}"],
        ["Baza impozabila", _fmt_bani(baza_impozabila)],
        ["IVS (12%)", f"-{_fmt_bani(ivs)}"],
        ["", ""],
        ["NET DE PLATA", _fmt_bani(net)],
        ["", ""],
        ["Costuri angajator (informativ)", ""],
        ["CAS angajator (24%)", _fmt_bani(cas_angajator)],
        ["Cost total angajator", _fmt_bani(brut + cas_angajator)],
    ]
    tbl = Table(rows, colWidths=[10 * cm, 7 * cm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e0e7ff")),
        ("BACKGROUND", (0, 6), (-1, 6), colors.HexColor("#e0e7ff")),
        ("BACKGROUND", (0, 13), (-1, 13), colors.HexColor("#bbf7d0")),
        ("BACKGROUND", (0, 15), (-1, 15), colors.HexColor("#fef3c7")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 6), (-1, 6), "Helvetica-Bold"),
        ("FONTNAME", (0, 13), (-1, 13), "Helvetica-Bold"),
        ("FONTNAME", (0, 15), (-1, 15), "Helvetica-Bold"),
        ("FONTSIZE", (0, 13), (-1, 13), 12),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#94a3b8")),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cbd5e1")),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elem.append(tbl)
    elem.append(Spacer(1, 1 * cm))
    elem.append(Paragraph("Salariat (semnatura): _______________________", s["Body"]))
    elem.append(Spacer(1, 0.6 * cm))
    elem.append(Paragraph("Reprezentant angajator (semnatura si stampila): _______________________", s["Body"]))
    elem.append(Spacer(1, 0.6 * cm))
    elem.append(Paragraph(f"Generat de AI-Contabil · {datetime.now().strftime('%d.%m.%Y %H:%M')}", s["Small"]))

    doc.build(elem)
    return _stream(buf, f"StatPlata_{p.angajat_nume.replace(' ', '_')}_{p.luna.replace(' ', '_')}.pdf")


# ============================================
# === AVIZ DE INSOTIRE A MARFII ===============
# ============================================

@router.post("/aviz/pdf")
def gen_aviz(p: AvizPayload, current_user: User = Depends(get_current_user)):
    s = _styles()
    buf, doc = _new_doc()
    elem: list = []
    elem.append(Paragraph("AVIZ DE INSOTIRE A MARFII", s["HHeader"]))
    elem.append(Paragraph(f"Numar: <b>{p.numar}</b> · Data: <b>{p.data.strftime('%d.%m.%Y')}</b>", s["Body"]))
    if p.transport:
        elem.append(Paragraph(f"Transport: {p.transport}", s["Body"]))
    elem.append(Spacer(1, 0.5 * cm))

    info_tbl = Table([
        ["EXPEDITOR", "DESTINATAR"],
        [Paragraph(p.expeditor, s["Body"]), Paragraph(p.destinatar, s["Body"])],
    ], colWidths=[8.5 * cm, 8.5 * cm])
    info_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e0e7ff")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cbd5e1")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elem.append(info_tbl)
    elem.append(Spacer(1, 0.6 * cm))

    rows = [["Nr.", "Denumire", "Cantitate", "U.M."]]
    for i, it in enumerate(p.items, 1):
        rows.append([str(i), it.denumire, f"{it.cantitate:g}", "buc"])
    items_tbl = Table(rows, colWidths=[1 * cm, 11 * cm, 2.5 * cm, 2.5 * cm])
    items_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a8a")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#94a3b8")),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cbd5e1")),
        ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
    ]))
    elem.append(items_tbl)

    elem.append(Spacer(1, 1 * cm))
    sig = Table([
        ["Predat", "Primit"],
        ["___________________", "___________________"],
    ], colWidths=[8.5 * cm, 8.5 * cm])
    sig.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER"), ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold")]))
    elem.append(sig)

    doc.build(elem)
    return _stream(buf, f"Aviz_{p.numar}.pdf")


# ============================================
# === ORDIN DE PLATA BANCARA ==================
# ============================================

@router.post("/ordin-plata/pdf")
def gen_ordin_plata(p: OrdinPlataPayload, current_user: User = Depends(get_current_user)):
    s = _styles()
    buf, doc = _new_doc()
    elem: list = []
    elem.append(Paragraph("ORDIN DE PLATA", s["HHeader"]))
    elem.append(Paragraph(f"Numar: <b>{p.numar}</b> · Data: <b>{p.data.strftime('%d.%m.%Y')}</b>", s["Body"]))
    elem.append(Spacer(1, 0.5 * cm))

    rows = [
        ["Platitor", p.platitor],
        ["Cont platitor", p.platitor_cont],
        ["Beneficiar", p.beneficiar],
        ["Cont beneficiar", p.beneficiar_cont],
        ["Suma", _fmt_bani(p.suma, p.moneda)],
        ["Detalii plata", p.detalii_plata],
    ]
    tbl = Table(rows, colWidths=[5.5 * cm, 11.5 * cm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#e0e7ff")),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#94a3b8")),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cbd5e1")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elem.append(tbl)
    elem.append(Spacer(1, 1 * cm))
    elem.append(Paragraph("Semnatura si stampila platitor: _______________________", s["Body"]))

    doc.build(elem)
    return _stream(buf, f"OrdinPlata_{p.numar}.pdf")


# ============================================
# === LISTA SABLOANE DISPONIBILE ==============
# ============================================

@router.get("/list")
def list_templates(current_user: User = Depends(get_current_user)):
    """Listă sabloane suportate, cu metadate pentru UI."""
    return {
        "templates": [
            {"id": "factura", "name": "Factura fiscala", "icon": "🧾", "desc": "Cu items, calcul TVA automat, total"},
            {"id": "chitanta", "name": "Chitanta", "icon": "🧾", "desc": "Chitanta de incasare"},
            {"id": "contract", "name": "Contract prestari servicii", "icon": "📜", "desc": "Forma scurta cu obiect, valoare, durata"},
            {"id": "stat_plata", "name": "Stat de plata", "icon": "💼", "desc": "Calcul automat IVS 12%, CAS 6%, CAM 9% (legislatie RM)"},
            {"id": "aviz", "name": "Aviz de insotire marfa", "icon": "📦", "desc": "Pentru transport marfa"},
            {"id": "ordin_plata", "name": "Ordin de plata bancara", "icon": "💳", "desc": "Document standard pentru plati interbancare"},
        ]
    }


# ============================================
# === SERVICII 1C-LIKE ========================
# ============================================

class CalcSalarPayload(BaseModel):
    salariu_brut: float = Field(gt=0)
    are_persoane_intretinere: int = Field(default=0, ge=0, le=10)


@router.post("/servicii/calc-salariu")
def calc_salariu(p: CalcSalarPayload, current_user: User = Depends(get_current_user)):
    """Calculator salariu RM 2026 — fara PDF, doar JSON pentru UI."""
    brut = p.salariu_brut
    cas = brut * 0.06
    cam = brut * 0.09
    scutire = 27000 / 12 if p.are_persoane_intretinere == 0 else (27000 / 12) + (9000 / 12) * p.are_persoane_intretinere
    baza = max(0.0, brut - cas - cam - scutire)
    ivs = baza * 0.12
    net = brut - ivs - cas - cam
    cost_angajator = brut + brut * 0.24

    return {
        "brut": round(brut, 2),
        "cas_angajat": round(cas, 2),
        "cam_angajat": round(cam, 2),
        "scutire_personala": round(scutire, 2),
        "baza_impozabila": round(baza, 2),
        "ivs": round(ivs, 2),
        "net": round(net, 2),
        "cas_angajator": round(brut * 0.24, 2),
        "cost_total_angajator": round(cost_angajator, 2),
    }


class CalcTvaPayload(BaseModel):
    suma: float
    cota: float = Field(default=20.0, ge=0, le=100)
    incl: bool = Field(default=False, description="Daca True, suma include deja TVA-ul")


@router.post("/servicii/calc-tva")
def calc_tva(p: CalcTvaPayload, current_user: User = Depends(get_current_user)):
    """Calculator TVA: extragere sau aplicare cota."""
    if p.incl:
        # Suma include TVA → extragem
        baza = p.suma / (1 + p.cota / 100)
        tva = p.suma - baza
        total = p.suma
    else:
        baza = p.suma
        tva = p.suma * p.cota / 100
        total = baza + tva
    return {
        "baza": round(baza, 2),
        "tva": round(tva, 2),
        "total": round(total, 2),
        "cota": p.cota,
        "include_tva": p.incl,
    }


# Plan de conturi simplificat RM
PLAN_CONTURI_RM = [
    {"cls": "1", "title": "Active imobilizate"},
    {"cod": "111", "den": "Imobilizari necorporale"},
    {"cod": "112", "den": "Imobilizari corporale in curs"},
    {"cod": "121", "den": "Mijloace fixe"},
    {"cod": "122", "den": "Terenuri"},
    {"cls": "2", "title": "Stocuri"},
    {"cod": "211", "den": "Materiale"},
    {"cod": "213", "den": "Obiecte de mica valoare"},
    {"cod": "215", "den": "Productia in curs de executie"},
    {"cod": "216", "den": "Produse finite"},
    {"cod": "217", "den": "Marfuri"},
    {"cls": "2", "title": "Creante"},
    {"cod": "221", "den": "Creante comerciale (clienti)"},
    {"cod": "226", "den": "Creante personalului"},
    {"cod": "229", "den": "Alte creante"},
    {"cls": "2", "title": "Mijloace banesti"},
    {"cod": "241", "den": "Casa"},
    {"cod": "242", "den": "Cont curent in valuta nationala"},
    {"cod": "243", "den": "Cont curent in valuta straina"},
    {"cls": "3", "title": "Capital propriu"},
    {"cod": "311", "den": "Capital social"},
    {"cod": "321", "den": "Rezerve"},
    {"cod": "332", "den": "Profit nerepartizat al anilor precedenti"},
    {"cod": "333", "den": "Profit net al perioadei"},
    {"cls": "4", "title": "Datorii pe termen lung"},
    {"cod": "411", "den": "Imprumuturi pe termen lung"},
    {"cls": "5", "title": "Datorii pe termen scurt"},
    {"cod": "521", "den": "Datorii comerciale (furnizori)"},
    {"cod": "531", "den": "Datorii fata de personal (salarii)"},
    {"cod": "533", "den": "Datorii la asigurari sociale"},
    {"cod": "534", "den": "Datorii fiscale (impozite, TVA)"},
    {"cls": "6", "title": "Venituri"},
    {"cod": "611", "den": "Venituri din vanzari"},
    {"cod": "612", "den": "Alte venituri operationale"},
    {"cod": "621", "den": "Venituri financiare"},
    {"cls": "7", "title": "Cheltuieli"},
    {"cod": "711", "den": "Cheltuieli din vanzari (cost)"},
    {"cod": "712", "den": "Cheltuieli comerciale"},
    {"cod": "713", "den": "Cheltuieli administrative"},
    {"cod": "714", "den": "Alte cheltuieli operationale"},
    {"cod": "721", "den": "Cheltuieli financiare"},
    {"cod": "731", "den": "Cheltuieli cu impozit pe venit"},
]


@router.get("/servicii/plan-conturi")
def get_plan_conturi(current_user: User = Depends(get_current_user)):
    """Plan de conturi simplificat RM (referinta pentru note contabile)."""
    return {"items": PLAN_CONTURI_RM}

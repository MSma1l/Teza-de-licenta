"""
Endpoint-uri pentru formularele fiscale SFS (IPC21 / 2-INV / TL13 / TALS21 / IRM19 / SIMM24).

Fluxul:
  1) GET  /reports/sfs/upcoming        — userul vede ce are de depus in curand
  2) POST /reports/sfs/generate        — genereaza PDF + salveaza Report in DB
  3) GET  /reports/sfs/{id}/download   — descarca PDF-ul generat

Periodic, un Celery beat task ruleaza `proceseaza_deadlinuri_sfs()` si creeaza
notificari cand se apropie termenele — logica in `app/services/scheduler_sfs.py`.
"""
from __future__ import annotations

import io
import json
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User, UserRole
from app.models.report import Report, ReportType, ReportStatus, ReportFrequency
from app.services.rapoarte_sfs import SFS_GENERATORS


router = APIRouter(prefix="/reports/sfs", tags=["Rapoarte SFS"])


# =========================== Deadline-uri =================================

def _25_luna_urmatoare(an: int, luna: int) -> datetime:
    """25 a lunii urmatoare, ora 23:59 UTC."""
    if luna == 12:
        an2, l2 = an + 1, 1
    else:
        an2, l2 = an, luna + 1
    return datetime(an2, l2, 25, 23, 59, tzinfo=timezone.utc)


def _deadline_pentru(tip: str, perioada: str) -> datetime | None:
    """
    perioada:
      IPC21    → "YYYY-MM"      → 25 a lunii urmatoare
      2-INV tr → "YYYY-Q[1-4]"  → 25 a lunii de dupa trimestru
      TL13     → "YYYY-S[1-2]"  → 25 iulie / 25 ianuarie
      TALS21   → "YYYY"         → 30 aprilie anul urmator
    """
    t = tip.lower()
    try:
        if t == "ipc21":
            an, luna = perioada.split("-")
            return _25_luna_urmatoare(int(an), int(luna))
        if t in ("2inv_trim", "raport_2inv_trim"):
            an, q = perioada.split("-Q")
            luna_sfarsit_trim = int(q) * 3
            return _25_luna_urmatoare(int(an), luna_sfarsit_trim)
        if t == "tl13":
            an, s = perioada.split("-S")
            if int(s) == 1:
                return datetime(int(an), 7, 25, 23, 59, tzinfo=timezone.utc)
            return datetime(int(an) + 1, 1, 25, 23, 59, tzinfo=timezone.utc)
        if t == "tals21":
            an = int(perioada)
            return datetime(an + 1, 4, 30, 23, 59, tzinfo=timezone.utc)
    except Exception:
        return None
    return None


_FRECVENTA = {
    "ipc21": ReportFrequency.LUNAR,
    "2inv_trim": ReportFrequency.TRIMESTRIAL,
    "tl13": ReportFrequency.SEMESTRIAL,
    "tals21": ReportFrequency.ANUAL,
    "irm19": ReportFrequency.LA_CERERE,
    "simm24": ReportFrequency.LA_CERERE,
}

_DENUMIRE = {
    "ipc21": "IPC21 — Impozit pe venit + contributii (lunar)",
    "2inv_trim": "2-INV — Situatia investitiilor (trimestrial)",
    "tl13": "TL13 — Taxe locale (semestrial)",
    "tals21": "TALS21 — Raport anual consolidat",
    "irm19": "IRM19 — Relatii de munca (la cerere)",
    "simm24": "SIMM24 — Factura fiscala de vanzare",
}


# ============================== Schemas ===================================


class DateSalariu(BaseModel):
    nume_angajat: str
    idnp: str | None = None
    salariu_brut: float
    zile_lucrate: int | None = None


class GenerareIPC21Request(BaseModel):
    perioada: str = Field(..., description="AAAA-LL, ex: 2026-04")
    companie: str
    cod_fiscal: str
    salarizare: list[DateSalariu]


class DateInvestitie(BaseModel):
    categorie: str
    denumire: str
    valoare: float
    data_achizitie: str | None = None


class Generare2INVRequest(BaseModel):
    perioada: str = Field(..., description="ex: 2026-Q1 (trimestrial) sau 2026 (anual)")
    companie: str
    cod_fiscal: str
    investitii: list[DateInvestitie]


class DateTaxa(BaseModel):
    denumire: str
    baza_impozabila: str | None = None
    cota_pct: float | None = None
    suma: float


class GenerareTL13Request(BaseModel):
    perioada: str = Field(..., description="ex: 2026-S1")
    companie: str
    cod_fiscal: str
    localitate: str
    taxe: list[DateTaxa]


class DateAngajatIRM(BaseModel):
    nume: str
    idnp: str | None = None
    functie: str | None = None
    salariu_brut: float = 0
    data_inceput: str | None = None
    data_sfarsit: str | None = None


class GenerareIRM19Request(BaseModel):
    actiune: str = Field(..., description="angajare / concediu / eliberare / modificare_salariu / suspendare")
    companie: str
    cod_fiscal: str
    angajat: DateAngajatIRM
    detalii: dict | None = None


class PozitieFactura(BaseModel):
    denumire: str
    cantitate: float = 1
    pret_unitar: float
    cota_tva: float = 20


class InfoCumparator(BaseModel):
    denumire: str
    idno: str | None = None
    adresa: str | None = None


class GenerareSIMM24Request(BaseModel):
    companie: str
    cod_fiscal: str
    furnizor_adresa: str = ""
    cumparator: InfoCumparator
    pozitii: list[PozitieFactura]
    serie: str = "AI"
    numar: str = ""
    data_emiterii: str | None = None


# ================================= Endpoints ================================


class RaportSfsRaspuns(BaseModel):
    id: str
    title: str
    report_type: str
    status: str
    due_date: datetime | None
    frequency: str | None
    created_at: datetime


def _salveaza_pdf(pdf_bytes: bytes, prefix: str) -> str:
    nume = f"{prefix}-{uuid.uuid4().hex}.pdf"
    folder = os.path.join(settings.UPLOAD_DIR, "reports-sfs")
    os.makedirs(folder, exist_ok=True)
    cale = os.path.join(folder, nume)
    with open(cale, "wb") as f:
        f.write(pdf_bytes)
    return cale


def _creeaza_record(
    *,
    db: Session,
    user: User,
    client_id: str,
    tip: str,
    titlu: str,
    perioada: str | None,
    content: dict,
    pdf_path: str,
) -> Report:
    due = _deadline_pentru(tip, perioada) if perioada else None
    freq = _FRECVENTA.get(tip.lower(), ReportFrequency.LA_CERERE).value
    rap = Report(
        created_by=user.id,
        client_id=client_id,
        title=titlu,
        description=_DENUMIRE.get(tip.lower(), tip),
        report_type=ReportType(tip.lower()),
        status=ReportStatus.FINALIZAT,
        period_start=perioada,
        period_end=perioada,
        file_path=pdf_path,
        content=json.dumps(content, default=str, ensure_ascii=False),
        frequency=freq,
        due_date=due,
    )
    db.add(rap)
    db.commit()
    db.refresh(rap)
    return rap


@router.post("/generate/ipc21", response_model=RaportSfsRaspuns, status_code=201)
def generate_ipc21(
    data: GenerareIPC21Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pdf = SFS_GENERATORS["ipc21"](
        companie=data.companie,
        cod_fiscal=data.cod_fiscal,
        perioada=data.perioada,
        salarizare=[s.model_dump() for s in data.salarizare],
    )
    cale = _salveaza_pdf(pdf, "ipc21")
    rap = _creeaza_record(
        db=db, user=current_user, client_id=current_user.id,
        tip="ipc21",
        titlu=f"IPC21 — {data.companie} — {data.perioada}",
        perioada=data.perioada,
        content=data.model_dump(),
        pdf_path=cale,
    )
    return _to_raspuns(rap)


@router.post("/generate/2inv", response_model=RaportSfsRaspuns, status_code=201)
def generate_2inv(
    anual: bool = False,
    data: Generare2INVRequest | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data is None:
        raise HTTPException(status_code=400, detail="Body necesar")
    tip = "tals21" if anual else "2inv_trim"
    pdf = SFS_GENERATORS[tip](
        companie=data.companie,
        cod_fiscal=data.cod_fiscal,
        perioada=data.perioada,
        investitii=[i.model_dump() for i in data.investitii],
    )
    cale = _salveaza_pdf(pdf, tip)
    rap = _creeaza_record(
        db=db, user=current_user, client_id=current_user.id,
        tip=tip,
        titlu=f"{tip.upper()} — {data.companie} — {data.perioada}",
        perioada=data.perioada,
        content=data.model_dump(),
        pdf_path=cale,
    )
    return _to_raspuns(rap)


@router.post("/generate/tl13", response_model=RaportSfsRaspuns, status_code=201)
def generate_tl13(
    data: GenerareTL13Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pdf = SFS_GENERATORS["tl13"](
        companie=data.companie,
        cod_fiscal=data.cod_fiscal,
        perioada=data.perioada,
        localitate=data.localitate,
        taxe=[t.model_dump() for t in data.taxe],
    )
    cale = _salveaza_pdf(pdf, "tl13")
    rap = _creeaza_record(
        db=db, user=current_user, client_id=current_user.id,
        tip="tl13",
        titlu=f"TL13 — {data.companie} — {data.perioada}",
        perioada=data.perioada,
        content=data.model_dump(),
        pdf_path=cale,
    )
    return _to_raspuns(rap)


@router.post("/generate/irm19", response_model=RaportSfsRaspuns, status_code=201)
def generate_irm19(
    data: GenerareIRM19Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pdf = SFS_GENERATORS["irm19"](
        companie=data.companie,
        cod_fiscal=data.cod_fiscal,
        actiune=data.actiune,
        angajat=data.angajat.model_dump(),
        detalii=data.detalii,
    )
    cale = _salveaza_pdf(pdf, "irm19")
    rap = _creeaza_record(
        db=db, user=current_user, client_id=current_user.id,
        tip="irm19",
        titlu=f"IRM19 — {data.actiune} — {data.angajat.nume}",
        perioada=None,
        content=data.model_dump(),
        pdf_path=cale,
    )
    return _to_raspuns(rap)


@router.post("/generate/simm24", response_model=RaportSfsRaspuns, status_code=201)
def generate_simm24(
    data: GenerareSIMM24Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data_em = data.data_emiterii or datetime.now().strftime("%d.%m.%Y")
    numar = data.numar or datetime.now().strftime("%y%m%d%H%M")
    pdf = SFS_GENERATORS["simm24"](
        companie=data.companie,
        cod_fiscal=data.cod_fiscal,
        furnizor_adresa=data.furnizor_adresa,
        cumparator=data.cumparator.model_dump(),
        pozitii=[p.model_dump() for p in data.pozitii],
        serie=data.serie,
        numar=numar,
        data_emiterii=data_em,
    )
    cale = _salveaza_pdf(pdf, "simm24")
    rap = _creeaza_record(
        db=db, user=current_user, client_id=current_user.id,
        tip="simm24",
        titlu=f"Factura {data.serie}-{numar} — {data.cumparator.denumire}",
        perioada=None,
        content=data.model_dump(),
        pdf_path=cale,
    )
    return _to_raspuns(rap)


# --- Upcoming + Download ---


@router.get("/upcoming")
def upcoming_deadlines(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Intoarce toate deadline-urile SFS din urmatoarele 60 zile pentru useri curenti.
    Util pentru dashboard "Ce trebuie sa depun saptamana viitoare?".
    """
    acum = datetime.now(timezone.utc)
    limita = acum + timedelta(days=60)

    # Formularele active per user = ce are de depus in periodicitatea lui.
    # Variant minimal: calculez urmatoarele 3 perioade viitoare per formular periodic.
    lista: list[dict] = []
    an = acum.year
    luna = acum.month

    # IPC21 — urmatoarele 3 luni
    for offset in range(-1, 3):
        l = luna + offset
        a = an
        while l <= 0: l += 12; a -= 1
        while l > 12: l -= 12; a += 1
        perioada = f"{a}-{l:02d}"
        due = _deadline_pentru("ipc21", perioada)
        if due and acum <= due <= limita:
            lista.append(_item_deadline("ipc21", perioada, due, acum))

    # 2-INV trim — urmatoarele trimestre
    trim_actual = (luna - 1) // 3 + 1
    for offset in range(-1, 3):
        t = trim_actual + offset
        a = an
        while t <= 0: t += 4; a -= 1
        while t > 4: t -= 4; a += 1
        perioada = f"{a}-Q{t}"
        due = _deadline_pentru("2inv_trim", perioada)
        if due and acum <= due <= limita:
            lista.append(_item_deadline("2inv_trim", perioada, due, acum))

    # TL13 semestrial
    sem_actual = 1 if luna <= 6 else 2
    for offset in range(-1, 3):
        s = sem_actual + offset
        a = an
        while s <= 0: s += 2; a -= 1
        while s > 2: s -= 2; a += 1
        perioada = f"{a}-S{s}"
        due = _deadline_pentru("tl13", perioada)
        if due and acum <= due <= limita:
            lista.append(_item_deadline("tl13", perioada, due, acum))

    lista.sort(key=lambda x: x["due_date"])
    return {"upcoming": lista, "count": len(lista)}


def _item_deadline(tip: str, perioada: str, due: datetime, acum: datetime) -> dict:
    zile = (due - acum).days
    return {
        "report_type": tip,
        "name": _DENUMIRE.get(tip, tip),
        "period": perioada,
        "due_date": due.isoformat(),
        "days_left": zile,
        "urgency": "urgent" if zile <= 3 else ("warning" if zile <= 10 else "normal"),
    }


@router.get("/{report_id}/download")
def download_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rap = db.query(Report).filter(Report.id == report_id).first()
    if not rap:
        raise HTTPException(status_code=404, detail="Raport negasit")
    if current_user.role == UserRole.CLIENT and rap.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Nu ai acces la acest raport")
    if not rap.file_path or not os.path.exists(rap.file_path):
        raise HTTPException(status_code=404, detail="Fisier PDF inexistent")

    def iterf():
        with open(rap.file_path, "rb") as f:
            yield from f

    nume = f"{rap.report_type}_{rap.period_start or datetime.now().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        iterf(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={nume}"},
    )


def _to_raspuns(rap: Report) -> RaportSfsRaspuns:
    return RaportSfsRaspuns(
        id=rap.id,
        title=rap.title,
        report_type=rap.report_type,
        status=rap.status,
        due_date=rap.due_date,
        frequency=rap.frequency,
        created_at=rap.created_at,
    )

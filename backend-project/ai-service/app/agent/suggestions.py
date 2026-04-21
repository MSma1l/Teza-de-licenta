"""
Intrebari sugerate pentru Djarvis.

Scop: userul nu stie ce sa intrebe. Ii dam o lista de ~60 intrebari curate,
pentru care stim ca avem raspuns bun in corpus (sau pe care LLM-ul le trateaza
precis datorita contextului).

API:
  sugereaza(dupa_mesaj: str | None, limit: int) -> list[dict]

Cand nu e context (prima intrebare) → intoarcem "starter" (6-8 cele mai populare).
Cand e context (userul tocmai a intrebat ceva) → extragem cuvinte-cheie si
prioritizam intrebarile din aceeasi categorie.
"""
from __future__ import annotations

import re
from typing import Iterable


# Categorii = grupuri tematice. Frontend le poate afisa ca chips colorate diferit.
class IntrebareSugerata(dict):
    pass


_ENTRIES: list[dict] = [
    # --- Ghid utilizare app (CLIENT) ---
    {"q": "Cum incarc prima factura de pe telefon?", "cat": "ghid_client", "kw": ["incarc", "factura", "telefon", "scanner"]},
    {"q": "Ce fac daca OCR-ul zice calitate slaba?", "cat": "ghid_client", "kw": ["ocr", "calitate", "slaba", "retry"]},
    {"q": "Cum logez pe web prin QR de pe mobil?", "cat": "ghid_client", "kw": ["qr", "login", "web", "scaneaza"]},
    {"q": "Cum verific statusul documentului meu?", "cat": "ghid_client", "kw": ["status", "document", "procesare"]},
    {"q": "Cum corectez date extrase gresit?", "cat": "ghid_client", "kw": ["corect", "gresit", "ocr", "date"]},
    {"q": "Ce tipuri de acte pot incarca?", "cat": "ghid_client", "kw": ["tipuri", "acte", "formate", "suportate"]},

    # --- Ghid utilizare app (CONTABIL) ---
    {"q": "Cum revizuiesc documentele clientilor?", "cat": "ghid_contabil", "kw": ["revizuiesc", "documente", "clienti"]},
    {"q": "Cum raspund la o conversatie escaladata?", "cat": "ghid_contabil", "kw": ["escalat", "conversatie", "raspund", "faq"]},
    {"q": "Cum generez IPC21 pentru client?", "cat": "ghid_contabil", "kw": ["ipc21", "generez", "depun", "client"]},
    {"q": "Cum antrenez modelul AI cu datele mele?", "cat": "ghid_contabil", "kw": ["antrenez", "training", "fine-tune", "model"]},
    {"q": "Care e flow-ul meu zilnic ca contabil?", "cat": "ghid_contabil", "kw": ["zilnic", "flow", "rutina", "lucru"]},
    {"q": "Cum fac IRM19 pentru angajare noua?", "cat": "ghid_contabil", "kw": ["irm19", "angajare", "cnas", "7 zile"]},

    # --- TVA ---
    {"q": "Cat e cota TVA in Moldova?", "cat": "tva", "kw": ["tva", "cota", "impozit", "standard"]},
    {"q": "Cand se depune declaratia TVA (D300)?", "cat": "tva", "kw": ["d300", "depune", "termen", "tva"]},
    {"q": "Ce patesc daca intarzii plata TVA?", "cat": "tva", "kw": ["tva", "intarzii", "penalitate", "amenda"]},
    {"q": "Cum ma inregistrez ca platitor TVA?", "cat": "tva", "kw": ["tva", "inregistrez", "platitor", "1.2"]},
    {"q": "Ce e cota 0 TVA la export?", "cat": "tva", "kw": ["export", "cota", "0", "tva"]},
    {"q": "Cum deduc TVA pe bonurile fiscale?", "cat": "tva", "kw": ["bon", "deduc", "tva", "factura"]},

    # --- Impozite persoane fizice ---
    {"q": "Cat e impozitul pe venit in Moldova?", "cat": "impozit", "kw": ["impozit", "venit", "12", "cota"]},
    {"q": "Ce e scutirea personala si cat e in 2024?", "cat": "impozit", "kw": ["scutire", "personala", "29700"]},
    {"q": "Cum declar veniturile din chirie?", "cat": "impozit", "kw": ["chirie", "inchiriere", "venit", "7%"]},
    {"q": "Ce declar daca am 2 locuri de munca?", "cat": "impozit", "kw": ["2", "locuri", "munca", "scutire"]},
    {"q": "Cand depun declaratia anuala CET18?", "cat": "impozit", "kw": ["cet18", "declaratie", "anuala", "30 aprilie"]},

    # --- Freelance / IT / patenta ---
    {"q": "Sunt freelancer IT — ce impozit platesc?", "cat": "freelance", "kw": ["freelancer", "it", "impozit", "patenta"]},
    {"q": "Ce e Moldova IT Park?", "cat": "freelance", "kw": ["it park", "mitp", "7%", "regim"]},
    {"q": "Ce e patenta de intreprinzator?", "cat": "freelance", "kw": ["patenta", "intreprinzator", "lista", "activitate"]},
    {"q": "Intreprindere Individuala sau SRL — ce sa aleg?", "cat": "freelance", "kw": ["ii", "srl", "alegere", "comparatie"]},
    {"q": "Cum inregistrez o Intreprindere Individuala?", "cat": "freelance", "kw": ["ii", "intreprindere", "individuala", "inregistrez"]},
    {"q": "Cum inregistrez un SRL in Moldova?", "cat": "freelance", "kw": ["srl", "inregistrez", "asp", "capital"]},

    # --- Salarii, angajare ---
    {"q": "Am angajat primul om — ce trebuie sa fac?", "cat": "salarii", "kw": ["angajat", "prim", "cnas", "ipc21"]},
    {"q": "Cat e salariul minim pe economie?", "cat": "salarii", "kw": ["salariu", "minim", "5000", "economie"]},
    {"q": "Cum calculez salariul brut vs net?", "cat": "salarii", "kw": ["brut", "net", "calcul", "salariu"]},
    {"q": "Ce sunt CAS si CAM, cate procente?", "cat": "salarii", "kw": ["cas", "cam", "9", "24", "cnas"]},
    {"q": "Cand se depune IPC21?", "cat": "salarii", "kw": ["ipc21", "depune", "25", "lunar"]},
    {"q": "Cum inregistrez concediul medical?", "cat": "salarii", "kw": ["concediu", "medical", "boala", "75%"]},
    {"q": "Cat e concediul anual de odihna?", "cat": "salarii", "kw": ["concediu", "anual", "28", "odihna"]},
    {"q": "Cat e concediul de maternitate in Moldova?", "cat": "salarii", "kw": ["maternitate", "126", "mama"]},
    {"q": "Ce trebuie sa fac la demisia angajatului?", "cat": "salarii", "kw": ["demisie", "14", "preaviz", "ultima zi"]},
    {"q": "Cum concediez legal un angajat?", "cat": "salarii", "kw": ["concediere", "concediez", "preaviz", "reducere"]},

    # --- Contract munca vs colaborare ---
    {"q": "Contract de munca sau prestari servicii?", "cat": "contract", "kw": ["contract", "prestari", "servicii", "colaborare"]},
    {"q": "Ce risc am cu contract civil ascuns ca munca?", "cat": "contract", "kw": ["ascuns", "recalificare", "risc", "civil"]},

    # --- Decizie fisc / contestatii ---
    {"q": "Am primit o decizie de la fisc — ce fac?", "cat": "fisc", "kw": ["decizie", "fisc", "contestatie", "30 zile"]},
    {"q": "Cum contestez o amenda SFS?", "cat": "fisc", "kw": ["contest", "amenda", "sfs", "instanta"]},
    {"q": "Ce e un control fiscal?", "cat": "fisc", "kw": ["control", "inspectie", "verificare", "cameral"]},
    {"q": "Ce amenzi risc daca nu depun IPC21?", "cat": "fisc", "kw": ["amenda", "ipc21", "neprezent", "intarziere"]},

    # --- Rapoarte / declaratii ---
    {"q": "Ce e declaratia D200?", "cat": "raport", "kw": ["d200", "anuala", "profit", "impozit venit"]},
    {"q": "Ce contine raportul financiar anual?", "cat": "raport", "kw": ["raport", "financiar", "anual", "sirf"]},
    {"q": "Ce e 2-INV si cand se depune?", "cat": "raport", "kw": ["2-inv", "investitii", "trimestrial"]},
    {"q": "Ce e TL13 pentru taxele locale?", "cat": "raport", "kw": ["tl13", "taxe", "locale", "semestrial"]},
    {"q": "Cum fac o factura fiscala (SIMM24)?", "cat": "raport", "kw": ["factura", "simm24", "e-factura", "vanzare"]},

    # --- Cheltuieli, deductibile ---
    {"q": "Ce cheltuieli sunt deductibile fiscal?", "cat": "deductibil", "kw": ["deductibil", "cheltuieli", "profit", "nededuct"]},
    {"q": "Pot deduce masina firmei?", "cat": "deductibil", "kw": ["masina", "auto", "deduc", "amortizare"]},
    {"q": "Pot deduce consumabile birou?", "cat": "deductibil", "kw": ["birou", "consumabile", "deduc"]},

    # --- Vamal / import / export ---
    {"q": "Cum se plateste TVA la import?", "cat": "vamal", "kw": ["import", "tva", "vama", "ddv"]},
    {"q": "Ce documente imi trebuie pentru export?", "cat": "vamal", "kw": ["export", "dve", "cmr", "declaratie"]},

    # --- Firma / schimbari ---
    {"q": "Cum imi schimb sediul social?", "cat": "firma", "kw": ["sediu", "schimb", "asp"]},
    {"q": "Cum vand SRL-ul meu?", "cat": "firma", "kw": ["vand", "cesiune", "parti sociale", "srl"]},
    {"q": "Cum inchid o firma in Moldova?", "cat": "firma", "kw": ["inchid", "lichidare", "firma", "radiere"]},

    # --- Altele / sarbatori / cadouri ---
    {"q": "Ce zile libere legale am in Moldova?", "cat": "altele", "kw": ["zile", "libere", "sarbatori", "legale"]},
    {"q": "Pot da cadouri angajatilor fara impozit?", "cat": "altele", "kw": ["cadou", "tichete", "neimpoz"]},
    {"q": "Cat e impozitul pe avere (imobile)?", "cat": "altele", "kw": ["avere", "imobil", "locuinta", "impozit"]},
]


# Intrebari "starter" — cand userul intra prima data in chat.
# Diferite per rol: client vede mai multe ghiduri de app + legislatie de baza;
# contabil vede mai multe pe fluxul lui de lucru + legislatie avansata.

_STARTER_CLIENT = [
    "Cum incarc prima factura de pe telefon?",
    "Cat e cota TVA in Moldova?",
    "Cum logez pe web prin QR de pe mobil?",
    "Sunt freelancer IT — ce impozit platesc?",
    "Ce fac daca OCR-ul zice calitate slaba?",
    "Am primit o decizie de la fisc — ce fac?",
]

_STARTER_CONTABIL = [
    "Cum revizuiesc documentele clientilor?",
    "Cum generez IPC21 pentru client?",
    "Cum raspund la o conversatie escaladata?",
    "Care e flow-ul meu zilnic ca contabil?",
    "Cum antrenez modelul AI cu datele mele?",
    "Cum fac IRM19 pentru angajare noua?",
]

_STARTER_DEFAULT = [
    "Cat e cota TVA in Moldova?",
    "Sunt freelancer IT — ce impozit platesc?",
    "Am angajat primul om — ce trebuie sa fac?",
    "Cand se depune IPC21?",
    "Am primit o decizie de la fisc — ce fac?",
    "Contract de munca sau prestari servicii?",
]


def _starter_for_role(rol: str | None) -> list[dict]:
    r = (rol or "").lower()
    if r == "contabil":
        wanted = _STARTER_CONTABIL
    elif r == "client":
        wanted = _STARTER_CLIENT
    else:
        wanted = _STARTER_DEFAULT
    wanted_set = set(wanted)
    by_q = {e["q"]: e for e in _ENTRIES}
    # pastreaza ordinea din lista wanted
    return [by_q[q] for q in wanted if q in by_q]


def _tokenize(text: str) -> set[str]:
    """Extrage cuvinte utile din text user (>= 3 chars, fara diacritice simplificat)."""
    text = text.lower()
    # inlocuieste diacritice uzuale
    for a, b in [("ă", "a"), ("â", "a"), ("î", "i"), ("ș", "s"), ("ț", "t"), ("ş", "s"), ("ţ", "t")]:
        text = text.replace(a, b)
    words = re.findall(r"[a-z0-9]+", text)
    return {w for w in words if len(w) >= 3}


def _scor_potrivire(tokens: set[str], entry: dict) -> float:
    kw_hits = sum(1 for kw in entry["kw"] if kw in tokens or any(kw in t for t in tokens))
    if kw_hits == 0:
        return 0.0
    # normalizare: mai multe keywords potrivite = scor mai mare
    return kw_hits / max(len(entry["kw"]), 1)


def sugereaza(dupa_mesaj: str | None = None, limit: int = 5, rol: str | None = None) -> list[dict]:
    """
    Intoarce [{"q": "...", "cat": "tva"}, ...] — limit intrebari.
    Fara context -> starter (diferit per rol: client/contabil/default).
    Cu context -> similare + cateva diverse.
    """
    if not dupa_mesaj or len(dupa_mesaj.strip()) < 3:
        starters = _starter_for_role(rol)
        return [{"q": e["q"], "cat": e["cat"]} for e in starters[:limit]]

    tokens = _tokenize(dupa_mesaj)
    clasate = sorted(
        ((e, _scor_potrivire(tokens, e)) for e in _ENTRIES),
        key=lambda t: -t[1],
    )

    # Filtram doar cele cu scor > 0
    relevante = [e for e, s in clasate if s > 0]
    # Daca n-am gasit nimic — fallback pe starter (per rol)
    if not relevante:
        starters = _starter_for_role(rol)
        return [{"q": e["q"], "cat": e["cat"]} for e in starters[:limit]]

    # Pastram top relevante din aceeasi categorie + 1-2 din alte categorii
    top = relevante[: max(limit - 2, 3)]
    top_cats = {e["cat"] for e in top}
    diverse = [e for e in _ENTRIES if e["cat"] not in top_cats][: max(0, limit - len(top))]

    rez = top + diverse
    # Dedup si taiere
    vazute: set[str] = set()
    final = []
    for e in rez:
        if e["q"] in vazute:
            continue
        vazute.add(e["q"])
        final.append({"q": e["q"], "cat": e["cat"]})
        if len(final) >= limit:
            break
    return final


def lista_toate() -> list[dict]:
    """Expunerea completa — util pentru debug sau pagina de FAQ."""
    return [{"q": e["q"], "cat": e["cat"]} for e in _ENTRIES]

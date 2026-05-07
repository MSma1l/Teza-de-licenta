"""
Seed sintetic de training_examples pentru clasificatorul de documente.

Genereaza exemple pe baza pattern-urilor OCR reale pentru fiecare tip de document
RM (factura, chitanta, contract, stat plata, extras bancar, declaratie, certificat,
proces verbal). Foloseste contabilul demo ca accountant_id.

Ruleaza: docker exec ai_contabil_backend python scripts/seed_training_examples.py
"""
import sys
import os
sys.path.insert(0, '/app')

import random
import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
# Import TOATE modelele inainte sa configureze SQLAlchemy mapperele
# (relatia User-Company referinte alta clasa, daca nu o incarcam crapa).
from app.models import (  # noqa: F401
    user, document, report, notification, accountant_client,
    company, extracted_field, recommendation, training_example,
    model_version, audit_log, document_embedding, faq,
    two_factor as two_factor_model, login_attempt, qr_login as qr_login_model,
    public_content, consultation_request,
)
from app.models.training_example import TrainingExample
from app.models.user import User, UserRole
from app.models.document import Document

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


# Pattern-uri OCR realiste — text generat ca cum ar fi extras dintr-un document scanat
PATTERNS_PER_TYPE = {
    "factura": [
        "FACTURA FISCALA seria FA nr. {nr} data {data} Furnizor: {firma} CUI: {cui} Cumparator: {client_firma} CUI: {client_cui} Articol: servicii consultanta cantitate 1 pret unitar {pret} cota TVA 20% suma TVA {tva} total {total} MDL",
        "Factura nr {nr}/{data} de la {firma} (CUI {cui}) catre {client_firma}. Detalii: bunuri livrate. Pret fara TVA: {pret} TVA 20%: {tva} Total cu TVA: {total} MDL. Plata: {data}",
        "FACTURA Vendor: {firma} TIN: {cui} Buyer: {client_firma} TIN: {client_cui} Date: {data} Description: services rendered Quantity: 1 Unit price: {pret} VAT 20%: {tva} Total: {total}",
        "Factura electronica e-Factura nr {nr} emisa de {firma} CUI {cui} catre {client_firma} CUI {client_cui} la data {data}. Servicii informatice. Baza: {pret} TVA 20%: {tva} Total: {total} MDL",
        "FACTURA SERVICII CONTABILITATE Furnizor {firma} cod fiscal {cui} client {client_firma} luna iunie 2026 abonament lunar {pret} TVA inclusa total {total} MDL",
    ],
    "chitanta": [
        "CHITANTA nr {nr} data {data} Subsemnatul {persoana} am primit suma de {suma} MDL de la {client_firma} pentru servicii prestate. Semnatura {persoana}",
        "Chitanta nr {nr}/{data} primita de la {client_firma} suma {suma} lei pentru consultanta. Achitat in numerar.",
        "RECEIPT no {nr} date {data} Received from {client_firma} amount {suma} MDL for services. Cash payment.",
        "Chitanta de incasare {nr} {data} {persoana} primit {suma} MDL pentru factura emisa anterior. Plata cash.",
        "Chitanta {nr} ziua {data} {firma} a primit suma de {suma} MDL de la {client_firma} pentru livrare bunuri.",
    ],
    "contract": [
        "CONTRACT DE PRESTARI SERVICII Nr {nr} incheiat la {data} intre {firma} CUI {cui} (Prestator) si {client_firma} CUI {client_cui} (Beneficiar). Obiect: servicii contabilitate. Valoare totala {valoare} MDL. Durata 12 luni.",
        "Contract individual de munca nr {nr} data {data} angajator {firma} angajat {persoana} IDNP {idnp} functie {functie} salariu brut {salariu} MDL durata nedeterminata",
        "ACORD COMERCIAL nr {nr}/{data} intre partile {firma} si {client_firma} privind colaborarea pe distributia produselor. Valoare anuala estimata {valoare} MDL. Conditii de plata 30 zile.",
        "Contract de inchiriere imobil nr {nr} {data} locator {persoana} locatar {firma} obiect: birou 80 mp str Stefan cel Mare 1 chirie lunara {chirie} MDL durata {durata} luni",
        "CONTRACT DE FURNIZARE materii prime nr {nr} {data} furnizor {firma} CUI {cui} beneficiar {client_firma} valoare {valoare} MDL termen livrare 30 zile",
    ],
    "stat_plata": [
        "STAT DE PLATA luna iunie 2026 angajator {firma} angajat {persoana} IDNP {idnp} functie {functie} salariu brut {salariu} CAS angajat 6% CAM 9% IVS 12% net de plata {net}",
        "Salary slip {persoana} period {data} gross {salariu} CAS 6% CAM 9% IVS 12% net {net} MDL employer {firma}",
        "STATE DE PLATA lunile aprilie 2026 lista angajati {firma} salarii brute total {total} retineri impozit contributii sociale total fond salarii cota CAS angajator 24%",
        "Foaia de salariu pentru {persoana} luna mai 2026 zile lucrate 22 salariu de baza {salariu} MDL retineri 27% net {net} MDL semnatura angajat",
        "Stat plata luna {data} angajat {persoana} cod ID {idnp} departament IT salariu brut {salariu} retineri sociale fiscale net efectiv {net} cont bancar MD24",
    ],
    "extras_bancar": [
        "EXTRAS DE CONT bancar BCR Moldova client {firma} CUI {cui} cont MD24EX{idnp}0001 perioada {data} sold initial {sold_init} MDL incasari {incasari} plati {plati} sold final {sold_final} numar tranzactii {nr_tranz}",
        "Bank statement client {firma} account MD24 period {data} opening balance {sold_init} debits {plati} credits {incasari} closing balance {sold_final}",
        "Extras cont curent valuta MDL banca Maib client {firma} cont IBAN MD05{cui}0001 luna {data} miscari debitoare {plati} miscari creditoare {incasari} sold final {sold_final}",
        "EXTRAS BANCAR Moldindconbank {firma} cont {idnp} de la {data} cu inceput {data} sold ultimei zile {sold_final} MDL detalii operatiuni transfer SWIFT incasare furnizor",
        "Statement of Account Mobiasbanca client {firma} CUI {cui} period {data} balance brought forward {sold_init} ending balance {sold_final} transactions count {nr_tranz}",
    ],
    "declaratie": [
        "DECLARATIE FISCALA D300 TVA luna {data} contribuabil {firma} CUI {cui} livrari taxabile {pret} achizitii deductibile {achiz} TVA colectat {tva} TVA deductibil {tva_d} TVA de plata {de_plata}",
        "Declaratie IPC21 luna {data} angajator {firma} CUI {cui} numar angajati 5 fond salarial brut {salariu} impozit pe venit retinut {tva} contributii sociale {tva_d}",
        "Declaratie 2-INV anuala investitii {firma} CUI {cui} an 2026 mijloace fixe achizitionate {valoare} MDL imobile constructii birouri si echipamente IT amortizare prevazuta",
        "Declaratie SIMM24 cifra de afaceri estimata {firma} an fiscal 2026 venituri estimate {valoare} cheltuieli {achiz} profit {tva} regim impozitare simplificat 4%",
        "Declaratie taxe locale TL13 semestrul I {data} contribuabil {firma} CUI {cui} taxe imobile {tva} reclama {tva_d} salubritate teritoriala 0.1% suma totala datorata {de_plata}",
    ],
    "certificat": [
        "CERTIFICAT DE INREGISTRARE numar {nr} {data} eliberat de Agentia Servicii Publice numele entitatii {firma} forma juridica SRL CUI {cui} adresa sediu",
        "Certificat de cazier fiscal {firma} CUI {cui} eliberat la {data} de Serviciul Fiscal de Stat: nu are restante la bugetul de stat",
        "CERTIFICAT MEDICAL angajat {persoana} IDNP {idnp} perioada incapacitate {data} pana {data} doctor curant",
        "Certificat constatator {firma} numar {nr} eliberat de Camera de Comert si Industrie obiect activitate principal cod CAEM 6920 contabilitate",
        "Certificat fiscal {firma} CUI {cui} {data} pozitia cu bugetul: nu are datorii curente nu are obligatii restante eliberat de SFS",
    ],
    "proces_verbal": [
        "PROCES VERBAL inventariere stocuri {firma} data {data} comisia: {persoana}, {persoana}, {persoana} obiect: marfuri din depozit central total fizic {valoare} MDL diferente fata de scriptic 0",
        "Proces verbal predare-primire bunuri ziua {data} de la {firma} catre {client_firma} obiect: 5 calculatoare laptop value {valoare} MDL stare buna",
        "PROCES VERBAL adunare generala asociati {firma} {data} ordinea zi: aprobare bilant 2025, distributie dividende, hotarari adoptate cu unanimitate",
        "Proces verbal de receptie servicii {data} beneficiar {firma} prestator {client_firma} obiect contract nr {nr} suma {valoare} MDL prestat conform",
        "PROCES VERBAL contraventional {firma} CUI {cui} ziua {data} agent constatator: inspector SFS infractiune art 235 CF amenda {tva} MDL",
    ],
    "bon_fiscal": [
        "BON FISCAL nr {nr} data {data} casa marcat {firma} CUI {cui} produs/serviciu cantitate 1 pret {pret} TVA 20% total {total} MDL",
        "Tichet casa marcat AMEF {firma} {data} ora 14:32 articol vanzari pret unitar {pret} cota TVA 20% suma TVA {tva} total {total}",
        "Bon de casa POS {firma} {data} card credit Visa **** 1234 suma incasata {total} MDL multumim pentru cumparaturi",
        "BON FISCAL casierie {firma} numar {nr} data {data} ora 18:15 produs alimentar pret {pret} TVA 8% suma {tva} total {total}",
        "Receipt fiscal cash register {firma} CUI {cui} {data} item cantitate 1 unit price {pret} VAT 20% total {total}",
    ],
}

# Componente pentru generare random
FIRME_RM = ["ABC SRL", "DEMO COMPANY SRL", "Beta Consulting SRL", "Alpha Tech SRL", "Moldova Trade SA", "Star Logistics SRL", "Prime Services SRL", "Capitala IT SRL", "Tech Solutions SRL", "Business Pro SRL"]
PERSOANE = ["Ion Popescu", "Maria Ionescu", "Andrei Cebotaru", "Elena Rusu", "Vasile Munteanu", "Tudor Mihalcea", "Cristina Negruta", "Pavel Eremia"]
FUNCTII = ["contabil", "manager vanzari", "developer", "asistent administrativ", "casier", "director", "specialist marketing"]


def gen_random_text(template: str) -> str:
    """Inlocuieste placeholders cu valori random verosimile."""
    return template.format(
        nr=random.randint(1, 9999),
        data=f"2026-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}",
        firma=random.choice(FIRME_RM),
        client_firma=random.choice(FIRME_RM),
        cui=f"1010{random.randint(100000000, 999999999)}",
        client_cui=f"1010{random.randint(100000000, 999999999)}",
        persoana=random.choice(PERSOANE),
        functie=random.choice(FUNCTII),
        idnp=f"2{random.randint(0, 1)}{random.randint(10000000000, 99999999999)}"[:13],
        pret=f"{random.randint(100, 50000)}.00",
        valoare=f"{random.randint(5000, 500000)}.00",
        chirie=f"{random.randint(2000, 20000)}.00",
        salariu=f"{random.randint(7000, 30000)}.00",
        net=f"{random.randint(5500, 23000)}.00",
        durata=str(random.randint(6, 36)),
        sold_init=f"{random.randint(0, 500000)}.00",
        sold_final=f"{random.randint(0, 500000)}.00",
        incasari=f"{random.randint(0, 200000)}.00",
        plati=f"{random.randint(0, 200000)}.00",
        achiz=f"{random.randint(1000, 50000)}.00",
        tva=f"{random.randint(100, 10000)}.00",
        tva_d=f"{random.randint(100, 8000)}.00",
        de_plata=f"{random.randint(100, 5000)}.00",
        nr_tranz=str(random.randint(5, 50)),
        total=f"{random.randint(120, 60000)}.00",
        suma=f"{random.randint(100, 30000)}.00",
    )


def main():
    db = SessionLocal()
    try:
        # Folosim contabil demo ca autor (necesar pt FK)
        contabil = db.query(User).filter(User.role == UserRole.CONTABIL).first()
        if not contabil:
            print("Eroare: nu exista niciun contabil in DB!")
            return
        accountant_id = contabil.id
        print(f"Folosesc contabil: {contabil.username} ({accountant_id})")

        # Schema cere document_id NOT NULL — luam orice doc real ca placeholder
        any_doc = db.query(Document).first()
        if not any_doc:
            print("Eroare: nu exista niciun document in DB! Necesar pentru FK.")
            return
        anchor_doc_id = any_doc.id
        print(f"Anchor document_id: {anchor_doc_id}")

        # Cate exemple per tip — generam 30 per tip pentru un dataset robust
        N_PER_TYPE = 30
        added = 0
        for doc_type, patterns in PATTERNS_PER_TYPE.items():
            for i in range(N_PER_TYPE):
                pattern = random.choice(patterns)
                ocr_text = gen_random_text(pattern)
                ex = TrainingExample(
                    document_id=anchor_doc_id,
                    document_type=doc_type,
                    ocr_text_encrypted=ocr_text,
                    type_was_correct=True,
                    urgency_feedback="correct",
                    accountant_id=accountant_id,
                )
                db.add(ex)
                added += 1
            print(f"  {doc_type}: +{N_PER_TYPE} exemple")

        db.commit()
        print(f"\nTOTAL: {added} exemple noi adaugate in training_examples.")

        # Stats finale
        from sqlalchemy import func
        rows = db.query(TrainingExample.document_type, func.count(TrainingExample.id)).group_by(TrainingExample.document_type).all()
        print("\nStats finale per tip:")
        for dtype, count in rows:
            print(f"  {dtype}: {count}")
    finally:
        db.close()


if __name__ == "__main__":
    main()

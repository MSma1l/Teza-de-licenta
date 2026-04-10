"""
Document Classifier - BERT multilingual fine-tuned.
Clasifică documente: invoice, receipt, contract, tax_declaration, payroll, bank_statement, other.

Fallback: keyword-based classification când modelul nu e antrenat.
"""

from pathlib import Path
from typing import Dict, Tuple, Optional

from loguru import logger

from app.core.config import settings


# Mapare clase
DOCUMENT_CLASSES = [
    "invoice",          # 0 - Factură
    "receipt",          # 1 - Chitanță
    "contract",         # 2 - Contract
    "tax_declaration",  # 3 - Declarație fiscală
    "payroll",          # 4 - Stat de plată
    "bank_statement",   # 5 - Extras bancar
    "id_card",          # 6 - Buletin / Carte de identitate
    "passport",         # 7 - Pașaport
    "bank_extract",     # 8 - Extras de cont bancar (identitate)
    "other",            # 9 - Altele
]

# Keyword-based fallback (RO + EN)
KEYWORD_RULES = {
    "invoice": [
        "factura", "facturi", "invoice", "nr. factura", "serie", "tva",
        "valoare totala", "furnizor", "cumparator",
    ],
    "receipt": [
        "chitanta", "chitante", "receipt", "bon fiscal", "bon de casa",
        "casa de marcat", "total de plata",
    ],
    "contract": [
        "contract", "parti contractante", "clauze", "obligatii",
        "semnaturile", "termen", "reziliere",
    ],
    "tax_declaration": [
        "declaratie", "declaratia", "anaf", "cod fiscal", "d100", "d112",
        "d300", "d390", "impozit", "contributii",
    ],
    "payroll": [
        "stat de plata", "salariu", "salary", "brut", "net",
        "contributii angajat", "impozit pe venit",
    ],
    "bank_statement": [
        "extras de cont", "sold", "debit", "credit", "tranzactii",
        "bank statement", "iban", "cont curent",
    ],
    "id_card": [
        "buletin", "carte de identitate", "idnp", "identity card",
        "domiciliu", "cetatenie", "cnp", "valabilitate",
        "republica moldova", "seria", "data nasterii",
    ],
    "passport": [
        "pasaport", "passport", "travel document", "nationality",
        "date of birth", "place of birth", "date of issue",
        "date of expiry", "autoritatea emitenta",
    ],
    "bank_extract": [
        "extras de cont", "account statement", "sold initial",
        "sold final", "rulaj", "numar cont", "titular cont",
        "banca comerciala", "sucursala",
    ],
}


class DocumentClassifier:
    """Clasificator de documente: BERT model + keyword fallback."""

    def __init__(self):
        self._model = None
        self._tokenizer = None
        self._model_loaded = False
        self._device = None
        logger.info("DocumentClassifier inițializat (lazy loading)")

    def _get_device(self):
        """Lazy init torch device."""
        if self._device is None:
            import torch
            self._device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        return self._device

    def load_model(self, model_path: Optional[str] = None) -> bool:
        """
        Încarcă modelul fine-tuned de pe disc.
        Returnează False dacă modelul nu există (se folosește fallback).
        """
        if model_path is None:
            model_path = str(settings.model_storage / "classifier" / "active")

        if not Path(model_path).exists():
            logger.warning(
                f"Model classifier nu există la {model_path}. "
                "Se folosește clasificare keyword-based."
            )
            return False

        try:
            from transformers import BertTokenizer, BertForSequenceClassification

            self._tokenizer = BertTokenizer.from_pretrained(model_path)
            self._model = BertForSequenceClassification.from_pretrained(
                model_path,
                num_labels=settings.CLASSIFIER_NUM_LABELS,
            )
            self._model.to(self._get_device())
            self._model.eval()
            self._model_loaded = True
            logger.info(f"Model classifier încărcat de la {model_path}")
            return True
        except Exception as e:
            logger.error(f"Eroare la încărcarea modelului classifier: {e}")
            return False

    def classify(self, text: str) -> Tuple[str, float]:
        """
        Clasifică textul documentului.

        Returns:
            (document_type, confidence)
        """
        if self._model_loaded and self._model is not None:
            return self._classify_ml(text)
        return self._classify_keywords(text)

    def _classify_ml(self, text: str) -> Tuple[str, float]:
        """Clasificare cu modelul BERT fine-tuned."""
        import torch

        device = self._get_device()
        inputs = self._tokenizer(
            text,
            return_tensors="pt",
            max_length=settings.MAX_SEQUENCE_LENGTH,
            truncation=True,
            padding="max_length",
        )
        inputs = {k: v.to(device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = self._model(**inputs)
            probs = torch.softmax(outputs.logits, dim=-1)
            confidence, predicted = torch.max(probs, dim=-1)

        doc_type = DOCUMENT_CLASSES[predicted.item()]
        conf = confidence.item()

        logger.debug(f"ML classification: {doc_type} ({conf:.4f})")
        return doc_type, round(conf, 4)

    def _classify_keywords(self, text: str) -> Tuple[str, float]:
        """Clasificare keyword-based (fallback)."""
        text_lower = text.lower()
        scores = {}

        for doc_type, keywords in KEYWORD_RULES.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            scores[doc_type] = score

        if not scores or max(scores.values()) == 0:
            return "other", 0.3

        best_type = max(scores, key=scores.get)
        total_keywords = len(KEYWORD_RULES[best_type])
        confidence = min(scores[best_type] / max(total_keywords * 0.5, 1), 0.95)

        logger.debug(f"Keyword classification: {best_type} ({confidence:.4f})")
        return best_type, round(confidence, 4)


# Singleton
document_classifier = DocumentClassifier()

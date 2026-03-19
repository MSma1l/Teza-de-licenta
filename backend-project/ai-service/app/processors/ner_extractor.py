"""
NER Extractor - BERT multilingual fine-tuned for token classification.
Extrage entități: INVOICE_NUM, DATE, VENDOR, CUI, AMOUNT, VAT, TOTAL, IBAN.

Fallback: regex-based extraction când modelul nu e antrenat.
"""

import re
from pathlib import Path
from typing import Dict, List, Optional, Any

from loguru import logger

from app.core.config import settings


# BIO tag labels
NER_LABELS = [
    "O",
    "B-INVOICE_NUM", "I-INVOICE_NUM",
    "B-DATE", "I-DATE",
    "B-VENDOR", "I-VENDOR",
    "B-CUI", "I-CUI",
    "B-AMOUNT", "I-AMOUNT",
    "B-VAT", "I-VAT",
    "B-TOTAL", "I-TOTAL",
    "B-IBAN", "I-IBAN",
]

LABEL2ID = {label: i for i, label in enumerate(NER_LABELS)}
ID2LABEL = {i: label for i, label in enumerate(NER_LABELS)}

# Regex patterns for fallback
REGEX_PATTERNS = {
    "invoice_num": [
        r"(?:factura|invoice|nr\.?\s*factura|seria?\s*(?:si\s*)?nr\.?)\s*[:\-]?\s*([A-Z]{0,5}\s*\d{2,15})",
        r"(?:seria?\s+)([A-Z]{1,5})\s+(?:nr\.?\s*)(\d{2,15})",
    ],
    "date": [
        r"\b(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4})\b",
        r"\b(\d{4}[./\-]\d{1,2}[./\-]\d{1,2})\b",
        r"\b(\d{1,2}\s+(?:ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie)\s+\d{4})\b",
    ],
    "cui": [
        r"(?:CUI|CIF|C\.U\.I\.?|cod\s+(?:unic|fiscal))\s*[:\-]?\s*(?:RO)?\s*(\d{2,10})",
        r"\b(?:RO)\s*(\d{2,10})\b",
    ],
    "amount": [
        r"(?:valoare|suma|amount|subtotal)\s*[:\-]?\s*([\d.,]+)\s*(?:lei|ron|eur|usd)?",
    ],
    "vat": [
        r"(?:TVA|tva|VAT)\s*[:\-]?\s*([\d.,]+)\s*(?:lei|ron|eur|usd)?",
        r"(?:TVA|tva)\s*(?:\d{1,2}\s*%)?\s*[:\-]?\s*([\d.,]+)",
    ],
    "total": [
        r"(?:total\s*(?:de\s+plata|general|factura)?|TOTAL)\s*[:\-]?\s*([\d.,]+)\s*(?:lei|ron|eur|usd)?",
    ],
    "iban": [
        r"\b([A-Z]{2}\d{2}\s?[A-Z0-9]{4}\s?[A-Z0-9]{4}\s?[A-Z0-9]{4}\s?[A-Z0-9]{4}\s?[A-Z0-9]{4}\s?[A-Z0-9]{0,4})\b",
        r"\b(RO\d{2}[A-Z]{4}[A-Z0-9]{16})\b",
    ],
    "vendor": [
        r"(?:furnizor|vendor|emitent|SC|S\.C\.)\s*[:\-]?\s*([A-Z][A-Za-z\s&.,]{3,50}?)(?:\s*S\.?R\.?L\.?|\s*S\.?A\.?)?",
    ],
}


class NERExtractor:
    """Extractor de entități NER: BERT model + regex fallback."""

    def __init__(self):
        self._model = None
        self._tokenizer = None
        self._model_loaded = False
        self._device = None
        logger.info("NERExtractor inițializat (lazy loading)")

    def _get_device(self):
        if self._device is None:
            import torch
            self._device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        return self._device

    def load_model(self, model_path: Optional[str] = None) -> bool:
        """Încarcă modelul NER fine-tuned."""
        if model_path is None:
            model_path = str(settings.model_storage / "ner_extractor" / "active")

        if not Path(model_path).exists():
            logger.warning(
                f"Model NER nu există la {model_path}. "
                "Se folosește extracție regex-based."
            )
            return False

        try:
            from transformers import BertTokenizer, BertForTokenClassification

            self._tokenizer = BertTokenizer.from_pretrained(model_path)
            self._model = BertForTokenClassification.from_pretrained(
                model_path,
                num_labels=settings.NER_NUM_LABELS,
                id2label=ID2LABEL,
                label2id=LABEL2ID,
            )
            self._model.to(self._get_device())
            self._model.eval()
            self._model_loaded = True
            logger.info(f"Model NER încărcat de la {model_path}")
            return True
        except Exception as e:
            logger.error(f"Eroare la încărcarea modelului NER: {e}")
            return False

    def extract(self, text: str) -> Dict[str, List[Dict[str, Any]]]:
        """
        Extrage entități din text.

        Returns:
            {
                "invoice_num": [{"value": "...", "confidence": 0.95}],
                "date": [...],
                "vendor": [...],
                ...
            }
        """
        if self._model_loaded and self._model is not None:
            return self._extract_ml(text)
        return self._extract_regex(text)

    def _extract_ml(self, text: str) -> Dict[str, List[Dict[str, Any]]]:
        """Extracție cu modelul BERT NER."""
        import torch

        device = self._get_device()
        inputs = self._tokenizer(
            text,
            return_tensors="pt",
            max_length=settings.MAX_SEQUENCE_LENGTH,
            truncation=True,
            padding="max_length",
            return_offsets_mapping=True,
        )

        offset_mapping = inputs.pop("offset_mapping")[0]
        inputs = {k: v.to(device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = self._model(**inputs)
            probs = torch.softmax(outputs.logits, dim=-1)
            predictions = torch.argmax(probs, dim=-1)[0]       # shape: [seq_len]
            confidences = torch.max(probs, dim=-1).values[0]    # shape: [seq_len]

        # Reconstituire entități din BIO tags
        entities: Dict[str, List[Dict[str, Any]]] = {}
        current_entity = None
        current_tokens = []
        current_confs = []

        for i, (pred_id, conf, offset) in enumerate(
            zip(predictions, confidences, offset_mapping)
        ):
            label = ID2LABEL[pred_id.item()]

            if label.startswith("B-"):
                # Salvează entitatea precedentă
                if current_entity:
                    entity_type = current_entity.lower()
                    if entity_type not in entities:
                        entities[entity_type] = []
                    entities[entity_type].append({
                        "value": " ".join(current_tokens),
                        "confidence": round(sum(current_confs) / len(current_confs), 4),
                    })

                current_entity = label[2:]
                start, end = offset.tolist()
                if start != end:
                    current_tokens = [text[start:end]]
                    current_confs = [conf.item()]
                else:
                    current_tokens = []
                    current_confs = []

            elif label.startswith("I-") and current_entity == label[2:]:
                start, end = offset.tolist()
                if start != end:
                    current_tokens.append(text[start:end])
                    current_confs.append(conf.item())

            else:
                if current_entity:
                    entity_type = current_entity.lower()
                    if entity_type not in entities:
                        entities[entity_type] = []
                    if current_tokens:
                        entities[entity_type].append({
                            "value": " ".join(current_tokens),
                            "confidence": round(sum(current_confs) / len(current_confs), 4),
                        })
                    current_entity = None
                    current_tokens = []
                    current_confs = []

        # Ultima entitate
        if current_entity and current_tokens:
            entity_type = current_entity.lower()
            if entity_type not in entities:
                entities[entity_type] = []
            entities[entity_type].append({
                "value": " ".join(current_tokens),
                "confidence": round(sum(current_confs) / len(current_confs), 4),
            })

        logger.debug(f"ML NER: {len(entities)} tipuri de entități extrase")
        return entities

    def _extract_regex(self, text: str) -> Dict[str, List[Dict[str, Any]]]:
        """Extracție regex-based (fallback)."""
        entities: Dict[str, List[Dict[str, Any]]] = {}

        for field_name, patterns in REGEX_PATTERNS.items():
            matches = []
            for pattern in patterns:
                for match in re.finditer(pattern, text, re.IGNORECASE):
                    value = match.group(1) if match.groups() else match.group(0)
                    value = value.strip()
                    if value and value not in [m["value"] for m in matches]:
                        matches.append({
                            "value": value,
                            "confidence": 0.7,  # Regex = lower confidence
                        })
            if matches:
                entities[field_name] = matches

        logger.debug(f"Regex NER: {len(entities)} tipuri de entități extrase")
        return entities


# Singleton
ner_extractor = NERExtractor()

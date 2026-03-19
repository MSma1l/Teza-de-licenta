"""
Urgency Scoring System - Hybrid: rule-based + ML.
Scor final = 0.6 * rule_score + 0.4 * ml_score (capped la 100).

La deployment inițial: 100% rule-based (ML weight = 0).
"""

import math
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, Optional, Tuple, Any

from loguru import logger

from app.core.config import settings


# Reguli cu punctaje fixe
URGENCY_RULES = {
    "overdue": 40,
    "due_today": 35,
    "due_in_1_3_days": 25,
    "due_in_1_week": 15,
    "due_in_1_month": 5,
    "type_tax_declaration": 20,
    "type_payroll": 15,
    "type_invoice": 10,
    "amount_over_50000": 15,
    "amount_over_10000": 10,
    "amount_over_1000": 5,
    "duplicate_risk": 20,
    "low_ocr_confidence": 5,
    "premium_client": 10,
}


class UrgencyScorer:
    """Sistem de scoring urgență: reguli + ML hybrid."""

    def __init__(self):
        self._ml_model = None
        self._ml_loaded = False
        self._device = None
        # Inițial 100% reguli
        self._rule_weight = 1.0
        self._ml_weight = 0.0
        logger.info("UrgencyScorer inițializat (mode: rule-based)")

    def _get_device(self):
        if self._device is None:
            import torch
            self._device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        return self._device

    def load_ml_model(self, model_path: Optional[str] = None) -> bool:
        """Încarcă modelul ML pentru urgency scoring."""
        if model_path is None:
            model_path = str(settings.model_storage / "urgency_scorer" / "active")

        if not Path(model_path).exists():
            logger.info("Model urgency ML nu există. Se folosesc doar regulile.")
            return False

        try:
            import torch
            self._ml_model = torch.load(
                Path(model_path) / "model.pt",
                map_location=self._get_device(),
                weights_only=False,
            )
            self._ml_model.eval()
            self._ml_loaded = True
            self._rule_weight = settings.URGENCY_RULE_WEIGHT
            self._ml_weight = settings.URGENCY_ML_WEIGHT
            logger.info(
                f"Model urgency ML încărcat. "
                f"Weights: rules={self._rule_weight}, ml={self._ml_weight}"
            )
            return True
        except Exception as e:
            logger.error(f"Eroare la încărcarea modelului urgency: {e}")
            return False

    def score(
        self,
        document_type: str,
        total_amount: Optional[float] = None,
        deadline_date: Optional[datetime] = None,
        avg_ocr_confidence: float = 1.0,
        is_duplicate_risk: bool = False,
        client_tier: str = "standard",
        ocr_text: str = "",
    ) -> Tuple[float, Dict[str, Any]]:
        """
        Calculează scorul de urgență.

        Returns:
            (score 0-100, breakdown dict)
        """
        # Rule-based component
        rule_score, fired_rules = self._score_rules(
            document_type=document_type,
            total_amount=total_amount,
            deadline_date=deadline_date,
            avg_ocr_confidence=avg_ocr_confidence,
            is_duplicate_risk=is_duplicate_risk,
            client_tier=client_tier,
        )

        # ML component
        ml_score = 0.0
        if self._ml_loaded and self._ml_model is not None and ocr_text:
            ml_score = self._score_ml(
                ocr_text=ocr_text,
                document_type=document_type,
                total_amount=total_amount,
                deadline_date=deadline_date,
            )

        # Combined score
        final_score = min(
            self._rule_weight * rule_score + self._ml_weight * ml_score,
            100.0,
        )

        breakdown = {
            "final_score": round(final_score, 2),
            "rule_score": round(rule_score, 2),
            "ml_score": round(ml_score, 2),
            "rule_weight": self._rule_weight,
            "ml_weight": self._ml_weight,
            "fired_rules": fired_rules,
        }

        logger.debug(f"Urgency score: {final_score:.1f} (rules={rule_score:.1f}, ml={ml_score:.1f})")
        return round(final_score, 2), breakdown

    def _score_rules(
        self,
        document_type: str,
        total_amount: Optional[float],
        deadline_date: Optional[datetime],
        avg_ocr_confidence: float,
        is_duplicate_risk: bool,
        client_tier: str,
    ) -> Tuple[float, Dict[str, int]]:
        """Calculează scorul rule-based."""
        score = 0.0
        fired = {}
        now = datetime.now(timezone.utc)

        # Deadline rules
        if deadline_date:
            delta = (deadline_date - now).days
            if delta < 0:
                fired["overdue"] = URGENCY_RULES["overdue"]
            elif delta == 0:
                fired["due_today"] = URGENCY_RULES["due_today"]
            elif delta <= 3:
                fired["due_in_1_3_days"] = URGENCY_RULES["due_in_1_3_days"]
            elif delta <= 7:
                fired["due_in_1_week"] = URGENCY_RULES["due_in_1_week"]
            elif delta <= 30:
                fired["due_in_1_month"] = URGENCY_RULES["due_in_1_month"]

        # Document type rules
        type_rule = f"type_{document_type}"
        if type_rule in URGENCY_RULES:
            fired[type_rule] = URGENCY_RULES[type_rule]

        # Amount rules
        if total_amount is not None:
            if total_amount > 50000:
                fired["amount_over_50000"] = URGENCY_RULES["amount_over_50000"]
            elif total_amount > 10000:
                fired["amount_over_10000"] = URGENCY_RULES["amount_over_10000"]
            elif total_amount > 1000:
                fired["amount_over_1000"] = URGENCY_RULES["amount_over_1000"]

        # Other rules
        if is_duplicate_risk:
            fired["duplicate_risk"] = URGENCY_RULES["duplicate_risk"]

        if avg_ocr_confidence < settings.OCR_CONFIDENCE_THRESHOLD:
            fired["low_ocr_confidence"] = URGENCY_RULES["low_ocr_confidence"]

        if client_tier == "premium":
            fired["premium_client"] = URGENCY_RULES["premium_client"]

        score = sum(fired.values())
        return min(score, 100.0), fired

    def _score_ml(
        self,
        ocr_text: str,
        document_type: str,
        total_amount: Optional[float],
        deadline_date: Optional[datetime],
    ) -> float:
        """Calculează scorul ML (feedforward pe BERT embeddings + features)."""
        try:
            from transformers import BertTokenizer, BertModel

            tokenizer = BertTokenizer.from_pretrained(
                str(settings.model_storage / "bert_base")
            )
            bert = BertModel.from_pretrained(
                str(settings.model_storage / "bert_base")
            )
            bert.to(self._device)
            bert.eval()

            inputs = tokenizer(
                ocr_text,
                return_tensors="pt",
                max_length=settings.MAX_SEQUENCE_LENGTH,
                truncation=True,
                padding="max_length",
            )
            inputs = {k: v.to(self._device) for k, v in inputs.items()}

            with torch.no_grad():
                outputs = bert(**inputs)
                cls_embedding = outputs.last_hidden_state[:, 0, :]  # [CLS] token

            # Handcrafted features
            now = datetime.now(timezone.utc)
            days_until = 30.0
            if deadline_date:
                days_until = max((deadline_date - now).days, -30)
            days_normalized = days_until / 30.0

            amount_norm = 0.0
            if total_amount and total_amount > 0:
                amount_norm = math.log10(total_amount) / 6.0  # log scale

            doc_type_map = {
                "invoice": 0, "receipt": 1, "contract": 2,
                "tax_declaration": 3, "payroll": 4,
                "bank_statement": 5, "other": 6,
            }
            type_idx = doc_type_map.get(document_type, 6)
            type_onehot = torch.zeros(7, device=self._device)
            type_onehot[type_idx] = 1.0

            extra_features = torch.tensor(
                [days_normalized, amount_norm],
                dtype=torch.float32,
                device=self._device,
            ).unsqueeze(0)

            features = torch.cat([
                cls_embedding,
                type_onehot.unsqueeze(0),
                extra_features,
            ], dim=-1)

            with torch.no_grad():
                ml_score = self._ml_model(features).item()

            return max(0.0, min(ml_score, 100.0))

        except Exception as e:
            logger.error(f"Eroare ML urgency scoring: {e}")
            return 0.0


# Singleton
urgency_scorer = UrgencyScorer()

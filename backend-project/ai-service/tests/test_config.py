"""Teste pentru configurarea AI-Service."""

import pytest


class TestConfig:
    def test_settings_load(self):
        from app.core.config import settings
        assert settings.AI_SERVICE_PORT == 3778
        assert settings.CLASSIFIER_NUM_LABELS == 7
        assert settings.NER_NUM_LABELS == 17
        assert settings.MAX_SEQUENCE_LENGTH == 512

    def test_model_storage_path(self):
        from app.core.config import settings
        path = settings.model_storage
        assert path.exists()

    def test_training_data_path(self):
        from app.core.config import settings
        path = settings.training_data
        assert path.exists()

    def test_allowed_origins(self):
        from app.core.config import settings
        origins = settings.allowed_origins_list
        assert isinstance(origins, list)
        assert len(origins) >= 1

    def test_urgency_weights_sum(self):
        from app.core.config import settings
        total = settings.URGENCY_RULE_WEIGHT + settings.URGENCY_ML_WEIGHT
        assert abs(total - 1.0) < 0.01

    def test_min_corrections_positive(self):
        from app.core.config import settings
        assert settings.MIN_CORRECTIONS_BEFORE_RETRAIN > 0


class TestNERLabels:
    def test_label_count(self):
        from app.processors.ner_extractor import NER_LABELS, LABEL2ID, ID2LABEL
        assert len(NER_LABELS) == 17
        assert len(LABEL2ID) == 17
        assert len(ID2LABEL) == 17

    def test_o_label_is_zero(self):
        from app.processors.ner_extractor import LABEL2ID
        assert LABEL2ID["O"] == 0

    def test_bio_consistency(self):
        from app.processors.ner_extractor import NER_LABELS
        entity_types = set()
        for label in NER_LABELS:
            if label.startswith("B-"):
                entity_types.add(label[2:])
            elif label.startswith("I-"):
                entity_types.add(label[2:])

        # Every B- should have an I- counterpart
        for et in entity_types:
            assert f"B-{et}" in NER_LABELS
            assert f"I-{et}" in NER_LABELS

    def test_expected_entity_types(self):
        from app.processors.ner_extractor import LABEL2ID
        expected = ["INVOICE_NUM", "DATE", "VENDOR", "CUI", "AMOUNT", "VAT", "TOTAL", "IBAN"]
        for et in expected:
            assert f"B-{et}" in LABEL2ID
            assert f"I-{et}" in LABEL2ID

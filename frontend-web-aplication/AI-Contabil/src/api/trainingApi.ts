/**
 * API client pentru Training - antrenare modele AI
 */
import { apiRequest } from './apiClient';

export interface TrainingStats {
  total_examples: number;
  unused_examples: number;
  type_corrections: number;
  entity_corrections: number;
  processed_documents: number;
  avg_ocr_confidence: number;
  min_required_for_training: number;
  can_retrain_classifier: boolean;
  can_retrain_ner: boolean;
  active_models: Array<{
    name: string;
    version: string;
    accuracy: Record<string, number> | null;
    dataset_size: number;
    training_date: string;
  }>;
}

export interface TrainingDocument {
  id: string;
  title: string;
  file_name: string;
  document_type: string;
  status: string;
  avg_ocr_confidence: number | null;
  has_flagged_fields: boolean;
  document_type_confidence: number | null;
  urgency_score: number | null;
  created_at: string;
  processed_at: string | null;
}

export interface OcrBlock {
  text: string;
  confidence: number;
  bbox: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  page?: number;
}

export interface ExtractedField {
  id: string;
  field_name: string;
  value: string;
  confidence: number;
  is_flagged: boolean;
  was_corrected: boolean;
  original_value: string | null;
}

export interface DocumentOcrData {
  document: {
    id: string;
    title: string;
    file_name: string;
    file_path: string;
    document_type: string;
    document_type_confidence: number | null;
    status: string;
    avg_ocr_confidence: number | null;
    urgency_score: number | null;
    urgency_breakdown: Record<string, unknown> | null;
  };
  ocr: {
    text: string;
    blocks: OcrBlock[];
    sections: Record<string, OcrBlock[]>;
    avg_confidence: number;
    has_flagged: boolean;
  };
  extracted_fields: ExtractedField[];
}

export interface CorrectionPayload {
  document_type?: string;
  fields?: Record<string, string>;
  urgency_feedback?: 'too_high' | 'correct' | 'too_low';
}

// === API Functions ===

export async function fetchTrainingStats(): Promise<TrainingStats> {
  return apiRequest<TrainingStats>('/training/stats');
}

export async function fetchTrainingDocuments(
  status?: string,
  limit = 20,
  offset = 0,
): Promise<{ total: number; documents: TrainingDocument[] }> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  params.set('limit', String(limit));
  params.set('offset', String(offset));
  return apiRequest(`/training/documents?${params.toString()}`);
}

export async function fetchDocumentOcr(documentId: string): Promise<DocumentOcrData> {
  return apiRequest<DocumentOcrData>(`/training/documents/${documentId}/ocr`);
}

export async function submitCorrection(
  documentId: string,
  correction: CorrectionPayload,
): Promise<{ status: string; training_example_id: string }> {
  return apiRequest(`/training/documents/${documentId}/correct`, {
    method: 'POST',
    body: correction,
  });
}

export async function confirmDocument(
  documentId: string,
): Promise<{ status: string }> {
  return apiRequest(`/training/documents/${documentId}/confirm`, {
    method: 'POST',
  });
}

export async function triggerDocumentProcessing(
  documentId: string,
): Promise<{ status: string; fields_extracted: number; avg_confidence: number; has_flagged: boolean; message: string }> {
  return apiRequest(`/training/documents/${documentId}/process`, { method: 'POST' });
}

export async function fetchModels(): Promise<Array<{
  id: string;
  model_name: string;
  version: string;
  training_date: string;
  dataset_size: number;
  accuracy_metrics: Record<string, number> | null;
  is_active: boolean;
}>> {
  return apiRequest('/training/models');
}

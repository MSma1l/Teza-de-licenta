export type SursaDocument = 'scaner' | 'camera' | 'galerie' | 'pdf';

export interface FisierLocalDocument {
  uri: string;
  nume: string;
  mimeType: string;
  marime?: number;
  sursa: SursaDocument;
}

export interface RaspunsDocument {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  document_type: string;
  status: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  ocr_text: string | null;
  avg_ocr_confidence: number | null;
  has_flagged_fields: boolean;
  document_type_confidence: number | null;
  urgency_score: number | null;
  uploaded_at: string;
  processed_at: string | null;
  created_at: string;
}

export type StareDocument =
  | 'incarcat'
  | 'in_procesare'
  | 'ocr_complet'
  | 'clasificat'
  | 'extras'
  | 'pending_approval'
  | 'requires_manual'
  | 'duplicate_detected'
  | 'verificat'
  | 'aprobat'
  | 'respins'
  | 'escaladat'
  | 'arhivat'
  | 'ocr_failed';

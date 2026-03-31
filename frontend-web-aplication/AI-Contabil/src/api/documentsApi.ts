import { apiRequest, apiUpload } from './apiClient';

export interface DocumentData {
  id: string;
  owner_id: string;
  company_id: string | null;
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

export interface DocumentListResponse {
  documents: DocumentData[];
  total: number;
}

export interface UploadDocumentData {
  file: File;
  title: string;
  description?: string;
  document_type?: string;
}

export async function fetchDocuments(params?: {
  document_type?: string;
  doc_status?: string;
  skip?: number;
  limit?: number;
}): Promise<DocumentListResponse> {
  const query = new URLSearchParams();
  if (params?.document_type) query.set('document_type', params.document_type);
  if (params?.doc_status) query.set('doc_status', params.doc_status);
  if (params?.skip) query.set('skip', String(params.skip));
  if (params?.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  return apiRequest<DocumentListResponse>(`/documents/${qs ? `?${qs}` : ''}`);
}

export async function fetchDocument(id: string): Promise<DocumentData> {
  return apiRequest<DocumentData>(`/documents/${id}`);
}

export async function uploadDocument(data: UploadDocumentData): Promise<DocumentData> {
  const formData = new FormData();
  formData.append('file', data.file);
  formData.append('title', data.title);
  if (data.description) formData.append('description', data.description);
  if (data.document_type) formData.append('document_type', data.document_type);
  return apiUpload<DocumentData>('/documents/upload', formData);
}

export async function updateDocument(id: string, data: {
  title?: string;
  description?: string;
  document_type?: string;
  status?: string;
}): Promise<DocumentData> {
  return apiRequest<DocumentData>(`/documents/${id}`, { method: 'PUT', body: data });
}

export async function deleteDocument(id: string): Promise<void> {
  await apiRequest<void>(`/documents/${id}`, { method: 'DELETE' });
}

export const DOCUMENT_TYPES: Record<string, string> = {
  factura: 'Factură',
  chitanta: 'Chitanță',
  contract: 'Contract',
  extras_bancar: 'Extras bancar',
  bon_fiscal: 'Bon fiscal',
  declaratie: 'Declarație',
  act_constitutiv: 'Act constitutiv',
  certificat: 'Certificat',
  proces_verbal: 'Proces verbal',
  stat_plata: 'Stat de plată',
  altele: 'Altele',
};

export const DOCUMENT_STATUSES: Record<string, string> = {
  incarcat: 'Încărcat',
  in_procesare: 'În procesare',
  ocr_complet: 'OCR complet',
  clasificat: 'Clasificat',
  extras: 'Extras',
  pending_approval: 'Așteptă aprobare',
  requires_manual: 'Necesită revizie',
  duplicate_detected: 'Duplicat',
  verificat: 'Verificat',
  aprobat: 'Aprobat',
  respins: 'Respins',
  escaladat: 'Escaladat',
  arhivat: 'Arhivat',
};

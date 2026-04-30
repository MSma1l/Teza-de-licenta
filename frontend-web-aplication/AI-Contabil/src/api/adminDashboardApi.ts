/* ============================================
   ADMIN DASHBOARD API — agregari pentru pagina admin

   Combinam endpoint-uri din backend principal (3777) si AI service (3778).
   ============================================ */
import { apiRequest } from './apiClient';
import { aiServiceRequest } from './aiServiceClient';

// === Backend principal (3777) ===

export interface UsersByRole {
  total: number;
  admin: number;
  contabil: number;
  client: number;
}

export interface DocumentsStats {
  total: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
}

export interface DocumentsTimeseries {
  days: number;
  series: Array<{ date: string; count: number }>;
}

export interface TopContabil {
  id: string;
  username: string;
  full_name: string | null;
  client_count: number;
}

export const fetchUsersByRole = () =>
  apiRequest<UsersByRole>('/admin/dashboard/users-by-role');

export const fetchDocumentsStats = () =>
  apiRequest<DocumentsStats>('/admin/dashboard/documents-stats');

export const fetchDocumentsTimeseries = (days = 7) =>
  apiRequest<DocumentsTimeseries>(`/admin/dashboard/documents-timeseries?days=${days}`);

export const fetchTopContabili = (limit = 5) =>
  apiRequest<{ top: TopContabil[] }>(`/admin/dashboard/top-contabili?limit=${limit}`);

// === AI service (3778) ===

export interface SystemHealth {
  status: string;
  database?: string;
  redis?: string;
  ocr_engine?: string;
  classifier_model?: string;
  ner_model?: string;
  urgency_model?: string;
  faiss_index?: string;
  celery_workers?: number;
  // Valorile pot fi string sau number (celery_workers e numar). null pentru fallback.
  [key: string]: string | number | undefined;
}

export interface AuditLogEntry {
  id: string;
  action_type: string;
  user_id: string | null;
  document_id: string | null;
  ip_address: string | null;
  timestamp: string;
  entry_hash: string;
}

export const fetchSystemHealth = () =>
  aiServiceRequest<SystemHealth>('/admin/system/health');

export const fetchAuditLog = (limit = 5) =>
  apiRequest<AuditLogEntry[]>(`/admin/dashboard/audit-log?limit=${limit}`);

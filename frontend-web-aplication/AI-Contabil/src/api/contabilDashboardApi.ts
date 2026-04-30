/* ============================================
   CONTABIL DASHBOARD API — agregari pt pagina principala a contabilului
   ============================================ */
import { apiRequest } from './apiClient';

export interface ContabilOverview {
  clienti: number;
  documente_total: number;
  documente_coada: number;
  documente_aprobate: number;
  documente_flagged: number;
  rapoarte_create: number;
  chat_escalated_open: number;
}

export interface ContabilClient {
  id: string;
  username: string;
  full_name: string | null;
  email: string;
  documents_count: number;
  last_login: string | null;
}

export interface ContabilQueueDoc {
  id: string;
  title: string;
  document_type: string;
  status: string;
  urgency_score: number;
  owner_id: string;
  has_flagged_fields: boolean;
  created_at: string | null;
}

export interface ContabilTimeseries {
  days: number;
  series: Array<{ date: string; count: number }>;
}

export const fetchContabilOverview = () =>
  apiRequest<ContabilOverview>('/contabil/dashboard/overview');

export const fetchContabilClienti = () =>
  apiRequest<{ clienti: ContabilClient[] }>('/contabil/dashboard/clienti');

export const fetchContabilCoadaUrgente = (limit = 5) =>
  apiRequest<{ documente: ContabilQueueDoc[] }>(`/contabil/dashboard/coada-urgente?limit=${limit}`);

export const fetchContabilTimeseries = (days = 7) =>
  apiRequest<ContabilTimeseries>(`/contabil/dashboard/timeseries?days=${days}`);

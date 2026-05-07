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

// === New widgets B1-B4 ===

export interface PerformanceData {
  saptamana_asta: { documente_noi: number; documente_aprobate: number; rapoarte_create: number };
  saptamana_trecuta: { documente_noi: number; documente_aprobate: number; rapoarte_create: number };
  delta_pct: { documente_noi: number | null; documente_aprobate: number | null; rapoarte_create: number | null };
}

export interface ActivityEvent {
  type: string;
  title: string;
  client_name: string;
  owner_id: string;
  document_id: string;
  status: string;
  timestamp: string | null;
}

export interface InactiveClient {
  id: string;
  username: string;
  full_name: string | null;
  email: string;
  last_doc_at: string | null;
  days_since_last: number | null;
}

export interface UpcomingDeadline {
  report_type: string;
  name: string;
  period: string;
  due_date: string;
  days_left: number;
  urgency: 'urgent' | 'warning' | 'normal';
}

export const fetchContabilPerformance = () =>
  apiRequest<PerformanceData>('/contabil/dashboard/performance');

export const fetchContabilActivityFeed = (limit = 15) =>
  apiRequest<{ events: ActivityEvent[] }>(`/contabil/dashboard/activity-feed?limit=${limit}`);

export const fetchContabilInactiveClients = (daysThreshold = 14) =>
  apiRequest<{ inactive: InactiveClient[]; threshold_days: number }>(
    `/contabil/dashboard/inactive-clients?days_threshold=${daysThreshold}`,
  );

export const fetchUpcomingDeadlines = () =>
  apiRequest<{ upcoming: UpcomingDeadline[]; count: number }>('/reports/sfs/upcoming');

// Note interne pe client
export const fetchClientNotes = (clientId: string) =>
  apiRequest<{ notes: string; updated_at: string | null }>(
    `/contabil/dashboard/client/${clientId}/notes`,
  );

export const setClientNotes = (clientId: string, notes: string) =>
  apiRequest<{ status: string; notes: string }>(
    `/contabil/dashboard/client/${clientId}/notes`,
    { method: 'PUT', body: { notes } },
  );

// Bulk actions
export const bulkApproveDocuments = (documentIds: string[]) =>
  apiRequest<{ approved: number; errors: string[]; total: number }>(
    '/training/documents/bulk-approve',
    { method: 'POST', body: { document_ids: documentIds } },
  );

export const bulkReprocessDocuments = (documentIds: string[]) =>
  apiRequest<{ processed: number; errors: string[]; total: number }>(
    '/training/documents/bulk-reprocess',
    { method: 'POST', body: { document_ids: documentIds } },
  );

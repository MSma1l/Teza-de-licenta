import { apiRequest } from './apiClient';

export interface ReportData {
  id: string;
  created_by: string;
  client_id: string;
  title: string;
  description: string | null;
  report_type: string;
  status: string;
  period_start: string | null;
  period_end: string | null;
  file_path: string | null;
  content: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportListResponse {
  reports: ReportData[];
  total: number;
}

export async function fetchReports(params?: {
  report_type?: string;
  report_status?: string;
  client_id?: string;
  accountant_id?: string;
  skip?: number;
  limit?: number;
}): Promise<ReportListResponse> {
  const query = new URLSearchParams();
  if (params?.report_type) query.set('report_type', params.report_type);
  if (params?.report_status) query.set('report_status', params.report_status);
  if (params?.client_id) query.set('client_id', params.client_id);
  if (params?.accountant_id) query.set('accountant_id', params.accountant_id);
  if (params?.skip) query.set('skip', String(params.skip));
  if (params?.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  return apiRequest<ReportListResponse>(`/reports/${qs ? `?${qs}` : ''}`);
}

export async function fetchReport(id: string): Promise<ReportData> {
  return apiRequest<ReportData>(`/reports/${id}`);
}

export async function deleteReport(id: string): Promise<void> {
  await apiRequest<void>(`/reports/${id}`, { method: 'DELETE' });
}

export const REPORT_TYPES: Record<string, string> = {
  bilant_contabil: 'Bilanț contabil',
  balanta_verificare: 'Balanță de verificare',
  registru_jurnal: 'Registru jurnal',
  registru_casa: 'Registru casă',
  declaratie_fiscala: 'Declarație fiscală',
  factura_emisa: 'Factură emisă',
  situatie_profit_pierdere: 'Situație profit/pierdere',
  raport_tva: 'Raport TVA',
  fisa_cont: 'Fișă cont',
  jurnal_vanzari: 'Jurnal vânzări',
  jurnal_cumparari: 'Jurnal cumpărări',
  decont_tva: 'Decont TVA',
  raport_salarii: 'Raport salarii',
  altele: 'Altele',
};

export const REPORT_STATUSES: Record<string, string> = {
  draft: 'Ciornă',
  in_lucru: 'În lucru',
  finalizat: 'Finalizat',
  expediat: 'Expediat',
  vizualizat: 'Vizualizat',
  arhivat: 'Arhivat',
};

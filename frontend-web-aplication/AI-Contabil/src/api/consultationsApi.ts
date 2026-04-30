/* ============================================
   CONSULTATIONS API — formular public + panou receptionist
   ============================================ */
import { apiRequest } from './apiClient';

export type ConsultationStatus =
  | 'noua'
  | 'in_lucru'
  | 'contactat'
  | 'programat'
  | 'inchis_ok'
  | 'inchis_respins';

export interface Consultation {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  message: string | null;
  status: ConsultationStatus;
  assigned_to: string | null;
  internal_notes: string | null;
  source_ip: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConsultationCreatePayload {
  full_name: string;
  email: string;
  phone?: string;
  company_name?: string;
  message?: string;
}

/** Public — orice vizitator poate trimite un formular fara auth. */
export const submitConsultation = (payload: ConsultationCreatePayload): Promise<Consultation> =>
  apiRequest('/consultations', { method: 'POST', body: payload, noAuth: true });

export const listConsultations = (status?: ConsultationStatus): Promise<Consultation[]> => {
  const qs = status ? `?status=${status}` : '';
  return apiRequest(`/consultations${qs}`);
};

export const getConsultation = (id: string): Promise<Consultation> =>
  apiRequest(`/consultations/${id}`);

export const updateConsultation = (
  id: string,
  data: Partial<{ status: ConsultationStatus; internal_notes: string; assigned_to: string }>,
): Promise<Consultation> =>
  apiRequest(`/consultations/${id}`, { method: 'PATCH', body: data });

export const deleteConsultation = (id: string): Promise<void> =>
  apiRequest(`/consultations/${id}`, { method: 'DELETE' });

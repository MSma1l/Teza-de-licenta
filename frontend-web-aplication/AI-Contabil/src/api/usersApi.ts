/**
 * API client pentru operatii cu utilizatori — admin si contabil.
 */
import { apiRequest } from './apiClient';
import type { UserData } from './authApi';

export interface UserListResponse {
  users: UserData[];
  total: number;
}

/** Admin/Contabil: lista tuturor utilizatorilor, optional filtrat pe rol. */
export const listUsers = (role?: string, skip = 0, limit = 100): Promise<UserListResponse> => {
  const params = new URLSearchParams();
  if (role) params.set('role', role);
  params.set('skip', String(skip));
  params.set('limit', String(limit));
  return apiRequest<UserListResponse>(`/users/?${params.toString()}`);
};

/** Lista de contabili disponibili (public dupa login). */
export const listAccountants = (): Promise<UserListResponse> =>
  apiRequest<UserListResponse>('/users/accountants');

/** Contabil: clientii asignati lui. */
export const getMyClients = (): Promise<UserListResponse> =>
  apiRequest<UserListResponse>('/users/my-clients');

/** Contabil: asigneaza-si un client existent (client_id e UUID). */
export const assignClient = (clientId: string): Promise<{ message: string }> =>
  apiRequest<{ message: string }>(`/users/assign-client?client_id=${encodeURIComponent(clientId)}`, {
    method: 'POST',
  });

/** Admin: schimba rolul unui user. */
export const changeUserRole = (userId: string, role: 'admin' | 'contabil' | 'receptionist' | 'client'): Promise<UserData> =>
  apiRequest<UserData>(`/users/${userId}/role`, {
    method: 'PATCH',
    body: { role },
  });

export interface CreateContabilData {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
}

/** Admin: creeaza direct un cont cu rol CONTABIL. */
export const createContabil = (data: CreateContabilData): Promise<UserData> =>
  apiRequest<UserData>('/users/create-contabil', {
    method: 'POST',
    body: data,
  });

/** Admin: creeaza direct un cont cu rol RECEPTIONIST. */
export const createReceptionist = (data: CreateContabilData): Promise<UserData> =>
  apiRequest<UserData>('/users/create-receptionist', {
    method: 'POST',
    body: data,
  });

/** Admin: clientii asignati unui contabil anume. */
export const getClientsOfContabil = (contabilId: string): Promise<UserListResponse> =>
  apiRequest<UserListResponse>(`/users/contabil/${contabilId}/clients`);

/** Admin: asigneaza un client la un contabil. */
export const adminAssignClient = (contabilId: string, clientId: string): Promise<{ message: string }> =>
  apiRequest<{ message: string }>('/users/admin/assign-client', {
    method: 'POST',
    body: { contabil_id: contabilId, client_id: clientId },
  });

/** Admin: dezasigneaza un client de la un contabil. */
export const adminUnassignClient = (contabilId: string, clientId: string): Promise<{ message: string }> =>
  apiRequest<{ message: string }>('/users/admin/assign-client', {
    method: 'DELETE',
    body: { contabil_id: contabilId, client_id: clientId },
  });

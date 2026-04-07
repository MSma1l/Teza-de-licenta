/* ============================================
   API - AUTENTIFICARE

   Funcțiile pentru login, register și refresh.
   ============================================ */

import { apiRequest, saveTokens } from './apiClient';

/* --- Tipuri --- */
export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  phone?: string;
  full_name?: string;
  company_name?: string;
  idno?: string;
  vat_code?: string;
  legal_address?: string;
  bank_name?: string;
  iban?: string;
  director_name?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserData {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  two_factor_enabled: boolean;
  created_at: string;
}

/* --- Login --- */
export const loginUser = async (data: LoginData): Promise<UserData> => {
  const tokens = await apiRequest<TokenResponse>('/auth/login', {
    method: 'POST',
    body: data,
    noAuth: true,
  });
  saveTokens(tokens.access_token, tokens.refresh_token);

  /* Obține datele utilizatorului */
  const user = await apiRequest<UserData>('/auth/me');
  return user;
};

/* --- Register --- */
export const registerUser = async (data: RegisterData): Promise<UserData> => {
  return apiRequest<UserData>('/auth/register', {
    method: 'POST',
    body: data,
    noAuth: true,
  });
};

/* --- Obține utilizatorul curent --- */
export const getCurrentUser = async (): Promise<UserData> => {
  return apiRequest<UserData>('/auth/me');
};

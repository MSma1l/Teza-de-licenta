/* ============================================
   API - SETTINGS

   Funcțiile pentru comunicarea cu backend-ul
   pentru setările utilizatorului.
   Conectat la backend-ul real.
   ============================================ */

import type { UserProfile, PasswordChangeData, SecurityDocument } from '../models/settingsTypes';
import { apiRequest, apiUpload } from './apiClient';
import type { UserData } from './authApi';

/* --- Convertește UserData din backend în UserProfile pentru frontend --- */
function toUserProfile(data: UserData): UserProfile {
  return {
    name: data.full_name || data.username,
    email: data.email,
    contactNumber: data.phone || '',
    avatarUrl: data.avatar_url || '',
  };
}

/* --- Obține datele profilului --- */
export const fetchUserProfile = async (): Promise<UserProfile> => {
  const data = await apiRequest<UserData>('/users/me');
  return toUserProfile(data);
};

/* --- Actualizează datele profilului --- */
export const updateUserProfile = async (data: Partial<UserProfile>): Promise<UserProfile> => {
  const updated = await apiRequest<UserData>('/users/me', {
    method: 'PUT',
    body: {
      full_name: data.name,
      email: data.email,
      phone: data.contactNumber,
    },
  });
  return toUserProfile(updated);
};

/* --- Încarcă avatar nou --- */
export const uploadAvatar = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const data = await apiUpload<UserData>('/users/me/avatar', formData);
  return data.avatar_url || '';
};

/* --- Schimbă parola --- */
export const changePassword = async (data: PasswordChangeData): Promise<boolean> => {
  await apiRequest('/users/me/change-password', {
    method: 'POST',
    body: {
      current_password: data.currentPassword,
      new_password: data.newPassword,
      confirm_password: data.confirmPassword,
    },
  });
  return true;
};

/* --- Obține documentele de securitate --- */
export const fetchSecurityDocuments = async (): Promise<SecurityDocument[]> => {
  const data = await apiRequest<{ documents: SecurityDocument[]; total: number }>('/documents/?document_type=certificat');
  return data.documents.map((doc) => ({
    id: doc.id,
    name: doc.name || '',
    type: doc.type || '',
    uploadedDate: doc.uploadedDate || '',
    status: doc.status || 'pending',
  }));
};

/* --- Încarcă un document nou --- */
export const uploadSecurityDocument = async (file: File, type: string): Promise<SecurityDocument> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', file.name);
  formData.append('document_type', type);
  const doc = await apiUpload<{ id: string; file_name: string; document_type: string; uploaded_at: string; status: string }>('/documents/upload', formData);
  return {
    id: doc.id,
    name: doc.file_name,
    type: doc.document_type,
    uploadedDate: doc.uploaded_at,
    status: 'pending',
  };
};

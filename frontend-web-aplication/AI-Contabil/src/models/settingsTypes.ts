/* ============================================
   TIPURI TYPESCRIPT - SETTINGS

   Interfețele pentru datele utilizate în
   paginile de Settings:
   - UserProfile: datele profilului
   - Notification: o notificare
   - SecurityData: date de securitate
   - FaqItem: o întrebare frecventă
   - AlertToast: tipul de alertă
   ============================================ */

/* --- Datele profilului utilizatorului --- */
export interface UserProfile {
  name: string;
  email: string;
  contactNumber: string;
  avatarUrl?: string;
}

/* --- O notificare din lista de notificări --- */
export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'urgent' | 'info' | 'warning';
  isRead: boolean;
}

/* --- Datele de securitate --- */
export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SecurityDocument {
  id: string;
  name: string;
  type: string;
  uploadedDate: string;
  status: 'verified' | 'pending' | 'expired';
}

/* --- Întrebare frecventă (FAQ) --- */
export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

/* --- Tipurile de alertă/toast --- */
export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertToastData {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  duration?: number;
}

/* --- Secțiunile din sidebar-ul Settings --- */
export type SettingsSection = 'edit-profile' | 'notification' | 'security' | 'help';

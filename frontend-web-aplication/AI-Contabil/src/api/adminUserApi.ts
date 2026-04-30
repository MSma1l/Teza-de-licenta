/* ============================================
   ADMIN USER ACTIONS API
   - reset password (admin)
   - audit log filtered by user (AI service)
   ============================================ */
import { apiRequest } from './apiClient';

export interface ResetPasswordResponse {
  user_id: string;
  username: string;
  new_password: string;
  message: string;
}

export const adminResetPassword = (
  userId: string,
  newPassword?: string,
): Promise<ResetPasswordResponse> =>
  apiRequest<ResetPasswordResponse>(`/users/${userId}/admin-reset-password`, {
    method: 'POST',
    body: { new_password: newPassword || null },
  });

export interface AuditEntry {
  id: string;
  action_type: string;
  user_id: string;
  document_id: string | null;
  ip_address: string | null;
  timestamp: string;
  entry_hash: string;
}

export const fetchUserAuditLog = (userId: string, limit = 50): Promise<AuditEntry[]> =>
  apiRequest<AuditEntry[]>(`/admin/dashboard/audit-log?user_id=${userId}&limit=${limit}`);

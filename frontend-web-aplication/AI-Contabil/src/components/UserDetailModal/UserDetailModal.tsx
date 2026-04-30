/* ============================================
   USER DETAIL MODAL — admin actions per user

   Pentru CONTABIL/ADMIN: reset parola + activity log (audit)
   Pentru CLIENT: doar reset parola (la cerere)
   ============================================ */
import { useEffect, useState } from 'react';
import type { UserData } from '../../api/authApi';
import {
  adminResetPassword,
  fetchUserAuditLog,
  type AuditEntry,
} from '../../api/adminUserApi';

import CloseIcon from '@mui/icons-material/Close';
import LockResetIcon from '@mui/icons-material/LockReset';
import HistoryIcon from '@mui/icons-material/History';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface UserDetailModalProps {
  user: UserData;
  onClose: () => void;
}

const UserDetailModal = ({ user, onClose }: UserDetailModalProps) => {
  const role = user.role.toLowerCase();
  const isClient = role === 'client';

  // Activity log doar pentru non-client
  const [activity, setActivity] = useState<AuditEntry[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  useEffect(() => {
    if (isClient) return;
    setActivityLoading(true);
    fetchUserAuditLog(user.id, 30)
      .then((entries) => setActivity(entries))
      .catch((e) => setActivityError(e instanceof Error ? e.message : 'Eroare la log'))
      .finally(() => setActivityLoading(false));
  }, [user.id, isClient]);

  // Reset password state
  const [resetting, setResetting] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleReset() {
    if (!confirm(`Confirmi reseteaza parola pentru "${user.username}"?`)) return;
    setResetting(true);
    setResetError(null);
    setNewPassword(null);
    try {
      const res = await adminResetPassword(user.id);
      setNewPassword(res.new_password);
    } catch (e) {
      setResetError(e instanceof Error ? e.message : 'Eroare la resetare');
    } finally {
      setResetting(false);
    }
  }

  async function copyPassword() {
    if (!newPassword) return;
    try {
      await navigator.clipboard.writeText(newPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback silent
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* === Header === */}
        <header className="flex items-center justify-between p-5 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-lg">
              {(user.full_name || user.username).charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">
                {user.full_name || user.username}
              </h2>
              <p className="text-sm text-neutral-500">@{user.username} · {user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-100 transition"
            aria-label="Inchide"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* === Info de baza === */}
          <section>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <InfoCard label="Rol" value={user.role} />
              <InfoCard label="Status" value={user.is_active ? 'Activ' : 'Inactiv'} />
              <InfoCard label="Verificat" value={user.is_verified ? 'Da' : 'Nu'} />
              <InfoCard
                label="2FA"
                value={user.two_factor_enabled ? 'Activat' : 'Dezactivat'}
              />
              <InfoCard label="Telefon" value={user.phone || '—'} />
              <InfoCard
                label="Cont creat"
                value={new Date(user.created_at).toLocaleDateString('ro')}
              />
            </div>
          </section>

          {/* === Reset parola === */}
          <section>
            <h3 className="font-bold text-neutral-900 mb-3 flex items-center gap-2">
              <LockResetIcon className="text-indigo-600" />
              {isClient ? 'Reset parola (la cerere)' : 'Reset parola'}
            </h3>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-900 mb-3">
                {isClient ? (
                  <>
                    Pentru clienti, parola se reseteaza{' '}
                    <strong>doar la cerere directa de la utilizator</strong>. Parola noua va fi
                    afisata o singura data.
                  </>
                ) : (
                  <>
                    Genereaza o parola noua pentru acest cont. Parola va fi afisata o singura data —
                    transmite-o utilizatorului prin canal sigur.
                  </>
                )}
              </p>

              {!newPassword && (
                <button
                  onClick={handleReset}
                  disabled={resetting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-md disabled:opacity-50"
                >
                  {resetting ? 'Se reseteaza...' : 'Genereaza parola noua'}
                </button>
              )}

              {resetError && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2 mt-2">
                  {resetError}
                </div>
              )}

              {newPassword && (
                <div className="mt-3 p-3 bg-white border-2 border-emerald-300 rounded-md">
                  <div className="text-xs font-semibold text-emerald-700 uppercase mb-2">
                    Parola noua (afisata o singura data)
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-base bg-neutral-100 px-3 py-2 rounded select-all">
                      {newPassword}
                    </code>
                    <button
                      onClick={copyPassword}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded inline-flex items-center gap-1"
                    >
                      <ContentCopyIcon style={{ fontSize: 16 }} />
                      {copied ? 'Copiat!' : 'Copiaza'}
                    </button>
                  </div>
                  <div className="text-xs text-neutral-500 mt-2">
                    ⚠ Salveaza acum — dupa ce inchizi modalul, nu mai poti vedea parola.
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* === Activity log (doar non-client) === */}
          {!isClient && (
            <section>
              <h3 className="font-bold text-neutral-900 mb-3 flex items-center gap-2">
                <HistoryIcon className="text-indigo-600" />
                Activitate (audit log)
              </h3>
              {activityLoading ? (
                <div className="text-sm text-neutral-500">Se incarca log-ul...</div>
              ) : activityError ? (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
                  {activityError}
                </div>
              ) : activity.length === 0 ? (
                <div className="text-sm text-neutral-500 italic">
                  Niciun eveniment inregistrat in audit log pentru acest user.
                </div>
              ) : (
                <ul className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg overflow-hidden">
                  {activity.map((e) => (
                    <li key={e.id} className="flex justify-between items-start gap-3 p-3 text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs font-semibold text-indigo-700">
                          {e.action_type}
                        </div>
                        <div className="text-xs text-neutral-500 mt-0.5">
                          IP: {e.ip_address || '—'}
                          {e.document_id && ` · doc: ${e.document_id.slice(0, 8)}…`}
                        </div>
                      </div>
                      <span className="text-xs text-neutral-400 whitespace-nowrap">
                        {new Date(e.timestamp).toLocaleString('ro')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-100">
      <div className="text-[10px] uppercase font-bold text-neutral-500 mb-1">{label}</div>
      <div className="text-sm font-semibold text-neutral-900">{value}</div>
    </div>
  );
}

export default UserDetailModal;

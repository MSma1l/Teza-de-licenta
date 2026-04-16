/**
 * Tab „Contabili” in pagina Training.
 * Vizibil doar pentru admini — permite creare contabil + schimbare rol + listare utilizatori.
 *
 * Acelasi continut functional ca pagina /admin, doar incorporat ca tab aici
 * (user a cerut sa fie accesibil din Antrenare Model AI).
 */
import { useEffect, useState, useCallback } from 'react';
import {
  listUsers,
  createContabil,
  changeUserRole,
  getClientsOfContabil,
  adminAssignClient,
  adminUnassignClient,
  type UserListResponse,
} from '../../../api/usersApi';
import type { UserData } from '../../../api/authApi';

type Filter = '' | 'admin' | 'contabil' | 'client';

export default function ContabilManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [total, setTotal] = useState(0);
  const [filtru, setFiltru] = useState<Filter>('');
  const [loading, setLoading] = useState(true);
  const [eroare, setEroare] = useState<string | null>(null);

  const [dialogDeschis, setDialogDeschis] = useState(false);
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formParola, setFormParola] = useState('');
  const [formNume, setFormNume] = useState('');
  const [formSeTrimite, setFormSeTrimite] = useState(false);
  const [formEroare, setFormEroare] = useState<string | null>(null);
  const [mesajOk, setMesajOk] = useState<string | null>(null);

  // Panou clienti per contabil
  const [contabilSelectat, setContabilSelectat] = useState<UserData | null>(null);
  const [clientiAsignati, setClientiAsignati] = useState<UserData[]>([]);
  const [loadingClienti, setLoadingClienti] = useState(false);

  const incarcaClientiContabil = useCallback(async (contabilId: string) => {
    setLoadingClienti(true);
    try {
      const r = await getClientsOfContabil(contabilId);
      setClientiAsignati(r.users);
    } catch (e) {
      setEroare(e instanceof Error ? e.message : 'Nu am putut incarca clientii');
    } finally {
      setLoadingClienti(false);
    }
  }, []);

  function deschidePanouClienti(contabil: UserData) {
    setContabilSelectat(contabil);
    setClientiAsignati([]);
    incarcaClientiContabil(contabil.id);
  }

  async function dezasigneaza(clientId: string) {
    if (!contabilSelectat) return;
    try {
      await adminUnassignClient(contabilSelectat.id, clientId);
      await incarcaClientiContabil(contabilSelectat.id);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Eroare dezasignare');
    }
  }

  async function asigneaza(clientId: string) {
    if (!contabilSelectat) return;
    try {
      await adminAssignClient(contabilSelectat.id, clientId);
      await incarcaClientiContabil(contabilSelectat.id);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Eroare asignare');
    }
  }

  const incarcaLista = useCallback(async () => {
    setLoading(true);
    setEroare(null);
    try {
      const r: UserListResponse = await listUsers(filtru || undefined, 0, 200);
      setUsers(r.users);
      setTotal(r.total);
    } catch (e) {
      setEroare(e instanceof Error ? e.message : 'Eroare necunoscuta');
    } finally {
      setLoading(false);
    }
  }, [filtru]);

  useEffect(() => {
    incarcaLista();
  }, [incarcaLista]);

  async function salveazaContabil(e: React.FormEvent) {
    e.preventDefault();
    setFormEroare(null);
    setMesajOk(null);
    if (formParola.length < 8) {
      setFormEroare('Parola trebuie sa aiba minim 8 caractere.');
      return;
    }
    setFormSeTrimite(true);
    try {
      const nou = await createContabil({
        username: formUsername.trim(),
        email: formEmail.trim(),
        password: formParola,
        full_name: formNume.trim() || undefined,
      });
      setDialogDeschis(false);
      setFormUsername('');
      setFormEmail('');
      setFormParola('');
      setFormNume('');
      setMesajOk(`Contabilul „${nou.full_name || nou.username}” a fost creat cu succes.`);
      await incarcaLista();
      setTimeout(() => setMesajOk(null), 5000);
    } catch (e) {
      setFormEroare(e instanceof Error ? e.message : 'Eroare la creare');
    } finally {
      setFormSeTrimite(false);
    }
  }

  async function schimbaRol(userId: string, rolNou: 'admin' | 'contabil' | 'client') {
    try {
      await changeUserRole(userId, rolNou);
      await incarcaLista();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Eroare la schimbarea rolului');
    }
  }

  return (
    <div>
      {/* Header + actiune */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Gestionare contabili</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Creeaza conturi noi de contabil si gestioneaza rolurile utilizatorilor.
          </p>
        </div>
        <button
          onClick={() => setDialogDeschis(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full shadow-md transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Creeaza contabil nou
        </button>
      </div>

      {mesajOk && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-3 mb-4 text-sm">
          {mesajOk}
        </div>
      )}

      {/* Filtru rol */}
      <div className="flex gap-2 flex-wrap mb-4">
        {(['', 'admin', 'contabil', 'client'] as Filter[]).map((f) => (
          <button
            key={f || 'all'}
            onClick={() => setFiltru(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
              filtru === f
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-neutral-700 border border-neutral-300 hover:border-indigo-400'
            }`}
          >
            {f === '' ? `Toti (${total})` : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {eroare && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4">
          {eroare}
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-neutral-700">Utilizator</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-700">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-700">Rol</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-700">Schimba rol</th>
                <th className="text-left px-4 py-3 font-semibold text-neutral-700">Clienti</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                    Se incarca...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                    Niciun utilizator gasit cu filtrul curent.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
                          {(u.full_name || u.username || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-neutral-900">{u.full_name || u.username}</span>
                          <span className="text-xs text-neutral-500">@{u.username}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${rolBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={(u.role || '').toLowerCase()}
                        onChange={(e) => schimbaRol(u.id, e.target.value as 'admin' | 'contabil' | 'client')}
                        className="text-sm border border-neutral-300 rounded-md px-2 py-1 bg-white hover:border-indigo-400"
                      >
                        <option value="client">client</option>
                        <option value="contabil">contabil</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {(u.role || '').toLowerCase() === 'contabil' ? (
                        <button
                          onClick={() => deschidePanouClienti(u)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                        >
                          Gestioneaza
                        </button>
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panou clienti per contabil */}
      {contabilSelectat && (
        <PanouClientiContabil
          contabil={contabilSelectat}
          clientiAsignati={clientiAsignati}
          totiClienti={users.filter((u) => (u.role || '').toLowerCase() === 'client')}
          loading={loadingClienti}
          onInchide={() => setContabilSelectat(null)}
          onAsigneaza={asigneaza}
          onDezasigneaza={dezasigneaza}
        />
      )}

      {/* Dialog creare contabil */}
      {dialogDeschis && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4" onClick={() => setDialogDeschis(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-neutral-900 mb-1">Creeaza contabil nou</h2>
            <p className="text-sm text-neutral-600 mb-5">Noul cont va primi rolul CONTABIL direct — fara inregistrare ca client.</p>

            <form onSubmit={salveazaContabil} className="space-y-3">
              <Camp label="Username *" value={formUsername} onChange={setFormUsername} placeholder="ex: popescu_ion" required />
              <Camp label="Email *" value={formEmail} onChange={setFormEmail} placeholder="contabil@firma.md" type="email" required />
              <Camp label="Nume complet" value={formNume} onChange={setFormNume} placeholder="Ion Popescu" />
              <Camp label="Parola *" value={formParola} onChange={setFormParola} placeholder="min 8 caractere" type="password" required />

              {formEroare && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{formEroare}</div>
              )}

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setDialogDeschis(false)} className="px-4 py-2 rounded-lg text-neutral-700 hover:bg-neutral-100 font-semibold">
                  Anuleaza
                </button>
                <button type="submit" disabled={formSeTrimite} className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-60">
                  {formSeTrimite ? 'Se creeaza...' : 'Creeaza contabil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function rolBadge(rol: string): string {
  const r = (rol || '').toLowerCase();
  if (r === 'admin' || r === 'super_admin') return 'bg-purple-100 text-purple-800';
  if (r === 'contabil') return 'bg-sky-100 text-sky-800';
  return 'bg-neutral-100 text-neutral-700';
}

function PanouClientiContabil({
  contabil,
  clientiAsignati,
  totiClienti,
  loading,
  onInchide,
  onAsigneaza,
  onDezasigneaza,
}: {
  contabil: UserData;
  clientiAsignati: UserData[];
  totiClienti: UserData[];
  loading: boolean;
  onInchide: () => void;
  onAsigneaza: (clientId: string) => void;
  onDezasigneaza: (clientId: string) => void;
}) {
  const idsAsignati = new Set(clientiAsignati.map((c) => c.id));
  const clientiNeasignati = totiClienti.filter((c) => !idsAsignati.has(c.id));

  return (
    <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4" onClick={onInchide}>
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Clientii contabilului</h2>
            <p className="text-sm text-neutral-600 mt-0.5">
              {contabil.full_name || contabil.username} · <span className="text-neutral-400">{contabil.email}</span>
            </p>
          </div>
          <button onClick={onInchide} className="text-neutral-500 hover:text-neutral-900 text-2xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Asignati */}
          <section>
            <h3 className="text-sm font-bold text-neutral-700 mb-3 uppercase tracking-wide">
              Asignati ({clientiAsignati.length})
            </h3>
            {loading ? (
              <p className="text-sm text-neutral-500 py-4">Se incarca...</p>
            ) : clientiAsignati.length === 0 ? (
              <div className="text-sm text-neutral-500 bg-neutral-50 rounded-lg p-4 border border-dashed border-neutral-300">
                Niciun client asignat. Foloseste lista din dreapta pentru a aloca.
              </div>
            ) : (
              <ul className="space-y-2">
                {clientiAsignati.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center">
                      {(c.full_name || c.username || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-neutral-900 truncate">{c.full_name || c.username}</div>
                      <div className="text-xs text-neutral-500 truncate">{c.email}</div>
                    </div>
                    <button
                      onClick={() => onDezasigneaza(c.id)}
                      className="text-xs font-semibold px-3 py-1 rounded-md bg-white text-red-600 hover:bg-red-50 border border-red-200"
                      title="Scoate asignarea"
                    >
                      Scoate
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Disponibili */}
          <section>
            <h3 className="text-sm font-bold text-neutral-700 mb-3 uppercase tracking-wide">
              Clienti neasignati acestui contabil ({clientiNeasignati.length})
            </h3>
            {clientiNeasignati.length === 0 ? (
              <div className="text-sm text-neutral-500 bg-neutral-50 rounded-lg p-4 border border-dashed border-neutral-300">
                Toti clientii din sistem sunt asignati acestui contabil.
              </div>
            ) : (
              <ul className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {clientiNeasignati.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 bg-white border border-neutral-200 rounded-lg px-3 py-2 hover:border-indigo-400">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
                      {(c.full_name || c.username || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-neutral-900 truncate">{c.full_name || c.username}</div>
                      <div className="text-xs text-neutral-500 truncate">{c.email}</div>
                    </div>
                    <button
                      onClick={() => onAsigneaza(c.id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      Asigneaza
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50 flex justify-end">
          <button onClick={onInchide} className="px-5 py-2 rounded-lg text-neutral-700 hover:bg-neutral-200 font-semibold">
            Inchide
          </button>
        </div>
      </div>
    </div>
  );
}

function Camp({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-neutral-700 mb-1 block">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
      />
    </label>
  );
}

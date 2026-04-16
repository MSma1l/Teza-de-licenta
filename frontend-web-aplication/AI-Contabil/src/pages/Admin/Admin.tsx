/* ============================================
   PAGINA ADMIN

   Panou de control pentru administratori. Permite:
   - Vizualizarea tuturor utilizatorilor (filtru pe rol)
   - Crearea directa a unui cont CONTABIL
   - Schimbarea rolului unui utilizator existent (promovare -> contabil, etc.)

   Acces: doar utilizatorii cu role === 'admin' (protejat si in App.tsx).
   ============================================ */
import { useEffect, useState, useCallback } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import {
  listUsers,
  createContabil,
  changeUserRole,
  type UserListResponse,
} from '../../api/usersApi';
import type { UserData } from '../../api/authApi';

type Filter = '' | 'admin' | 'contabil' | 'client';

const Admin = () => {
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
    if (formParola.length < 8) {
      setFormEroare('Parola trebuie sa aiba minim 8 caractere.');
      return;
    }
    setFormSeTrimite(true);
    try {
      await createContabil({
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
      await incarcaLista();
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
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Navbar isLoggedIn={true} showNavLinks={false} />

      <div className="flex-1 max-w-[1200px] mx-auto w-full px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-neutral-900">Panou Admin</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Administreaza utilizatorii platformei. Creeaza contabili si gestioneaza rolurile.
            </p>
          </div>
          <button
            onClick={() => setDialogDeschis(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full shadow-md transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            Creeaza contabil nou
          </button>
        </div>

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

        {/* Tabela utilizatori */}
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-neutral-700">Nume / Username</th>
                  <th className="text-left px-4 py-3 font-semibold text-neutral-700">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-neutral-700">Rol</th>
                  <th className="text-left px-4 py-3 font-semibold text-neutral-700">Actiuni</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-neutral-500">
                      Se incarca...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-neutral-500">
                      Niciun utilizator gasit cu filtrul curent.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-neutral-900">{u.full_name || u.username}</span>
                          <span className="text-xs text-neutral-500">@{u.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${rolBadge(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <SchimbaRolDropdown currentRole={u.role} onChange={(r) => schimbaRol(u.id, r)} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dialog creare contabil */}
      {dialogDeschis && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4" onClick={() => setDialogDeschis(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-neutral-900 mb-1">Creeaza contabil nou</h2>
            <p className="text-sm text-neutral-600 mb-5">Noul cont va primi rolul CONTABIL direct.</p>

            <form onSubmit={salveazaContabil} className="space-y-3">
              <Camp label="Username *" value={formUsername} onChange={setFormUsername} placeholder="ex: popescu_ion" required />
              <Camp label="Email *" value={formEmail} onChange={setFormEmail} placeholder="contabil@firma.md" type="email" required />
              <Camp label="Nume complet" value={formNume} onChange={setFormNume} placeholder="Ion Popescu" />
              <Camp label="Parola *" value={formParola} onChange={setFormParola} placeholder="min 8 caractere" type="password" required />

              {formEroare && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{formEroare}</div>}

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
};

function rolBadge(rol: string): string {
  const r = rol.toLowerCase();
  if (r === 'admin' || r === 'super_admin') return 'bg-purple-100 text-purple-800';
  if (r === 'contabil') return 'bg-sky-100 text-sky-800';
  return 'bg-neutral-100 text-neutral-700';
}

function SchimbaRolDropdown({
  currentRole,
  onChange,
}: {
  currentRole: string;
  onChange: (role: 'admin' | 'contabil' | 'client') => void;
}) {
  return (
    <select
      value={currentRole.toLowerCase()}
      onChange={(e) => onChange(e.target.value as 'admin' | 'contabil' | 'client')}
      className="text-sm border border-neutral-300 rounded-md px-2 py-1 bg-white hover:border-indigo-400"
    >
      <option value="client">client</option>
      <option value="contabil">contabil</option>
      <option value="admin">admin</option>
    </select>
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

export default Admin;

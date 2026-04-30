/* ============================================
   UserPicker — selector de utilizatori pentru rolul admin

   Folosit pe paginile Documents/Reports pentru ca admin sa aleaga
   utilizatorul ale carui date le vede. Buton "Toti utilizatorii" deselecteaza.
   ============================================ */
import { useEffect, useState } from 'react';
import { listUsers } from '../../api/usersApi';
import type { UserData } from '../../api/authApi';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

interface UserPickerProps {
  selectedUserId: string | null;
  /** Returneaza si rolul user-ului selectat ca parintele sa decida ce filtru API sa foloseasca. */
  onChange: (userId: string | null, userRole?: string) => void;
  /** Filtreaza dupa rol. 'non_admin' = client + contabil (fara admin/super_admin). */
  roleFilter?: 'client' | 'contabil' | 'admin' | 'non_admin' | 'all';
  label?: string;
}

const UserPicker = ({
  selectedUserId,
  onChange,
  roleFilter = 'client',
  label = 'Selecteaza utilizator',
}: UserPickerProps) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    if (roleFilter === 'non_admin') {
      // Aducem clientii si contabilii in paralel; ascundem admin/super_admin.
      Promise.all([listUsers('client', 0, 200), listUsers('contabil', 0, 200)])
        .then(([clienti, contabili]) => setUsers([...contabili.users, ...clienti.users]))
        .catch(() => setUsers([]))
        .finally(() => setLoading(false));
    } else {
      const role = roleFilter === 'all' ? undefined : roleFilter;
      listUsers(role, 0, 200)
        .then((r) => setUsers(r.users))
        .catch(() => setUsers([]))
        .finally(() => setLoading(false));
    }
  }, [roleFilter]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      !q ||
      u.username.toLowerCase().includes(q) ||
      (u.full_name || '').toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const selected = users.find((u) => u.id === selectedUserId);

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <PersonOutlineIcon className="text-indigo-600" />
        <h3 className="font-semibold text-neutral-900">{label}</h3>
        {selected && (
          <span className="ml-auto inline-flex items-center gap-2 text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
            <strong>{selected.full_name || selected.username}</strong>
            <button
              onClick={() => onChange(null)}
              className="text-indigo-500 hover:text-indigo-800 font-bold"
              title="Deselecteaza"
            >
              ×
            </button>
          </span>
        )}
      </div>

      {!selected && (
        <>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Caută după nume, username sau email..."
            className="w-full mb-3 border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
          />

          {loading ? (
            <div className="text-sm text-neutral-500">Se încarcă utilizatorii…</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-neutral-500 italic">
              {search ? 'Niciun utilizator găsit pentru această căutare.' : 'Nu există utilizatori.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto">
              {filtered.map((u) => (
                <button
                  key={u.id}
                  onClick={() => onChange(u.id, u.role)}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-neutral-50 hover:bg-indigo-50 hover:border-indigo-200 border border-transparent transition text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0">
                    {(u.full_name || u.username).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-neutral-900 truncate">
                      {u.full_name || u.username}
                    </div>
                    <div className="text-xs text-neutral-500 truncate">{u.email}</div>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      u.role === 'admin' || u.role === 'super_admin'
                        ? 'bg-purple-100 text-purple-700'
                        : u.role === 'contabil'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {u.role}
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserPicker;

/* ============================================
   PAGINA ADMIN — Panou pe tab-uri

   Acces: doar utilizatorii cu rol ADMIN (protejat in App.tsx).

   Tab-uri:
   - „Utilizatori"   — listare, filtru pe rol, creare contabil, schimbare rol (logica existenta)
   - „Antrenare AI"  — versiunile modelelor + buton lansare antrenare noua + metrici
   - „Adauga lege"   — formular care extinde corpusul RAG al lui Djarvis cu un articol nou
   - „Audit log"     — vizualizare jurnal de actiuni (cu hash-uri de integritate)
   ============================================ */
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import {
  listUsers,
  createContabil,
  createReceptionist,
  changeUserRole,
  type UserListResponse,
} from '../../api/usersApi';
import type { UserData } from '../../api/authApi';
import { fetchTrainingStats, fetchModels, type TrainingStats } from '../../api/trainingApi';
import {
  fetchPublicContent,
  createPublicContent,
  deletePublicContent,
  type PublicContent,
  type PublicContentType,
} from '../../api/publicContentApi';
import { triggerTraining, verifyAuditChain, fetchAuditLog, fetchStaffActivity, type StaffActivityResponse } from '../../api/adminDashboardApi';
import UserDetailModal from '../../components/UserDetailModal/UserDetailModal';

type AdminTab = 'utilizatori' | 'echipa' | 'antrenare' | 'lege' | 'public' | 'audit';

const Admin = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as AdminTab) || 'utilizatori';
  const [tab, setTab] = useState<AdminTab>(initialTab);

  const schimbaTab = (t: AdminTab) => {
    setTab(t);
    setSearchParams({ tab: t });
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Navbar isLoggedIn={true} showNavLinks={false} />

      <div className="flex-1 max-w-[1280px] mx-auto w-full px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-neutral-900">Panou Administrator</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Administrare completa: utilizatori, antrenare AI, extindere corpus legislatie si audit.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-neutral-200 mb-6 overflow-x-auto">
          {([
            { id: 'utilizatori', label: 'Utilizatori', icon: '👥' },
            { id: 'echipa', label: 'Echipa', icon: '📊' },
            { id: 'antrenare', label: 'Antrenare AI', icon: '🧠' },
            { id: 'lege', label: 'Adauga lege (RAG)', icon: '📜' },
            { id: 'public', label: 'Continut public', icon: '🌐' },
            { id: 'audit', label: 'Audit log', icon: '🔒' },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => schimbaTab(t.id)}
              className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition ${
                tab === t.id
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <span className="mr-1.5">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'utilizatori' && <TabUtilizatori />}
        {tab === 'echipa' && <TabEchipa />}
        {tab === 'antrenare' && <TabAntrenare />}
        {tab === 'lege' && <TabLege />}
        {tab === 'public' && <TabContinutPublic />}
        {tab === 'audit' && <TabAudit />}
      </div>
    </div>
  );
};

/* ============================================
   TAB 1 — Utilizatori (logica existenta)
   ============================================ */
type Filter = '' | 'admin' | 'contabil' | 'receptionist' | 'client';

function TabUtilizatori() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [total, setTotal] = useState(0);
  const [filtru, setFiltru] = useState<Filter>('');
  const [loading, setLoading] = useState(true);
  const [eroare, setEroare] = useState<string | null>(null);

  // User selectat pentru modal cu detalii (reset pwd + activity)
  const [userDetaliu, setUserDetaliu] = useState<UserData | null>(null);

  const [dialogDeschis, setDialogDeschis] = useState(false);
  const [formRol, setFormRol] = useState<'contabil' | 'receptionist'>('contabil');
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
      const payload = {
        username: formUsername.trim(),
        email: formEmail.trim(),
        password: formParola,
        full_name: formNume.trim() || undefined,
      };
      const newUser = formRol === 'receptionist'
        ? await createReceptionist(payload)
        : await createContabil(payload);
      setDialogDeschis(false);
      setFormUsername('');
      setFormEmail('');
      setFormParola('');
      setFormNume('');

      // Optimistic update — afisam imediat noul contabil in lista,
      // ca admin-ul sa nu vada o lista "neschimbata" cat asteapta refetch.
      setUsers((prev) => [newUser, ...prev]);
      setTotal((prev) => prev + 1);

      // Daca filtrul curent ar ascunde noul contabil (ex: 'admin' / 'client'),
      // resetam la "Toti" — useEffect va re-fetch automat cu filtru gol.
      // Altfel sincronizam manual cu serverul.
      if (filtru !== '' && filtru !== 'contabil') {
        setFiltru('');
      } else {
        await incarcaLista();
      }
    } catch (e) {
      setFormEroare(e instanceof Error ? e.message : 'Eroare la creare');
    } finally {
      setFormSeTrimite(false);
    }
  }

  async function schimbaRol(userId: string, rolNou: 'admin' | 'contabil' | 'receptionist' | 'client') {
    try {
      await changeUserRole(userId, rolNou);
      await incarcaLista();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Eroare la schimbarea rolului');
    }
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Toti utilizatorii</h2>
          <p className="text-sm text-neutral-600">Total: {total}</p>
        </div>
        <button
          onClick={() => setDialogDeschis(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full shadow-md transition"
        >
          + Creeaza membru nou (contabil / receptionist)
        </button>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {(['', 'admin', 'contabil', 'receptionist', 'client'] as Filter[]).map((f) => (
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
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4">{eroare}</div>
      )}

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
                <tr><td colSpan={4} className="px-4 py-10 text-center text-neutral-500">Se incarca...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-neutral-500">Niciun utilizator gasit cu filtrul curent.</td></tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-neutral-100 hover:bg-indigo-50/50 cursor-pointer transition"
                    onClick={() => setUserDetaliu(u)}
                  >
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
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <SchimbaRolDropdown currentRole={u.role} onChange={(r) => schimbaRol(u.id, r)} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {dialogDeschis && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4" onClick={() => setDialogDeschis(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-neutral-900 mb-1">Creeaza membru nou</h2>
            <p className="text-sm text-neutral-600 mb-5">Alege rolul si completeaza datele.</p>

            <form onSubmit={salveazaContabil} className="space-y-3">
              {/* Selector rol */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Rol *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['contabil', 'receptionist'] as const).map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setFormRol(r)}
                      className={`px-3 py-2 rounded-md text-sm font-semibold transition ${
                        formRol === r
                          ? r === 'contabil'
                            ? 'bg-sky-600 text-white'
                            : 'bg-violet-600 text-white'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {r === 'contabil' ? '💼 Contabil' : '📞 Receptionist'}
                    </button>
                  ))}
                </div>
              </div>

              <Camp label="Username *" value={formUsername} onChange={setFormUsername} placeholder={formRol === 'contabil' ? 'ex: popescu_ion' : 'ex: receptionist_ana'} required />
              <Camp label="Email *" value={formEmail} onChange={setFormEmail} placeholder={`${formRol}@firma.md`} type="email" required />
              <Camp label="Nume complet" value={formNume} onChange={setFormNume} placeholder="Ion Popescu" />
              <Camp label="Parola *" value={formParola} onChange={setFormParola} placeholder="min 8 caractere" type="password" required />

              {formEroare && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{formEroare}</div>}

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setDialogDeschis(false)} className="px-4 py-2 rounded-lg text-neutral-700 hover:bg-neutral-100 font-semibold">
                  Anuleaza
                </button>
                <button type="submit" disabled={formSeTrimite} className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-60">
                  {formSeTrimite ? 'Se creeaza...' : `Creeaza ${formRol}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {userDetaliu && (
        <UserDetailModal user={userDetaliu} onClose={() => setUserDetaliu(null)} />
      )}
    </>
  );
}

/* ============================================
   TAB 2 — Antrenare modele AI
   ============================================ */
function TabAntrenare() {
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [models, setModels] = useState<Awaited<ReturnType<typeof fetchModels>>>([]);
  const [loading, setLoading] = useState(true);
  const [eroare, setEroare] = useState<string | null>(null);
  const [trainingStarted, setTrainingStarted] = useState<{ kind: 'classifier' | 'ner'; msg: string } | null>(null);
  const [trainingBusy, setTrainingBusy] = useState<'classifier' | 'ner' | null>(null);

  useEffect(() => {
    Promise.all([fetchTrainingStats(), fetchModels()])
      .then(([s, m]) => {
        setStats(s);
        setModels(m);
      })
      .catch((e) => setEroare(e instanceof Error ? e.message : 'Eroare incarcare antrenare'))
      .finally(() => setLoading(false));
  }, []);

  async function lanseazaAntrenare(kind: 'classifier' | 'ner') {
    if (!confirm(`Lansez antrenarea modelului "${kind}"? Procesul ruleaza in fundal pe Celery.`)) return;
    setTrainingBusy(kind);
    setTrainingStarted(null);
    try {
      const r = await triggerTraining(kind);
      setTrainingStarted({ kind, msg: `${r.message} Verifica progresul in audit log sau in tabelul versiunilor.` });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Eroare la lansare antrenare');
    } finally {
      setTrainingBusy(null);
    }
  }

  if (loading) return <p className="text-sm text-neutral-500">Se incarca metricile...</p>;
  if (eroare) return <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3">{eroare}</div>;

  return (
    <div>
      <h2 className="text-xl font-bold text-neutral-900 mb-1">Antrenarea modelelor AI</h2>
      <p className="text-sm text-neutral-600 mb-6">
        Reantreneaza clasificatorul de documente si modelul NER pe baza corectiilor acumulate de
        contabili. Versiunea activa poate fi inlocuita cu una noua sau revenita prin rollback.
      </p>

      {/* Statistici */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <CardStat label="Exemple de antrenare" value={stats.total_examples} />
          <CardStat label="Exemple noi" value={stats.unused_examples} />
          <CardStat label="Documente procesate" value={stats.processed_documents} />
          <CardStat
            label="Confidence mediu"
            value={`${Math.round((stats.avg_ocr_confidence || 0) * 100)}%`}
          />
        </div>
      )}

      {/* Buton antrenare noua */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="font-bold text-neutral-900">Antreneaza un model nou</div>
            <p className="text-sm text-neutral-700 mt-1">
              Lanseaza un ciclu de antrenare cu toate exemplele acumulate. Procesul ruleaza in fundal.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => lanseazaAntrenare('classifier')}
              disabled={!stats?.can_retrain_classifier || trainingBusy !== null}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md disabled:opacity-50"
              title={
                stats?.can_retrain_classifier
                  ? 'Lanseaza task Celery pentru reantrenarea clasificatorului BERT'
                  : `Necesar ${stats?.min_required_for_training} corectii de tip — actual: ${stats?.type_corrections ?? 0}`
              }
            >
              {trainingBusy === 'classifier' ? '⏳ Lansez...' : 'Reantreneaza clasificator'}
            </button>
            <button
              onClick={() => lanseazaAntrenare('ner')}
              disabled={!stats?.can_retrain_ner || trainingBusy !== null}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md disabled:opacity-50"
              title={
                stats?.can_retrain_ner
                  ? 'Lanseaza task Celery pentru reantrenarea modelului NER'
                  : `Necesar ${stats?.min_required_for_training} corectii de entitati — actual: ${stats?.entity_corrections ?? 0}`
              }
            >
              {trainingBusy === 'ner' ? '⏳ Lansez...' : 'Reantreneaza NER'}
            </button>
          </div>
        </div>
        {stats && stats.unused_examples < stats.min_required_for_training && (
          <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
            Necesar minim: {stats.min_required_for_training} exemple noi. Actual: {stats.unused_examples}.
          </div>
        )}
        {trainingStarted && (
          <div className="mt-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-2">
            ✓ {trainingStarted.msg}
          </div>
        )}
      </div>

      {/* Versiuni modele */}
      <h3 className="text-lg font-bold text-neutral-900 mb-3">Versiunile modelelor</h3>
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-neutral-700">Model</th>
              <th className="text-left px-4 py-3 font-semibold text-neutral-700">Versiune</th>
              <th className="text-left px-4 py-3 font-semibold text-neutral-700">Data</th>
              <th className="text-left px-4 py-3 font-semibold text-neutral-700">Exemple</th>
              <th className="text-left px-4 py-3 font-semibold text-neutral-700">Acuratete</th>
              <th className="text-left px-4 py-3 font-semibold text-neutral-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {models.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-neutral-500">Nicio versiune inregistrata.</td></tr>
            ) : (
              models.map((m) => (
                <tr key={m.id} className="border-b border-neutral-100">
                  <td className="px-4 py-3 font-semibold text-neutral-900">{m.model_name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{m.version}</td>
                  <td className="px-4 py-3 text-neutral-600 text-xs">{new Date(m.training_date).toLocaleString('ro-RO')}</td>
                  <td className="px-4 py-3">{m.dataset_size}</td>
                  <td className="px-4 py-3">
                    {m.accuracy_metrics
                      ? Object.entries(m.accuracy_metrics).map(([k, v]) => (
                          <span key={k} className="inline-block mr-2 text-xs">
                            <span className="text-neutral-500">{k}:</span> <span className="font-mono font-semibold">{(v * 100).toFixed(1)}%</span>
                          </span>
                        ))
                      : <span className="text-neutral-400 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {m.is_active ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">ACTIV</span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600">inactiv</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================
   TAB 3 — Adauga articol de lege in corpusul RAG
   ============================================ */
function TabLege() {
  const [titlu, setTitlu] = useState('');
  const [sursa, setSursa] = useState('');
  const [continut, setContinut] = useState('');
  const [categorie, setCategorie] = useState('cod_fiscal');
  const [salveaza, setSalveaza] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function adauga() {
    if (!titlu.trim() || !continut.trim()) {
      setFeedback('Titlul si continutul sunt obligatorii.');
      return;
    }
    setSalveaza(true);
    setFeedback(null);
    try {
      // Endpoint pe AI service (port 3778). Persistat in user_added.jsonl;
      // FAISS se reconstruieste manual cu scripts/build_legislation_index.py.
      const aiBase = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:3778/api/v1';
      const res = await fetch(`${aiBase}/agent/legislatie/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ titlu, sursa, continut, categorie }),
      });
      if (res.ok) {
        const data = await res.json();
        setFeedback(data.message || 'Articol adaugat in corpusul Djarvis.');
        setTitlu('');
        setSursa('');
        setContinut('');
      } else {
        const err = await res.json().catch(() => ({}));
        setFeedback(`Eroare: ${err.detail || res.statusText}`);
      }
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Eroare salvare');
    } finally {
      setSalveaza(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-bold text-neutral-900 mb-1">Adauga articol in corpusul Djarvis</h2>
      <p className="text-sm text-neutral-600 mb-6">
        Extinde baza de cunostinte a agentului conversational Djarvis cu un articol nou de
        legislatie. Dupa salvare, indexul vectorial FAISS este reconstruit automat si articolul
        devine disponibil ca sursa pentru raspunsurile catre utilizatori.
      </p>

      <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Titlu articol *</label>
          <input
            type="text"
            value={titlu}
            onChange={(e) => setTitlu(e.target.value)}
            placeholder="Ex: Codul Fiscal RM, art. 187 — Declaratia TVA (D300)"
            className="w-full border border-neutral-200 rounded-md px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Categorie</label>
            <select
              value={categorie}
              onChange={(e) => setCategorie(e.target.value)}
              className="w-full border border-neutral-200 rounded-md px-3 py-2 bg-white"
            >
              <option value="cod_fiscal">Cod fiscal</option>
              <option value="hg">Hotararea Guvernului</option>
              <option value="ordin_sfs">Ordin SFS</option>
              <option value="ghid">Ghid contabil</option>
              <option value="scenariu">Scenariu practic</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Sursa (URL / referinta)</label>
            <input
              type="text"
              value={sursa}
              onChange={(e) => setSursa(e.target.value)}
              placeholder="ex: sfs.md / Monitorul Oficial nr. ..."
              className="w-full border border-neutral-200 rounded-md px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Continut articol *</label>
          <textarea
            value={continut}
            onChange={(e) => setContinut(e.target.value)}
            rows={10}
            placeholder="Textul integral al articolului. Va fi impartit automat in chunks si indexat in FAISS pentru cautare semantica..."
            className="w-full border border-neutral-200 rounded-md px-3 py-2 font-mono text-sm"
          />
        </div>

        {feedback && (
          <div className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-3">
            {feedback}
          </div>
        )}

        <button
          onClick={adauga}
          disabled={salveaza}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-md disabled:opacity-50"
        >
          {salveaza ? 'Se adauga in corpus...' : 'Adauga articol si reconstruieste indexul'}
        </button>
      </div>

      <div className="mt-6 text-xs text-neutral-500 bg-neutral-100 rounded-md p-3">
        <strong>Nota tehnica:</strong> Corpusul actual al lui Djarvis este in directorul{' '}
        <code className="font-mono">backend-project/training-data/legislatie/</code>. Cand un
        articol nou este adaugat aici, scriptul{' '}
        <code className="font-mono">scripts/build_legislation_index.py</code> recalculeaza
        embedding-urile prin <code className="font-mono">paraphrase-multilingual-MiniLM-L12-v2</code>{' '}
        si reconstruieste indexul FAISS.
      </div>
    </div>
  );
}

/* ============================================
   TAB 4 — Audit log
   ============================================ */
function TabAudit() {
  const [intrari, setIntrari] = useState<Awaited<ReturnType<typeof fetchAuditLog>>>([]);
  const [loading, setLoading] = useState(true);
  const [eroare, setEroare] = useState<string | null>(null);

  const [verificare, setVerificare] = useState<{ valid: boolean; message: string } | null>(null);
  const [verifica, setVerifica] = useState(false);

  const reincarca = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAuditLog(50);
      setIntrari(data);
    } catch (e) {
      setEroare(e instanceof Error ? e.message : 'Eroare incarcare audit');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reincarca();
  }, [reincarca]);

  async function verificaIntegritate() {
    setVerifica(true);
    setVerificare(null);
    try {
      const r = await verifyAuditChain();
      setVerificare({
        valid: r.valid,
        message: r.valid
          ? `✓ Lant intact. ${r.total} intrari verificate.`
          : `⚠ Lant rupt la pozitia ${r.broken_at}. ${r.message || ''}`,
      });
    } catch (e) {
      setVerificare({ valid: false, message: e instanceof Error ? e.message : 'Eroare verificare' });
    } finally {
      setVerifica(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-neutral-900 mb-1">Jurnal de audit</h2>
      <p className="text-sm text-neutral-600 mb-6">
        Toate actiunile sensibile asupra documentelor financiare sunt inregistrate cu hash de
        integritate (lant SHA-256). Orice modificare ulterioara invalideaza toate hash-urile
        subsecvente, devenind imediat detectabila.
      </p>

      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <h3 className="font-bold text-neutral-900">Ultimele 50 actiuni inregistrate</h3>
          <div className="flex gap-2">
            <button
              onClick={reincarca}
              disabled={loading}
              className="text-xs px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-md font-semibold text-neutral-700 disabled:opacity-50"
            >
              {loading ? 'Se incarca...' : '🔄 Refresh'}
            </button>
            <button
              onClick={verificaIntegritate}
              disabled={verifica}
              className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md disabled:opacity-50"
            >
              {verifica ? 'Verific...' : '🔒 Verifica integritate'}
            </button>
          </div>
        </div>

        {verificare && (
          <div
            className={`text-sm border rounded-md p-3 mb-3 ${
              verificare.valid
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {verificare.message}
          </div>
        )}

        {eroare && (
          <div className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-md p-3 mb-3">
            {eroare}
          </div>
        )}

        {intrari.length === 0 ? (
          <p className="text-sm text-neutral-500 italic py-6 text-center">
            Niciuna actiune inregistrata in jurnal inca.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Timestamp</th>
                  <th className="text-left px-3 py-2 font-semibold">Actiune</th>
                  <th className="text-left px-3 py-2 font-semibold">User</th>
                  <th className="text-left px-3 py-2 font-semibold">Document</th>
                  <th className="text-left px-3 py-2 font-semibold">IP</th>
                  <th className="text-left px-3 py-2 font-semibold">Hash</th>
                </tr>
              </thead>
              <tbody>
                {intrari.map((e) => (
                  <tr key={e.id} className="border-b border-neutral-100">
                    <td className="px-3 py-2 text-neutral-500 whitespace-nowrap">
                      {e.timestamp ? new Date(e.timestamp).toLocaleString('ro') : '—'}
                    </td>
                    <td className="px-3 py-2 font-bold text-indigo-700">{e.action_type}</td>
                    <td className="px-3 py-2 text-neutral-700">{e.user_id?.slice(0, 8) || '—'}</td>
                    <td className="px-3 py-2 text-neutral-500">{e.document_id?.slice(0, 8) || '—'}</td>
                    <td className="px-3 py-2 text-neutral-500">{e.ip_address || '—'}</td>
                    <td className="px-3 py-2 text-neutral-400">{e.entry_hash.slice(0, 12)}…</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================
   COMPONENTE COMUNE
   ============================================ */

function rolBadge(rol: string): string {
  const r = rol.toLowerCase();
  if (r === 'admin' || r === 'super_admin') return 'bg-purple-100 text-purple-800';
  if (r === 'contabil') return 'bg-sky-100 text-sky-800';
  if (r === 'receptionist') return 'bg-violet-100 text-violet-800';
  return 'bg-neutral-100 text-neutral-700';
}

function SchimbaRolDropdown({
  currentRole,
  onChange,
}: {
  currentRole: string;
  onChange: (role: 'admin' | 'contabil' | 'receptionist' | 'client') => void;
}) {
  return (
    <select
      value={currentRole.toLowerCase()}
      onChange={(e) => onChange(e.target.value as 'admin' | 'contabil' | 'receptionist' | 'client')}
      className="text-sm border border-neutral-300 rounded-md px-2 py-1 bg-white hover:border-indigo-400"
    >
      <option value="client">client</option>
      <option value="contabil">contabil</option>
      <option value="receptionist">receptionist</option>
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

function CardStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className="text-xs uppercase font-semibold text-neutral-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-neutral-900">{value}</div>
    </div>
  );
}

/* ============================================
   TAB — Echipa (monitorizare contabili + receptionisti)
   ============================================ */
function TabEchipa() {
  const [data, setData] = useState<StaffActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [eroare, setEroare] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    fetchStaffActivity()
      .then(setData)
      .catch((e) => setEroare(e instanceof Error ? e.message : 'Eroare incarcare'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  if (loading) return <p className="text-sm text-neutral-500">Se incarca activitatea echipei...</p>;
  if (eroare) return <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3">{eroare}</div>;
  if (!data) return null;

  const consultatiiNoi = data.consultatii.by_status?.['noua'] || 0;
  const consultatiiInchise = (data.consultatii.by_status?.['inchis_ok'] || 0) + (data.consultatii.by_status?.['inchis_respins'] || 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-baseline gap-2">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 mb-1">Activitate echipa</h2>
          <p className="text-sm text-neutral-600">
            Monitorizare in timp real a productivitatii contabililor si receptionistilor.
          </p>
        </div>
        <button
          onClick={reload}
          className="text-xs px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-md font-semibold text-neutral-700"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Sumar consultatii */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <CardStat label="Consultatii total" value={data.consultatii.total} />
        <CardStat label="Cereri noi" value={consultatiiNoi} />
        <CardStat label="Cereri inchise" value={consultatiiInchise} />
        <CardStat label="Echipa activa" value={data.contabili.length + data.receptionisti.length} />
      </div>

      {/* Tabel contabili */}
      <section className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <header className="px-5 py-3 border-b border-neutral-200 bg-neutral-50">
          <h3 className="font-bold text-neutral-900">Contabili ({data.contabili.length})</h3>
          <p className="text-xs text-neutral-500">Activitate pe documente, rapoarte si chat</p>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="text-left px-4 py-2 font-semibold text-neutral-700">Contabil</th>
                <th className="text-right px-3 py-2 font-semibold text-neutral-700">Clienti</th>
                <th className="text-right px-3 py-2 font-semibold text-neutral-700">Doc aprobate</th>
                <th className="text-right px-3 py-2 font-semibold text-neutral-700">Doc in lucru</th>
                <th className="text-right px-3 py-2 font-semibold text-neutral-700">Rapoarte</th>
                <th className="text-right px-3 py-2 font-semibold text-neutral-700">Chat</th>
                <th className="text-left px-3 py-2 font-semibold text-neutral-700">Ultim login</th>
              </tr>
            </thead>
            <tbody>
              {data.contabili.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-neutral-500">Niciun contabil inregistrat.</td></tr>
              ) : data.contabili.map((c) => (
                <tr key={c.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2">
                    <div className="font-semibold text-neutral-900">{c.full_name || c.username}</div>
                    <div className="text-xs text-neutral-500">@{c.username}</div>
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-neutral-900">{c.clienti_asignati}</td>
                  <td className="px-3 py-2 text-right text-emerald-700 font-bold">{c.documente_aprobate}</td>
                  <td className="px-3 py-2 text-right text-amber-700 font-bold">{c.documente_in_lucru}</td>
                  <td className="px-3 py-2 text-right text-neutral-700">{c.rapoarte_create}</td>
                  <td className="px-3 py-2 text-right text-neutral-700">{c.chat_raspunse}</td>
                  <td className="px-3 py-2 text-xs text-neutral-500">
                    {c.last_login ? new Date(c.last_login).toLocaleString('ro') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tabel receptionisti */}
      <section className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <header className="px-5 py-3 border-b border-neutral-200 bg-neutral-50">
          <h3 className="font-bold text-neutral-900">Receptionisti ({data.receptionisti.length})</h3>
          <p className="text-xs text-neutral-500">Activitate pe consultatii + chat escaladat</p>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="text-left px-4 py-2 font-semibold text-neutral-700">Receptionist</th>
                <th className="text-right px-3 py-2 font-semibold text-neutral-700">Cereri preluate</th>
                <th className="text-right px-3 py-2 font-semibold text-neutral-700">Cereri inchise</th>
                <th className="text-right px-3 py-2 font-semibold text-neutral-700">Chat raspunse</th>
                <th className="text-left px-3 py-2 font-semibold text-neutral-700">Ultim login</th>
              </tr>
            </thead>
            <tbody>
              {data.receptionisti.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-neutral-500">Niciun receptionist inregistrat.</td></tr>
              ) : data.receptionisti.map((r) => (
                <tr key={r.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2">
                    <div className="font-semibold text-neutral-900">{r.full_name || r.username}</div>
                    <div className="text-xs text-neutral-500">@{r.username}</div>
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-neutral-900">{r.cereri_preluate}</td>
                  <td className="px-3 py-2 text-right text-emerald-700 font-bold">{r.cereri_inchise}</td>
                  <td className="px-3 py-2 text-right text-neutral-700">{r.chat_raspunse}</td>
                  <td className="px-3 py-2 text-xs text-neutral-500">
                    {r.last_login ? new Date(r.last_login).toLocaleString('ro') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ============================================
   TAB — Continut public (legi + stiri afisate pe landing)
   ============================================ */
function TabContinutPublic() {
  const [tip, setTip] = useState<PublicContentType>('lege');
  const [titlu, setTitlu] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [tag, setTag] = useState('');
  const [color, setColor] = useState('#4f46e5');
  const [salveaza, setSalveaza] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  const [items, setItems] = useState<PublicContent[]>([]);
  const [loading, setLoading] = useState(false);

  const reincarca = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPublicContent(undefined, 100);
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reincarca();
  }, [reincarca]);

  async function adauga() {
    if (!titlu.trim() || !body.trim()) {
      setFeedback({ kind: 'err', msg: 'Titlul si textul sunt obligatorii.' });
      return;
    }
    setSalveaza(true);
    setFeedback(null);
    try {
      const newItem = await createPublicContent({
        type: tip,
        title: titlu.trim(),
        body: body.trim(),
        url: tip === 'lege' ? url.trim() || undefined : undefined,
        tag: tag.trim() || undefined,
        color: tip === 'stire' ? color : undefined,
      });
      setItems((prev) => [newItem, ...prev]);
      setTitlu('');
      setBody('');
      setUrl('');
      setTag('');
      setFeedback({
        kind: 'ok',
        msg: `${tip === 'lege' ? 'Legea' : 'Stirea'} a fost publicata pe pagina principala.`,
      });
    } catch (e) {
      setFeedback({ kind: 'err', msg: e instanceof Error ? e.message : 'Eroare la salvare' });
    } finally {
      setSalveaza(false);
    }
  }

  async function sterge(id: string) {
    if (!confirm('Sterg acest articol din pagina publica?')) return;
    try {
      await deletePublicContent(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Eroare la stergere');
    }
  }

  return (
    <div className="max-w-5xl">
      <h2 className="text-xl font-bold text-neutral-900 mb-1">Continut public — landing page</h2>
      <p className="text-sm text-neutral-600 mb-6">
        Adauga legi (sectiunea Legislatie) sau stiri (sectiunea Noutati) care apar pe pagina principala
        a vizitatorilor. Acest continut este complet separat de corpusul Djarvis.
      </p>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* === Form adaugare === */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="font-bold text-neutral-900 mb-4">Adauga articol nou</h3>

          <div className="flex gap-2 mb-4">
            {(['lege', 'stire'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTip(t)}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition ${
                  tip === t
                    ? 'bg-indigo-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {t === 'lege' ? '📜 Lege' : '📰 Stire'}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <Camp
              label="Titlu *"
              value={titlu}
              onChange={setTitlu}
              placeholder={tip === 'lege' ? 'Ex: Legea Contabilitatii nr. 113/2007' : 'Ex: Modificari Cod Fiscal 2026'}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">
                {tip === 'lege' ? 'Descriere scurta *' : 'Sumar *'}
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                placeholder={
                  tip === 'lege'
                    ? 'Descrie pe scurt ce reglementeaza legea (apare pe card)'
                    : 'Sumar al stirii (apare pe card)'
                }
                className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm"
              />
            </div>

            {tip === 'lege' && (
              <Camp
                label="URL catre lege"
                value={url}
                onChange={setUrl}
                placeholder="https://www.legis.md/..."
              />
            )}

            <div className="grid grid-cols-2 gap-3">
              <Camp
                label={tip === 'lege' ? 'Categorie' : 'Tag'}
                value={tag}
                onChange={setTag}
                placeholder={tip === 'lege' ? 'Cod Fiscal' : 'TVA'}
              />
              {tip === 'stire' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase mb-1">Culoare</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-10 border border-neutral-200 rounded-md cursor-pointer"
                  />
                </div>
              )}
            </div>

            {feedback && (
              <div
                className={`text-sm rounded-md p-2 border ${
                  feedback.kind === 'ok'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                {feedback.msg}
              </div>
            )}

            <button
              onClick={adauga}
              disabled={salveaza}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-md disabled:opacity-50"
            >
              {salveaza ? 'Se publica...' : 'Publica pe landing'}
            </button>
          </div>
        </div>

        {/* === Lista existenta === */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="font-bold text-neutral-900 mb-4">Articole publicate ({items.length})</h3>
          {loading ? (
            <div className="text-sm text-neutral-500">Se incarca…</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-neutral-500 italic">
              Niciun articol publicat. Adauga primul folosind formularul din stanga.
            </div>
          ) : (
            <ul className="space-y-2 max-h-[600px] overflow-y-auto">
              {items.map((it) => (
                <li
                  key={it.id}
                  className="flex justify-between items-start gap-3 p-3 bg-neutral-50 rounded-md border border-neutral-100"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          it.type === 'lege' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {it.type}
                      </span>
                      {it.tag && <span className="text-xs text-neutral-500">{it.tag}</span>}
                      <span className="text-xs text-neutral-400 ml-auto">
                        {new Date(it.published_date).toLocaleDateString('ro')}
                      </span>
                    </div>
                    <div className="font-semibold text-sm text-neutral-900 truncate">{it.title}</div>
                    <div className="text-xs text-neutral-600 mt-1 line-clamp-2">{it.body}</div>
                  </div>
                  <button
                    onClick={() => sterge(it.id)}
                    className="text-red-600 hover:text-red-800 text-xs font-semibold whitespace-nowrap"
                    title="Sterge"
                  >
                    Sterge
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default Admin;

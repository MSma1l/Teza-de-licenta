/* ============================================
   ADMIN DASHBOARD — pagina principala pentru rolul admin

   Inlocuieste landing page-ul public pentru admin / super_admin.
   Combina date din backend principal (3777) si AI service (3778).
   ============================================ */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ModelTrainingOutlinedIcon from '@mui/icons-material/ModelTrainingOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';

import Navbar from '../../components/Navbar/Navbar';
import {
  fetchUsersByRole,
  fetchDocumentsStats,
  fetchDocumentsTimeseries,
  fetchTopContabili,
  fetchSystemHealth,
  fetchAuditLog,
  fetchAgentsOverview,
  type UsersByRole,
  type DocumentsStats,
  type DocumentsTimeseries,
  type TopContabil,
  type SystemHealth,
  type AuditLogEntry,
  type AgentsOverview,
  type AIAgent,
} from '../../api/adminDashboardApi';
import { fetchTrainingStats, type TrainingStats } from '../../api/trainingApi';

const TYPE_LABEL: Record<string, string> = {
  factura: 'Factura',
  chitanta: 'Chitanta',
  contract: 'Contract',
  extras_bancar: 'Extras bancar',
  bon_fiscal: 'Bon fiscal',
  declaratie: 'Declaratie',
  act_constitutiv: 'Act constitutiv',
  certificat: 'Certificat',
  proces_verbal: 'Proces verbal',
  stat_plata: 'Stat plata',
  altele: 'Altele',
};

const STATUS_COLOR: Record<string, string> = {
  incarcat: 'bg-blue-100 text-blue-700',
  in_procesare: 'bg-amber-100 text-amber-700',
  ocr_complet: 'bg-cyan-100 text-cyan-700',
  clasificat: 'bg-emerald-100 text-emerald-700',
  extras: 'bg-violet-100 text-violet-700',
  pending_approval: 'bg-yellow-100 text-yellow-700',
  verificat: 'bg-teal-100 text-teal-700',
  aprobat: 'bg-green-100 text-green-700',
  respins: 'bg-red-100 text-red-700',
  arhivat: 'bg-neutral-200 text-neutral-700',
};

function statusLabel(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function dotForHealth(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'bg-neutral-300';
  // Numerele (ex. celery_workers: 1) — pozitiv = verde, zero = rosu
  if (typeof value === 'number') return value > 0 ? 'bg-emerald-500' : 'bg-red-500';
  const v = String(value).toLowerCase();
  if (v.includes('ok') || v.includes('healthy') || v.includes('connected') || v.includes('loaded') || v === 'online') return 'bg-emerald-500';
  if (v.includes('warn') || v.includes('partial') || v.includes('lazy') || v.includes('fallback') || v.includes('rule_based')) return 'bg-amber-500';
  if (v.includes('error') || v.includes('disconnected') || v.includes('not_loaded')) return 'bg-red-500';
  // Default — pentru valori neutre (ex. "0 documents", "ml_loaded" etc deja prinse mai sus)
  return v.includes('0 ') ? 'bg-amber-500' : 'bg-emerald-500';
}

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState<UsersByRole | null>(null);
  const [docs, setDocs] = useState<DocumentsStats | null>(null);
  const [timeseries, setTimeseries] = useState<DocumentsTimeseries | null>(null);
  const [topContabili, setTopContabili] = useState<TopContabil[]>([]);
  const [training, setTraining] = useState<TrainingStats | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [agents, setAgents] = useState<AgentsOverview | null>(null);

  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    // Toate paralel — fiecare poate esua independent fara sa pice tot dashboard-ul
    const safe = (p: Promise<unknown>, key: string): Promise<void> =>
      p.then(() => undefined).catch((e) => collect(key, e));

    const tasks: Array<Promise<void>> = [
      safe(fetchUsersByRole().then((d) => { if (mounted) setUsers(d); }), 'users'),
      safe(fetchDocumentsStats().then((d) => { if (mounted) setDocs(d); }), 'docs'),
      safe(fetchDocumentsTimeseries(7).then((d) => { if (mounted) setTimeseries(d); }), 'timeseries'),
      safe(fetchTopContabili(5).then((d) => { if (mounted) setTopContabili(d.top); }), 'top'),
      safe(fetchTrainingStats().then((d) => { if (mounted) setTraining(d); }), 'training'),
      safe(fetchSystemHealth().then((d) => { if (mounted) setHealth(d); }), 'health'),
      safe(fetchAuditLog(5).then((d) => { if (mounted) setAuditLog(d); }), 'audit'),
      safe(fetchAgentsOverview().then((d) => { if (mounted) setAgents(d); }), 'agents'),
    ];

    function collect(key: string, e: unknown) {
      if (!mounted) return;
      setErrors((prev) => ({ ...prev, [key]: e instanceof Error ? e.message : String(e) }));
    }

    Promise.allSettled(tasks).then(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  // Mini bar chart pentru timeseries 7 zile (SVG inline, fara libs externe)
  const renderTimeseries = () => {
    if (!timeseries || timeseries.series.length === 0) {
      return <div className="text-sm text-neutral-500">Nu sunt date.</div>;
    }
    const max = Math.max(...timeseries.series.map((s) => s.count), 1);
    const W = 100; // procente
    const barWidth = W / timeseries.series.length;
    return (
      <div className="w-full">
        <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="w-full h-32">
          {timeseries.series.map((p, i) => {
            const h = (p.count / max) * 50;
            return (
              <g key={p.date}>
                <rect
                  x={i * barWidth + 1}
                  y={55 - h}
                  width={barWidth - 2}
                  height={h || 0.5}
                  fill="#6366f1"
                  rx="0.5"
                />
              </g>
            );
          })}
        </svg>
        <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
          {timeseries.series.map((p) => (
            <span key={p.date} className="text-center" style={{ width: `${barWidth}%` }}>
              {p.date.slice(5)} <span className="font-bold text-neutral-700">{p.count}</span>
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Navbar isLoggedIn={true} showNavLinks={false} />

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-8">
        <header className="mb-6 flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Panou Administrator</h1>
            <p className="text-sm text-neutral-600">
              Vedere generala asupra utilizatorilor, documentelor si serviciilor AI.
            </p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold whitespace-nowrap"
          >
            Gestionare avansata →
          </button>
        </header>

        {loading && (
          <div className="bg-white rounded-xl border border-neutral-200 p-6 text-center text-neutral-500 mb-6">
            Se incarca datele dashboard-ului…
          </div>
        )}

        {/* === ROW 1 — Stat cards === */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<PeopleAltOutlinedIcon />}
            label="Utilizatori"
            value={users?.total ?? '—'}
            sub={users ? `${users.admin} admini · ${users.contabil} contabili · ${users.client} clienti` : ''}
            tone="indigo"
          />
          <StatCard
            icon={<DescriptionOutlinedIcon />}
            label="Documente"
            value={docs?.total ?? '—'}
            sub={docs ? `${Object.keys(docs.by_type).length} tipuri distincte` : ''}
            tone="emerald"
          />
          <StatCard
            icon={<ModelTrainingOutlinedIcon />}
            label="Agenti AI"
            value={agents ? `${agents.summary.online}/${agents.summary.total}` : '—'}
            sub={
              agents
                ? `${agents.summary.ml_models_active} ML antrenat${agents.summary.ml_models_active === 1 ? '' : 'e'} · ${agents.summary.degraded} degradat${agents.summary.degraded === 1 ? '' : 'e'}`
                : training
                  ? `${training.processed_documents} documente procesate`
                  : ''
            }
            tone="violet"
          />
          <StatCard
            icon={<AssessmentOutlinedIcon />}
            label="OCR mediu"
            value={
              training && typeof training.avg_ocr_confidence === 'number'
                ? `${(training.avg_ocr_confidence * 100).toFixed(1)}%`
                : '—'
            }
            sub={training ? `${training.total_examples} exemple antrenare` : ''}
            tone="amber"
          />
        </div>

        {/* === ROW 2 — Documents by type / status === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Card title="Documente pe tip" icon={<DescriptionOutlinedIcon className="text-neutral-700" />}>
            {docs && Object.keys(docs.by_type).length > 0 ? (
              <ul className="space-y-2">
                {Object.entries(docs.by_type)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => {
                    const pct = docs.total > 0 ? (count / docs.total) * 100 : 0;
                    return (
                      <li key={type}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-neutral-700 font-medium">{TYPE_LABEL[type] || type}</span>
                          <span className="text-neutral-500">{count} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
              </ul>
            ) : (
              <Empty />
            )}
          </Card>

          <Card title="Documente pe status" icon={<DescriptionOutlinedIcon className="text-neutral-700" />}>
            {docs && Object.keys(docs.by_status).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {Object.entries(docs.by_status)
                  .sort(([, a], [, b]) => b - a)
                  .map(([status, count]) => (
                    <span
                      key={status}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
                        STATUS_COLOR[status] || 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {statusLabel(status)}
                      <span className="bg-white/80 rounded-full px-2 py-0.5 text-[11px]">{count}</span>
                    </span>
                  ))}
              </div>
            ) : (
              <Empty />
            )}
          </Card>
        </div>

        {/* === ROW 3 — Timeseries / Top contabili === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Card
            title="Documente — ultimele 7 zile"
            icon={<TrendingUpOutlinedIcon className="text-neutral-700" />}
          >
            {renderTimeseries()}
          </Card>

          <Card title="Top contabili" icon={<EmojiEventsOutlinedIcon className="text-neutral-700" />}>
            {topContabili.length > 0 ? (
              <ol className="space-y-2">
                {topContabili.map((c, i) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <div>
                        <div className="font-semibold text-sm text-neutral-900">
                          {c.full_name || c.username}
                        </div>
                        <div className="text-xs text-neutral-500">@{c.username}</div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-indigo-600">
                      {c.client_count} {c.client_count === 1 ? 'client' : 'clienti'}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <Empty />
            )}
          </Card>
        </div>

        {/* === ROW 4 — Audit log / System health === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Card title="Activitate recenta" icon={<HistoryOutlinedIcon className="text-neutral-700" />}>
            {auditLog.length > 0 ? (
              <ul className="space-y-2">
                {auditLog.map((entry) => (
                  <li key={entry.id} className="flex justify-between gap-3 py-2 border-b border-neutral-100 last:border-0">
                    <div className="text-sm">
                      <div className="font-medium text-neutral-900">{entry.action_type}</div>
                      <div className="text-xs text-neutral-500">
                        user: {entry.user_id?.slice(0, 8) || '—'} · ip: {entry.ip_address || '—'}
                      </div>
                    </div>
                    <span className="text-xs text-neutral-400 whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString('ro')}
                    </span>
                  </li>
                ))}
              </ul>
            ) : errors.audit ? (
              <ErrorBox msg={errors.audit} />
            ) : (
              <Empty />
            )}
          </Card>

          <Card title="Status servicii" icon={<HealthAndSafetyOutlinedIcon className="text-neutral-700" />}>
            {health ? (
              <ul className="space-y-2">
                {Object.entries(health)
                  .filter(([k]) => k !== 'status')
                  .map(([k, v]) => (
                    <li key={k} className="flex items-center justify-between text-sm">
                      <span className="text-neutral-700 capitalize">{k.replace(/_/g, ' ')}</span>
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${dotForHealth(v)}`} />
                        <span className="text-xs text-neutral-500">
                          {v === null || v === undefined ? '—' : String(v)}
                        </span>
                      </span>
                    </li>
                  ))}
              </ul>
            ) : errors.health ? (
              <ErrorBox msg={errors.health} />
            ) : (
              <Empty />
            )}
          </Card>
        </div>

        {/* === ROW 5 — AI Agents (toti 6) === */}
        <Card
          title="Agenti AI ai aplicatiei"
          icon={<ModelTrainingOutlinedIcon className="text-neutral-700" />}
        >
          {agents && agents.agents.length > 0 ? (
            <div>
              {/* Summary pill bar */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {agents.summary.online} online
                </span>
                {agents.summary.degraded > 0 && (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    {agents.summary.degraded} degradat
                  </span>
                )}
                {agents.summary.offline > 0 && (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    {agents.summary.offline} offline
                  </span>
                )}
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
                  {agents.summary.ml_models_active} cu model ML antrenat
                </span>
              </div>

              {/* Grid 6 agenti */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {agents.agents.map((a: AIAgent) => (
                  <div
                    key={a.id}
                    className="border border-neutral-200 rounded-xl p-4 bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-neutral-900 truncate">{a.name}</div>
                        <div className="text-xs text-neutral-500 mt-0.5">{a.kind}</div>
                      </div>
                      <AgentStatusBadge status={a.status} />
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed mb-2">{a.description}</p>
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100">
                      <span className="text-[11px] text-neutral-500 font-mono truncate">{a.tech}</span>
                      <ModeBadge mode={a.mode} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Optional: training history table — only if there are fine-tuned versions */}
              {training?.active_models && training.active_models.length > 0 && (
                <details className="mt-4 group">
                  <summary className="cursor-pointer text-xs font-semibold text-neutral-600 hover:text-neutral-900 select-none">
                    Versiuni modele fine-tuned ({training.active_models.length})
                  </summary>
                  <div className="overflow-x-auto mt-2 border border-neutral-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-50 border-b border-neutral-200">
                        <tr>
                          <th className="text-left px-3 py-2 font-semibold text-neutral-700">Model</th>
                          <th className="text-left px-3 py-2 font-semibold text-neutral-700">Versiune</th>
                          <th className="text-left px-3 py-2 font-semibold text-neutral-700">Acuratete</th>
                          <th className="text-left px-3 py-2 font-semibold text-neutral-700">Exemple</th>
                          <th className="text-left px-3 py-2 font-semibold text-neutral-700">Antrenat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {training.active_models.map((m) => {
                          const acc = m.accuracy ? Object.values(m.accuracy)[0] : null;
                          return (
                            <tr key={`${m.name}-${m.version}`} className="border-b border-neutral-100 last:border-0">
                              <td className="px-3 py-2 font-medium text-neutral-900">{m.name}</td>
                              <td className="px-3 py-2 text-neutral-700">{m.version}</td>
                              <td className="px-3 py-2 text-neutral-700">
                                {acc !== null ? `${(acc * 100).toFixed(1)}%` : '—'}
                              </td>
                              <td className="px-3 py-2 text-neutral-700">{m.dataset_size}</td>
                              <td className="px-3 py-2 text-neutral-500 text-xs">
                                {m.training_date ? new Date(m.training_date).toLocaleDateString('ro') : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </div>
          ) : errors.agents ? (
            <ErrorBox msg={errors.agents} />
          ) : (
            <Empty />
          )}
        </Card>
      </main>
    </div>
  );
};

// === Helpers ===

function StatCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub: string;
  tone: 'indigo' | 'emerald' | 'violet' | 'amber';
}) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    violet: 'bg-violet-50 text-violet-700',
    amber: 'bg-amber-50 text-amber-700',
  };
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <span className={`w-10 h-10 rounded-lg flex items-center justify-center ${tones[tone]}`}>
          {icon}
        </span>
        <span className="text-sm font-medium text-neutral-600">{label}</span>
      </div>
      <div className="text-3xl font-bold text-neutral-900">{value}</div>
      {sub && <div className="text-xs text-neutral-500 mt-1">{sub}</div>}
    </div>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
      <header className="flex items-center gap-2 mb-4 pb-2 border-b border-neutral-100">
        {icon}
        <h3 className="font-bold text-neutral-900">{title}</h3>
      </header>
      {children}
    </section>
  );
}

function Empty() {
  return <div className="text-sm text-neutral-500 italic">Nu sunt date disponibile.</div>;
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
      {msg}
    </div>
  );
}

function AgentStatusBadge({ status }: { status: AIAgent['status'] }) {
  const map = {
    online: { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Online' },
    degraded: { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', label: 'Degradat' },
    offline: { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', label: 'Offline' },
  } as const;
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.bg} ${s.text} shrink-0`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
      {s.label}
    </span>
  );
}

function ModeBadge({ mode }: { mode: AIAgent['mode'] }) {
  const map: Record<AIAgent['mode'], { bg: string; text: string; label: string }> = {
    ml: { bg: 'bg-violet-100', text: 'text-violet-700', label: 'ML' },
    llm: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'LLM' },
    ocr: { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'OCR' },
    fallback: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Fallback' },
    'rule-based': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Reguli' },
  };
  const m = map[mode];
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.bg} ${m.text} shrink-0`}>
      {m.label}
    </span>
  );
}

export default AdminDashboard;

/* ============================================
   CONTABIL DASHBOARD — pagina principala pentru rolul contabil

   Inlocuieste landing page-ul public pentru contabil.
   Afiseaza: stats, clienti, coada urgente, timeseries, escalated chats badge.
   ============================================ */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import Navbar from '../../components/Navbar/Navbar';
import {
  fetchContabilOverview,
  fetchContabilClienti,
  fetchContabilCoadaUrgente,
  fetchContabilTimeseries,
  type ContabilOverview,
  type ContabilClient,
  type ContabilQueueDoc,
  type ContabilTimeseries,
} from '../../api/contabilDashboardApi';

const TYPE_LABEL: Record<string, string> = {
  factura: 'Factura',
  chitanta: 'Chitanta',
  contract: 'Contract',
  extras_bancar: 'Extras bancar',
  bon_fiscal: 'Bon fiscal',
  declaratie: 'Declaratie',
  altele: 'Altele',
};

const STATUS_COLOR: Record<string, string> = {
  incarcat: 'bg-blue-100 text-blue-700',
  in_procesare: 'bg-amber-100 text-amber-700',
  ocr_complet: 'bg-cyan-100 text-cyan-700',
  clasificat: 'bg-emerald-100 text-emerald-700',
  extras: 'bg-violet-100 text-violet-700',
  pending_approval: 'bg-yellow-100 text-yellow-700',
};

const ContabilDashboard = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<ContabilOverview | null>(null);
  const [clienti, setClienti] = useState<ContabilClient[]>([]);
  const [coada, setCoada] = useState<ContabilQueueDoc[]>([]);
  const [series, setSeries] = useState<ContabilTimeseries | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.allSettled([
      fetchContabilOverview().then((d) => mounted && setOverview(d)),
      fetchContabilClienti().then((d) => mounted && setClienti(d.clienti)),
      fetchContabilCoadaUrgente(5).then((d) => mounted && setCoada(d.documente)),
      fetchContabilTimeseries(7).then((d) => mounted && setSeries(d)),
    ]).then(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  // Mini bar chart (SVG inline)
  const renderTimeseries = () => {
    if (!series || series.series.length === 0) {
      return <div className="text-sm text-neutral-500">Nu sunt date.</div>;
    }
    const max = Math.max(...series.series.map((s) => s.count), 1);
    const W = 100;
    const barWidth = W / series.series.length;
    return (
      <div className="w-full">
        <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="w-full h-32">
          {series.series.map((p, i) => {
            const h = (p.count / max) * 50;
            return (
              <rect
                key={p.date}
                x={i * barWidth + 1}
                y={55 - h}
                width={barWidth - 2}
                height={h || 0.5}
                fill="#0ea5e9"
                rx="0.5"
              />
            );
          })}
        </svg>
        <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
          {series.series.map((p) => (
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
        <header className="mb-6 flex items-baseline justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Panou Contabil</h1>
            <p className="text-sm text-neutral-600">
              Vedere de ansamblu asupra clientilor tai si activitatii zilnice.
            </p>
          </div>
          <button
            onClick={() => navigate('/contabil')}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold whitespace-nowrap"
          >
            Panoul de lucru →
          </button>
        </header>

        {loading && (
          <div className="bg-white rounded-xl border border-neutral-200 p-6 text-center text-neutral-500 mb-6">
            Se incarca datele...
          </div>
        )}

        {/* === ROW 1 — Stat cards === */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<PeopleAltOutlinedIcon />}
            label="Clientii mei"
            value={overview?.clienti ?? '—'}
            tone="indigo"
            onClick={() => navigate('/contabil?tab=clienti')}
          />
          <StatCard
            icon={<InboxOutlinedIcon />}
            label="In coada de validat"
            value={overview?.documente_coada ?? '—'}
            sub={overview ? `${overview.documente_flagged} cu atentie` : ''}
            tone="amber"
            onClick={() => navigate('/contabil?tab=coada')}
          />
          <StatCard
            icon={<CheckCircleOutlineIcon />}
            label="Documente aprobate"
            value={overview?.documente_aprobate ?? '—'}
            sub={overview ? `din ${overview.documente_total} total` : ''}
            tone="emerald"
          />
          <StatCard
            icon={<ChatBubbleOutlineIcon />}
            label="Intrebari escalate"
            value={overview?.chat_escalated_open ?? '—'}
            sub="aşteaptă răspunsul tău"
            tone="violet"
            onClick={() => navigate('/contabil?tab=chat')}
            highlight={(overview?.chat_escalated_open ?? 0) > 0}
          />
        </div>

        {/* === ROW 2 — Clientii mei + Coada urgente === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Card title="Clientii mei" icon={<PeopleAltOutlinedIcon className="text-neutral-700" />}>
            {clienti.length === 0 ? (
              <Empty msg="Niciun client asignat. Apasa 'Preia un client' din panoul de lucru." />
            ) : (
              <ul className="space-y-2">
                {clienti.slice(0, 6).map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-neutral-50 hover:bg-indigo-50 transition"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0">
                        {(c.full_name || c.username).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-neutral-900 truncate">
                          {c.full_name || c.username}
                        </div>
                        <div className="text-xs text-neutral-500 truncate">{c.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-neutral-600 bg-white border border-neutral-200 rounded-full px-2 py-1">
                        {c.documents_count} doc
                      </span>
                      <Link
                        to={`/documents?client=${c.id}`}
                        className="text-xs font-semibold text-indigo-700 hover:text-indigo-900"
                      >
                        Documente →
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card
            title="Documente urgente in coada"
            icon={<WarningAmberOutlinedIcon className="text-neutral-700" />}
          >
            {coada.length === 0 ? (
              <Empty msg="Coada e goala. Toate documentele clientilor sunt procesate." />
            ) : (
              <ul className="space-y-2">
                {coada.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-neutral-50 hover:bg-amber-50 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-neutral-900 truncate">
                        {d.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700">
                          {TYPE_LABEL[d.document_type] || d.document_type}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            STATUS_COLOR[d.status] || 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {d.status.replace(/_/g, ' ')}
                        </span>
                        {d.has_flagged_fields && (
                          <span className="text-[10px] text-amber-700 font-bold">⚠ flagged</span>
                        )}
                      </div>
                    </div>
                    <Link
                      to={`/contabil?tab=coada`}
                      className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1 shrink-0"
                    >
                      Validează <ArrowForwardIcon style={{ fontSize: 14 }} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* === ROW 3 — Timeseries + Quick actions === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Card
            title="Documente noi — ultimele 7 zile"
            icon={<TrendingUpOutlinedIcon className="text-neutral-700" />}
          >
            {renderTimeseries()}
          </Card>

          <Card title="Actiuni rapide" icon={<AssessmentOutlinedIcon className="text-neutral-700" />}>
            <div className="grid grid-cols-2 gap-3">
              <ActionLink
                to="/contabil?tab=coada"
                emoji="📥"
                title="Coadă documente"
                desc="Validează OCR + extracție AI"
              />
              <ActionLink
                to="/contabil?tab=solicitari"
                emoji="✉️"
                title="Solicită acte"
                desc="Trimite cerere către un client"
              />
              <ActionLink
                to="/contabil?tab=chat"
                emoji="💬"
                title="Chat clienți"
                desc="Răspunde la întrebări escalate"
                badge={overview?.chat_escalated_open}
              />
              <ActionLink
                to="/reports"
                emoji="📊"
                title="Rapoarte SFS"
                desc={`${overview?.rapoarte_create ?? 0} create de tine`}
              />
            </div>
          </Card>
        </div>
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
  onClick,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  tone: 'indigo' | 'emerald' | 'violet' | 'amber';
  onClick?: () => void;
  highlight?: boolean;
}) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    violet: 'bg-violet-50 text-violet-700',
    amber: 'bg-amber-50 text-amber-700',
  };
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      onClick={onClick}
      className={`bg-white rounded-xl border p-5 shadow-sm text-left ${
        onClick ? 'hover:shadow-md hover:border-indigo-300 transition cursor-pointer' : 'border-neutral-200'
      } ${highlight ? 'ring-2 ring-violet-300 border-violet-300' : 'border-neutral-200'}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className={`w-10 h-10 rounded-lg flex items-center justify-center ${tones[tone]}`}>
          {icon}
        </span>
        <span className="text-sm font-medium text-neutral-600">{label}</span>
      </div>
      <div className="text-3xl font-bold text-neutral-900">{value}</div>
      {sub && <div className="text-xs text-neutral-500 mt-1">{sub}</div>}
    </Component>
  );
}

function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
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

function Empty({ msg }: { msg: string }) {
  return <div className="text-sm text-neutral-500 italic py-4 text-center">{msg}</div>;
}

function ActionLink({
  to,
  emoji,
  title,
  desc,
  badge,
}: {
  to: string;
  emoji: string;
  title: string;
  desc: string;
  badge?: number;
}) {
  return (
    <Link
      to={to}
      className="relative block p-3 rounded-lg bg-neutral-50 hover:bg-indigo-50 hover:border-indigo-200 border border-transparent transition"
    >
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="font-semibold text-sm text-neutral-900">{title}</div>
      <div className="text-xs text-neutral-500">{desc}</div>
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-2 right-2 inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[11px] font-bold text-white bg-violet-600 rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );
}

export default ContabilDashboard;

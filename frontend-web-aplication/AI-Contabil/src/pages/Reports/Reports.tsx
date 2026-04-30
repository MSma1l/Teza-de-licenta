import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import {
  fetchReports,
  deleteReport,
  REPORT_TYPES,
  REPORT_STATUSES,
} from '../../api/reportsApi';
import type {  ReportData } from '../../api/reportsApi';

import AssessmentIcon from '@mui/icons-material/Assessment';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SendIcon from '@mui/icons-material/Send';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AlertToast from '../../components/AlertToast/AlertToast';
import TwoFactorPrompt from '../../components/TwoFactorPrompt/TwoFactorPrompt';
import { useAuth } from '../../context/AuthContext';
import UserPicker from '../../components/UserPicker/UserPicker';

const Reports = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isContabil = user?.role === 'contabil';

  // Query params din URL (Contabil "Clientii mei" si "Rapoarte SFS")
  const [searchParams] = useSearchParams();
  const clientFromUrl = searchParams.get('client');
  const tipFromUrl = (searchParams.get('tip') || '').toUpperCase();

  const [reports, setReports] = useState<ReportData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState(tipFromUrl);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [pendingDownload, setPendingDownload] = useState<ReportData | null>(null);
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  // Admin: filtru pe user (client sau contabil). null = vede tot.
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserRole, setSelectedUserRole] = useState<string | null>(null);

  const isContabilSelected = selectedUserRole === 'contabil';
  const adminAccountantId = isAdmin && selectedUserId && isContabilSelected ? selectedUserId : undefined;
  const adminClientId = isAdmin && selectedUserId && !isContabilSelected ? selectedUserId : undefined;

  // Contabil: cand vine din card client → ?client=<id> filtreaza rapoartele acelui client
  const contabilClientId = isContabil && clientFromUrl ? clientFromUrl : undefined;

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await fetchReports({
        report_type: filterType || undefined,
        report_status: filterStatus || undefined,
        client_id: adminClientId || contabilClientId,
        accountant_id: adminAccountantId,
        limit: 100,
      });
      setReports(data.reports);
      setTotal(data.total);
    } catch {
      setError('Nu s-au putut încărca rapoartele');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [filterType, filterStatus, selectedUserId, selectedUserRole, clientFromUrl]);

  const handleDelete = async (id: string) => {
    try {
      await deleteReport(id);
      setToast({ message: 'Raport șters', type: 'success' });
      setSelectedReport(null);
      loadReports();
    } catch {
      setToast({ message: 'Eroare la ștergere', type: 'error' });
    }
  };

  /** Cere descarcare PDF - declanseaza 2FA */
  const handleDownloadRequest = (report: ReportData) => {
    setPendingDownload(report);
    setTwoFactorOpen(true);
  };

  /** Dupa ce 2FA e confirmat, descarca PDF-ul real */
  const handleTwoFactorApproved = async () => {
    if (!pendingDownload) return;
    setTwoFactorOpen(false);
    try {
      const apiBase = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3777/api/v1/ac';
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${apiBase}/reports/${pendingDownload.id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `raport_${pendingDownload.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToast({ message: 'Raport descarcat cu succes', type: 'success' });
    } catch {
      setToast({ message: 'Eroare la descarcarea raportului', type: 'error' });
    } finally {
      setPendingDownload(null);
    }
  };

  const filteredReports = reports.filter(
    (r) =>
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-600',
      in_lucru: 'bg-blue-100 text-blue-700',
      finalizat: 'bg-green-100 text-green-700',
      expediat: 'bg-purple-100 text-purple-700',
      vizualizat: 'bg-teal-100 text-teal-700',
      arhivat: 'bg-gray-100 text-gray-500',
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'expediat') return <SendIcon style={{ fontSize: 14 }} />;
    return null;
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className="min-h-screen bg-[var(--color-neutral-100)] flex flex-col">
      <Navbar isLoggedIn showNavLinks={false} />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-[var(--font-heading)] text-2xl font-bold text-[var(--color-primary)]">
              {isAdmin && selectedUserId
                ? isContabilSelected
                  ? 'Rapoartele create de contabil'
                  : 'Rapoartele clientului'
                : 'Rapoarte'}
            </h1>
            <p className="text-[var(--color-neutral-400)] text-sm mt-1">
              {total} rapoarte
              {isAdmin && !selectedUserId && ' (toți utilizatorii)'}
            </p>
          </div>
        </div>

        {isAdmin && (
          <UserPicker
            selectedUserId={selectedUserId}
            onChange={(id, role) => { setSelectedUserId(id); setSelectedUserRole(role || null); }}
            roleFilter="non_admin"
            label="Vezi rapoartele unui client sau cele create de un contabil"
          />
        )}

        {/* Search & Filters */}
        <div className="flex gap-3 mb-6 max-md:flex-col">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]" fontSize="small" />
            <input
              type="text"
              placeholder="Caută rapoarte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--color-input-border)] bg-white focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <FilterListIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]" fontSize="small" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-lg border border-[var(--color-input-border)] bg-white focus:outline-none appearance-none cursor-pointer min-w-[170px]"
              >
                <option value="">Toate tipurile</option>
                {Object.entries(REPORT_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-[var(--color-input-border)] bg-white focus:outline-none appearance-none cursor-pointer min-w-[150px]"
            >
              <option value="">Toate statusurile</option>
              {Object.entries(REPORT_STATUSES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <p className="text-center text-red-500 py-10">{error}</p>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-20">
            <AssessmentIcon style={{ fontSize: 64 }} className="text-[var(--color-neutral-300)] mb-4" />
            <p className="text-[var(--color-neutral-400)] text-lg">
              {searchTerm || filterType || filterStatus
                ? 'Nu s-au găsit rapoarte cu filtrele selectate'
                : 'Nu ai încă rapoarte. Contabilul tău va crea rapoarte pentru tine.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-lg border border-[var(--color-input-border)] p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-bg)] flex items-center justify-center flex-shrink-0">
                  <AssessmentIcon className="text-[var(--color-accent)]" fontSize="small" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[var(--color-primary)] truncate">{report.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[var(--color-neutral-400)]">
                    <span>{REPORT_TYPES[report.report_type] || report.report_type}</span>
                    {report.period_start && report.period_end && (
                      <span>Perioada: {report.period_start} - {report.period_end}</span>
                    )}
                    <span>{formatDate(report.created_at)}</span>
                  </div>
                  {report.description && (
                    <p className="text-xs text-[var(--color-neutral-400)] mt-1 truncate">{report.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${getStatusColor(report.status)}`}>
                    {getStatusIcon(report.status)}
                    {REPORT_STATUSES[report.status] || report.status}
                  </span>
                  {report.sent_at && (
                    <span className="text-xs text-[var(--color-neutral-400)]">
                      Trimis: {formatDate(report.sent_at)}
                    </span>
                  )}
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="p-1.5 rounded-lg hover:bg-blue-50 text-[var(--color-neutral-400)] hover:text-blue-500 transition-colors cursor-pointer"
                    title="Vizualizează"
                  >
                    <VisibilityIcon fontSize="small" />
                  </button>
                  <button
                    onClick={() => handleDownloadRequest(report)}
                    className="p-1.5 rounded-lg hover:bg-purple-50 text-[var(--color-neutral-400)] hover:text-[#4f46e5] transition-colors cursor-pointer"
                    title="Descarcă PDF"
                  >
                    <PictureAsPdfIcon fontSize="small" />
                  </button>
                  <button
                    onClick={() => handleDelete(report.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--color-neutral-400)] hover:text-red-500 transition-colors cursor-pointer"
                    title="Șterge"
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-primary)]">{selectedReport.title}</h2>
                  <p className="text-sm text-[var(--color-neutral-400)] mt-1">
                    {REPORT_TYPES[selectedReport.report_type]} | {formatDate(selectedReport.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-1 hover:bg-gray-100 rounded-lg text-2xl leading-none cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {selectedReport.description && (
                <p className="text-sm text-[var(--color-neutral-500)] mb-4">{selectedReport.description}</p>
              )}

              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-[var(--color-neutral-400)]">Status:</span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getStatusColor(selectedReport.status)}`}>
                    {REPORT_STATUSES[selectedReport.status]}
                  </span>
                </div>
                {selectedReport.period_start && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-[var(--color-neutral-400)]">Perioada:</span>
                    <span className="ml-2 font-medium">{selectedReport.period_start} - {selectedReport.period_end}</span>
                  </div>
                )}
              </div>

              {selectedReport.content && (
                <div className="bg-gray-50 rounded-lg p-4 text-sm whitespace-pre-wrap">
                  {selectedReport.content}
                </div>
              )}

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => handleDownloadRequest(selectedReport)}
                  className="btn-gradient px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2"
                >
                  <PictureAsPdfIcon style={{ fontSize: 18 }} />
                  Descarca PDF
                </button>
              </div>
            </div>
          </div>
        )}

        <TwoFactorPrompt
          open={twoFactorOpen}
          actionType="download_report_pdf"
          actionDescription={pendingDownload ? `Descarcare raport: ${pendingDownload.title}` : undefined}
          onClose={() => {
            setTwoFactorOpen(false);
            setPendingDownload(null);
          }}
          onApproved={handleTwoFactorApproved}
        />
      </main>

      {toast && (
        <AlertToast title={toast.type === 'success' ? 'Succes' : 'Eroare'} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <Footer showChat />
    </div>
  );
};

export default Reports;

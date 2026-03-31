import { useState, useEffect, useRef } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import AlertToast from '../../components/AlertToast/AlertToast';
import {
  fetchDocuments,
  uploadDocument,
  deleteDocument,
  DOCUMENT_TYPES,
  DOCUMENT_STATUSES,
} from '../../api/documentsApi';
import type { DocumentData } from '../../api/documentsApi';

import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';

const Documents = () => {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Upload state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadType, setUploadType] = useState('altele');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await fetchDocuments({
        document_type: filterType || undefined,
        doc_status: filterStatus || undefined,
        limit: 100,
      });
      setDocuments(data.documents);
      setTotal(data.total);
    } catch (e) {
      setError('Nu s-au putut încărca documentele');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [filterType, filterStatus]);

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) return;
    setUploading(true);
    try {
      await uploadDocument({
        file: uploadFile,
        title: uploadTitle,
        description: uploadDesc || undefined,
        document_type: uploadType,
      });
      setToast({ message: 'Document încărcat cu succes!', type: 'success' });
      setShowUpload(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadDesc('');
      setUploadType('altele');
      loadDocuments();
    } catch (e: any) {
      setToast({ message: e.message || 'Eroare la upload', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id);
      setToast({ message: 'Document șters', type: 'success' });
      loadDocuments();
    } catch {
      setToast({ message: 'Eroare la ștergere', type: 'error' });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setUploadFile(file);
      if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const filteredDocs = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      aprobat: 'bg-green-100 text-green-700',
      verificat: 'bg-blue-100 text-blue-700',
      pending_approval: 'bg-yellow-100 text-yellow-700',
      requires_manual: 'bg-orange-100 text-orange-700',
      respins: 'bg-red-100 text-red-700',
      incarcat: 'bg-gray-100 text-gray-600',
      in_procesare: 'bg-purple-100 text-purple-700',
      duplicate_detected: 'bg-red-50 text-red-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-[var(--color-neutral-100)] flex flex-col">
      <Navbar isLoggedIn showNavLinks={false} />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 max-md:flex-col max-md:gap-4">
          <div>
            <h1 className="font-[var(--font-heading)] text-2xl font-bold text-[var(--color-primary)]">
              Documentele mele
            </h1>
            <p className="text-[var(--color-neutral-400)] text-sm mt-1">
              {total} documente
            </p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-light)] transition-colors cursor-pointer"
          >
            <CloudUploadIcon fontSize="small" />
            Încarcă document
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex gap-3 mb-6 max-md:flex-col">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]" fontSize="small" />
            <input
              type="text"
              placeholder="Caută documente..."
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
                className="pl-10 pr-4 py-2.5 rounded-lg border border-[var(--color-input-border)] bg-white focus:outline-none appearance-none cursor-pointer min-w-[160px]"
              >
                <option value="">Toate tipurile</option>
                {Object.entries(DOCUMENT_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-[var(--color-input-border)] bg-white focus:outline-none appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="">Toate statusurile</option>
              {Object.entries(DOCUMENT_STATUSES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Documents List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <p className="text-center text-red-500 py-10">{error}</p>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-20">
            <DescriptionIcon style={{ fontSize: 64 }} className="text-[var(--color-neutral-300)] mb-4" />
            <p className="text-[var(--color-neutral-400)] text-lg">
              {searchTerm || filterType || filterStatus
                ? 'Nu s-au găsit documente cu filtrele selectate'
                : 'Nu ai încă documente. Încarcă primul document!'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-lg border border-[var(--color-input-border)] p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-bg)] flex items-center justify-center flex-shrink-0">
                  <DescriptionIcon className="text-[var(--color-accent)]" fontSize="small" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[var(--color-primary)] truncate">{doc.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[var(--color-neutral-400)]">
                    <span>{doc.file_name}</span>
                    <span>{formatSize(doc.file_size)}</span>
                    <span>{formatDate(doc.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-accent-bg)] text-[var(--color-accent)]">
                    {DOCUMENT_TYPES[doc.document_type] || doc.document_type}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(doc.status)}`}>
                    {DOCUMENT_STATUSES[doc.status] || doc.status}
                  </span>
                  {doc.urgency_score != null && doc.urgency_score > 50 && (
                    <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-600">
                      Urgent: {Math.round(doc.urgency_score)}
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(doc.id)}
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
      </main>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-[var(--color-primary)]">Încarcă document</h2>
              <button onClick={() => setShowUpload(false)} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer">
                <CloseIcon />
              </button>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-4 ${
                dragOver
                  ? 'border-[var(--color-primary)] bg-[var(--color-accent-bg)]'
                  : uploadFile
                  ? 'border-green-400 bg-green-50'
                  : 'border-[var(--color-input-border)] hover:border-[var(--color-primary)]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls,.doc,.docx"
                onChange={handleFileSelect}
              />
              <CloudUploadIcon style={{ fontSize: 40 }} className="text-[var(--color-neutral-300)] mb-2" />
              {uploadFile ? (
                <p className="text-sm text-green-600 font-medium">{uploadFile.name} ({formatSize(uploadFile.size)})</p>
              ) : (
                <>
                  <p className="text-sm text-[var(--color-neutral-400)]">Trage fișierul aici sau click pentru a selecta</p>
                  <p className="text-xs text-[var(--color-neutral-300)] mt-1">PDF, imagini, Excel, Word (max 10MB)</p>
                </>
              )}
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Titlu document *"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-input-border)] focus:outline-none focus:border-[var(--color-primary)]"
              />
              <textarea
                placeholder="Descriere (opțional)"
                value={uploadDesc}
                onChange={(e) => setUploadDesc(e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-input-border)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
              />
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-input-border)] focus:outline-none appearance-none cursor-pointer"
              >
                {Object.entries(DOCUMENT_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowUpload(false)}
                className="flex-1 py-2.5 rounded-lg border border-[var(--color-input-border)] text-[var(--color-neutral-500)] hover:bg-gray-50 cursor-pointer"
              >
                Anulează
              </button>
              <button
                onClick={handleUpload}
                disabled={!uploadFile || !uploadTitle.trim() || uploading}
                className="flex-1 py-2.5 rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {uploading ? 'Se încarcă...' : 'Încarcă'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <AlertToast
          title={toast.type === 'success' ? 'Succes' : 'Eroare'}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Footer showChat />
    </div>
  );
};

export default Documents;

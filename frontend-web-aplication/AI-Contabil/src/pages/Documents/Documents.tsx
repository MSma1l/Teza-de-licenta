import { useState, useEffect, useRef } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import AlertToast from '../../components/AlertToast/AlertToast';
import { fetchDocuments, uploadDocument, deleteDocument, DOCUMENT_TYPES, DOCUMENT_STATUSES } from '../../api/documentsApi';
import type { DocumentData } from '../../api/documentsApi';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import { useLanguage } from '../../context/LanguageContext';
import type { Lang } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import UserPicker from '../../components/UserPicker/UserPicker';

const t: Record<Lang, {
  myDocs: string; docsCount: string; upload: string; search: string;
  allTypes: string; allStatuses: string; noDocsFiltered: string; noDocsYet: string;
  deleteTip: string; uploadTitle: string; dragDrop: string; fileTypes: string;
  titlePlaceholder: string; descPlaceholder: string; cancel: string;
  uploading: string; uploadBtn: string; loadError: string;
  uploadSuccess: string; uploadError: string; deleteSuccess: string; deleteError: string;
  success: string; error: string;
}> = {
  ro: {
    myDocs: 'Documentele mele', docsCount: 'documente', upload: 'Incarca document',
    search: 'Cauta documente...', allTypes: 'Toate tipurile', allStatuses: 'Toate statusurile',
    noDocsFiltered: 'Nu s-au gasit documente cu filtrele selectate',
    noDocsYet: 'Nu ai inca documente. Incarca primul document!',
    deleteTip: 'Sterge', uploadTitle: 'Incarca document',
    dragDrop: 'Trage fisierul aici sau click pentru a selecta',
    fileTypes: 'PDF, imagini, Excel, Word (max 10MB)',
    titlePlaceholder: 'Titlu document *', descPlaceholder: 'Descriere (optional)',
    cancel: 'Anuleaza', uploading: 'Se incarca...', uploadBtn: 'Incarca',
    loadError: 'Nu s-au putut incarca documentele',
    uploadSuccess: 'Document incarcat cu succes!', uploadError: 'Eroare la upload',
    deleteSuccess: 'Document sters', deleteError: 'Eroare la stergere',
    success: 'Succes', error: 'Eroare',
  },
  en: {
    myDocs: 'My Documents', docsCount: 'documents', upload: 'Upload document',
    search: 'Search documents...', allTypes: 'All types', allStatuses: 'All statuses',
    noDocsFiltered: 'No documents found with selected filters',
    noDocsYet: "You don't have documents yet. Upload your first!",
    deleteTip: 'Delete', uploadTitle: 'Upload document',
    dragDrop: 'Drag file here or click to select',
    fileTypes: 'PDF, images, Excel, Word (max 10MB)',
    titlePlaceholder: 'Document title *', descPlaceholder: 'Description (optional)',
    cancel: 'Cancel', uploading: 'Uploading...', uploadBtn: 'Upload',
    loadError: 'Could not load documents',
    uploadSuccess: 'Document uploaded successfully!', uploadError: 'Upload error',
    deleteSuccess: 'Document deleted', deleteError: 'Delete error',
    success: 'Success', error: 'Error',
  },
  ru: {
    myDocs: 'Мои документы', docsCount: 'документов', upload: 'Загрузить документ',
    search: 'Поиск документов...', allTypes: 'Все типы', allStatuses: 'Все статусы',
    noDocsFiltered: 'Документы с выбранными фильтрами не найдены',
    noDocsYet: 'У вас ещё нет документов. Загрузите первый!',
    deleteTip: 'Удалить', uploadTitle: 'Загрузить документ',
    dragDrop: 'Перетащите файл сюда или нажмите для выбора',
    fileTypes: 'PDF, изображения, Excel, Word (макс. 10МБ)',
    titlePlaceholder: 'Название документа *', descPlaceholder: 'Описание (необязательно)',
    cancel: 'Отмена', uploading: 'Загрузка...', uploadBtn: 'Загрузить',
    loadError: 'Не удалось загрузить документы',
    uploadSuccess: 'Документ успешно загружен!', uploadError: 'Ошибка загрузки',
    deleteSuccess: 'Документ удалён', deleteError: 'Ошибка удаления',
    success: 'Успех', error: 'Ошибка',
  },
};

const locales: Record<Lang, string> = { ro: 'ro-RO', en: 'en-US', ru: 'ru-RU' };

const Documents = () => {
  const { lang } = useLanguage();
  const tr = t[lang];

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  // Admin: filtru pe user (client sau contabil). null = vede tot.
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserRole, setSelectedUserRole] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadType, setUploadType] = useState('altele');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Admin: daca a ales un CONTABIL → filtru accountant_id (vede docs ale clientilor lui)
  // Daca a ales un CLIENT → filtru owner_id (vede doar documentele clientului)
  const isContabilSelected = selectedUserRole === 'contabil';
  const adminAccountantId = isAdmin && selectedUserId && isContabilSelected ? selectedUserId : undefined;
  const adminOwnerId = isAdmin && selectedUserId && !isContabilSelected ? selectedUserId : undefined;

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await fetchDocuments({
        document_type: filterType || undefined,
        doc_status: filterStatus || undefined,
        owner_id: adminOwnerId,
        accountant_id: adminAccountantId,
        limit: 100,
      });
      setDocuments(data.documents); setTotal(data.total);
    } catch { setError(tr.loadError); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadDocuments(); }, [filterType, filterStatus, selectedUserId, selectedUserRole]);

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) return;
    setUploading(true);
    try {
      await uploadDocument({ file: uploadFile, title: uploadTitle, description: uploadDesc || undefined, document_type: uploadType });
      setToast({ message: tr.uploadSuccess, type: 'success' });
      setShowUpload(false); setUploadFile(null); setUploadTitle(''); setUploadDesc(''); setUploadType('altele');
      loadDocuments();
    } catch (e: any) { setToast({ message: e.message || tr.uploadError, type: 'error' }); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteDocument(id); setToast({ message: tr.deleteSuccess, type: 'success' }); loadDocuments(); }
    catch { setToast({ message: tr.deleteError, type: 'error' }); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) { setUploadFile(file); if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^/.]+$/, '')); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setUploadFile(file); if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^/.]+$/, '')); }
  };

  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || doc.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      aprobat: 'bg-green-100 text-green-700', verificat: 'bg-blue-100 text-blue-700',
      pending_approval: 'bg-yellow-100 text-yellow-700', requires_manual: 'bg-orange-100 text-orange-700',
      respins: 'bg-red-100 text-red-700', incarcat: 'bg-gray-100 text-gray-600',
      in_procesare: 'bg-purple-100 text-purple-700', duplicate_detected: 'bg-red-50 text-red-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString(locales[lang], { day: '2-digit', month: 'short', year: 'numeric' });
  const formatSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-[var(--color-neutral-100)] flex flex-col">
      <Navbar isLoggedIn showNavLinks={false} />
      <main className="flex-1 w-[85%] max-md:w-full mx-auto px-6 max-md:px-4 py-8">
        <div className="flex justify-between items-center mb-6 max-md:flex-col max-md:gap-4">
          <div>
            <h1 className="font-[var(--font-heading)] text-2xl font-bold text-[var(--color-primary)]">
              {isAdmin && selectedUserId
                ? isContabilSelected
                  ? 'Documentele clienților contabilului'
                  : 'Documentele clientului'
                : tr.myDocs}
            </h1>
            <p className="text-[var(--color-neutral-400)] text-sm mt-1">
              {total} {tr.docsCount}
              {isAdmin && !selectedUserId && ' (toți utilizatorii)'}
            </p>
          </div>
          {!isAdmin && (
            <button onClick={() => setShowUpload(true)} className="btn-gradient flex items-center gap-2 px-5 py-2.5 rounded-lg">
              <CloudUploadIcon fontSize="small" /> {tr.upload}
            </button>
          )}
        </div>

        {isAdmin && (
          <UserPicker
            selectedUserId={selectedUserId}
            onChange={(id, role) => { setSelectedUserId(id); setSelectedUserRole(role || null); }}
            roleFilter="non_admin"
            label="Vezi documentele unui client sau ale clienților unui contabil"
          />
        )}

        <div className="flex gap-3 mb-6 max-md:flex-col">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]" fontSize="small" />
            <input type="text" placeholder={tr.search} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--color-input-border)] bg-white focus:outline-none focus:border-[var(--color-primary)]" />
          </div>
          <div className="flex gap-2 max-md:flex-col">
            <div className="relative">
              <FilterListIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]" fontSize="small" />
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-lg border border-[var(--color-input-border)] bg-white focus:outline-none appearance-none cursor-pointer min-w-[160px] max-md:w-full">
                <option value="">{tr.allTypes}</option>
                {Object.entries(DOCUMENT_TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-[var(--color-input-border)] bg-white focus:outline-none appearance-none cursor-pointer min-w-[160px] max-md:w-full">
              <option value="">{tr.allStatuses}</option>
              {Object.entries(DOCUMENT_STATUSES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" /></div>
        ) : error ? (
          <p className="text-center text-red-500 py-10">{error}</p>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-20">
            <DescriptionIcon style={{ fontSize: 64 }} className="text-[var(--color-neutral-300)] mb-4" />
            <p className="text-[var(--color-neutral-400)] text-lg">
              {searchTerm || filterType || filterStatus ? tr.noDocsFiltered : tr.noDocsYet}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredDocs.map((doc) => (
              <div key={doc.id} className="bg-white rounded-lg border border-[var(--color-input-border)] p-4 flex items-center gap-4 max-md:flex-col max-md:items-start hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-bg)] flex items-center justify-center flex-shrink-0">
                  <DescriptionIcon className="text-[var(--color-accent)]" fontSize="small" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[var(--color-primary)] truncate">{doc.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[var(--color-neutral-400)] flex-wrap">
                    <span>{doc.file_name}</span>
                    <span>{formatSize(doc.file_size)}</span>
                    <span>{formatDate(doc.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
                  <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-accent-bg)] text-[var(--color-accent)]">{DOCUMENT_TYPES[doc.document_type] || doc.document_type}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(doc.status)}`}>{DOCUMENT_STATUSES[doc.status] || doc.status}</span>
                  {doc.urgency_score != null && doc.urgency_score > 50 && <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-600">Urgent: {Math.round(doc.urgency_score)}</span>}
                  <button onClick={() => handleDelete(doc.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--color-neutral-400)] hover:text-red-500 transition-colors cursor-pointer" title={tr.deleteTip}>
                    <DeleteOutlineIcon fontSize="small" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showUpload && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-[var(--color-primary)]">{tr.uploadTitle}</h2>
              <button onClick={() => setShowUpload(false)} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer"><CloseIcon /></button>
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-4 ${dragOver ? 'border-[var(--color-primary)] bg-[var(--color-accent-bg)]' : uploadFile ? 'border-green-400 bg-green-50' : 'border-[var(--color-input-border)] hover:border-[var(--color-primary)]'}`}
            >
              <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls,.doc,.docx" onChange={handleFileSelect} />
              <CloudUploadIcon style={{ fontSize: 40 }} className="text-[var(--color-neutral-300)] mb-2" />
              {uploadFile ? (
                <p className="text-sm text-green-600 font-medium">{uploadFile.name} ({formatSize(uploadFile.size)})</p>
              ) : (
                <>
                  <p className="text-sm text-[var(--color-neutral-400)]">{tr.dragDrop}</p>
                  <p className="text-xs text-[var(--color-neutral-300)] mt-1">{tr.fileTypes}</p>
                </>
              )}
            </div>
            <div className="space-y-3">
              <input type="text" placeholder={tr.titlePlaceholder} value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-input-border)] focus:outline-none focus:border-[var(--color-primary)]" />
              <textarea placeholder={tr.descPlaceholder} value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)} rows={2}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-input-border)] focus:outline-none focus:border-[var(--color-primary)] resize-none" />
              <select value={uploadType} onChange={(e) => setUploadType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-input-border)] focus:outline-none appearance-none cursor-pointer">
                {Object.entries(DOCUMENT_TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowUpload(false)} className="flex-1 py-2.5 rounded-lg border border-[var(--color-input-border)] text-[var(--color-neutral-500)] hover:bg-gray-50 cursor-pointer">{tr.cancel}</button>
              <button onClick={handleUpload} disabled={!uploadFile || !uploadTitle.trim() || uploading} className="btn-gradient flex-1 py-2.5 rounded-lg">{uploading ? tr.uploading : tr.uploadBtn}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <AlertToast title={toast.type === 'success' ? tr.success : tr.error} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <Footer showChat isLoggedIn />
    </div>
  );
};

export default Documents;

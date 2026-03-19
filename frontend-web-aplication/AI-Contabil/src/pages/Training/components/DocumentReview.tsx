/**
 * Document Review - Selectare document, vizualizare OCR, corecții.
 * Tailwind CSS only.
 */
import { useState, useEffect } from 'react';
import {
  fetchTrainingDocuments,
  fetchDocumentOcr,
  submitCorrection,
  confirmDocument,
  type TrainingDocument,
  type DocumentOcrData,
  type CorrectionPayload,
} from '../../../api/trainingApi';
import OcrOverlay from './OcrOverlay';
import EntityEditor from './EntityEditor';

export default function DocumentReview() {
  const [documents, setDocuments] = useState<TrainingDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentOcrData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingOcr, setLoadingOcr] = useState(false);
  const [corrections, setCorrections] = useState<CorrectionPayload>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      setLoading(true);
      const data = await fetchTrainingDocuments();
      setDocuments(data.documents);
    } catch {
      setMessage('Eroare la încărcarea documentelor');
    } finally {
      setLoading(false);
    }
  }

  async function selectDocument(docId: string) {
    try {
      setLoadingOcr(true);
      setMessage('');
      setCorrections({});
      const data = await fetchDocumentOcr(docId);
      setSelectedDoc(data);
    } catch {
      setMessage('Eroare la încărcarea datelor OCR');
    } finally {
      setLoadingOcr(false);
    }
  }

  async function handleConfirm() {
    if (!selectedDoc) return;
    try {
      setSaving(true);
      await confirmDocument(selectedDoc.document.id);
      setMessage('Document confirmat ca corect! Exemplu de antrenare salvat.');
      setSelectedDoc(null);
      loadDocuments();
    } catch {
      setMessage('Eroare la confirmare');
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitCorrections() {
    if (!selectedDoc) return;
    const hasCorrections =
      corrections.document_type || corrections.fields || corrections.urgency_feedback;
    if (!hasCorrections) {
      setMessage('Nu ai adăugat nicio corecție');
      return;
    }
    try {
      setSaving(true);
      await submitCorrection(selectedDoc.document.id, corrections);
      setMessage('Corecții salvate! Exemplu de antrenare creat.');
      setSelectedDoc(null);
      setCorrections({});
      loadDocuments();
    } catch {
      setMessage('Eroare la salvarea corecțiilor');
    } finally {
      setSaving(false);
    }
  }

  function getConfidenceColor(conf: number | null): string {
    if (!conf) return 'text-neutral-400';
    if (conf >= 0.9) return 'text-green-600';
    if (conf >= 0.75) return 'text-amber-600';
    return 'text-red-600';
  }

  return (
    <div className="animate-fade-in">
      {message && (
        <div className="mb-4 p-3 rounded-lg bg-blue-50 text-blue-700 text-sm flex items-center justify-between">
          {message}
          <button onClick={() => setMessage('')} className="text-blue-400 hover:text-blue-700">
            ✕
          </button>
        </div>
      )}

      {!selectedDoc ? (
        /* === Document List === */
        <div>
          <h3 className="font-semibold text-neutral-black mb-4">
            Selectează un document pentru revizie
          </h3>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <p className="text-lg">Niciun document procesat</p>
              <p className="text-sm mt-1">Încarcă documente scanate pentru a începe antrenarea</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => selectDocument(doc.id)}
                  className="w-full flex items-center gap-4 p-4 border border-neutral-200 rounded-lg hover:border-primary hover:bg-blue-50/30 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-lg shrink-0">
                    {doc.document_type === 'factura' ? '🧾' :
                     doc.document_type === 'chitanta' ? '🧾' :
                     doc.document_type === 'contract' ? '📄' :
                     doc.document_type === 'declaratie' ? '📋' : '📎'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-black truncate">{doc.file_name}</p>
                    <p className="text-xs text-neutral-400">
                      {doc.document_type} • {new Date(doc.created_at).toLocaleDateString('ro-RO')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {doc.avg_ocr_confidence !== null && (
                      <span className={`text-sm font-medium ${getConfidenceColor(doc.avg_ocr_confidence)}`}>
                        {(doc.avg_ocr_confidence * 100).toFixed(0)}%
                      </span>
                    )}
                    {doc.has_flagged_fields && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        Necesită revizie
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      doc.status === 'aprobat' ? 'bg-green-100 text-green-700' :
                      doc.status === 'respins' ? 'bg-red-100 text-red-700' :
                      'bg-neutral-100 text-neutral-600'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* === OCR Review View === */
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => { setSelectedDoc(null); setCorrections({}); }}
              className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-black transition-colors"
            >
              ← Înapoi la listă
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={handleConfirm}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Se salvează...' : 'Totul e corect ✓'}
              </button>
              <button
                onClick={handleSubmitCorrections}
                disabled={saving}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors disabled:opacity-50"
              >
                {saving ? 'Se salvează...' : 'Salvează Corecțiile'}
              </button>
            </div>
          </div>

          {loadingOcr ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {/* Left: Image + OCR Overlay */}
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200 flex items-center justify-between">
                  <h4 className="font-medium text-sm text-neutral-black">
                    Imagine + OCR Overlay
                  </h4>
                  <span className={`text-xs font-medium ${getConfidenceColor(selectedDoc.ocr.avg_confidence)}`}>
                    Confidence: {(selectedDoc.ocr.avg_confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <OcrOverlay
                  imagePath={selectedDoc.document.file_path}
                  blocks={selectedDoc.ocr.blocks}
                />
              </div>

              {/* Right: Document Info + Entities + Corrections */}
              <div className="space-y-4">
                {/* Document Info */}
                <div className="border border-neutral-200 rounded-lg p-4">
                  <h4 className="font-medium text-sm text-neutral-black mb-3">
                    Clasificare Document
                  </h4>
                  <div className="flex items-center gap-3 mb-3">
                    <select
                      value={corrections.document_type || selectedDoc.document.document_type}
                      onChange={(e) =>
                        setCorrections((prev) => ({ ...prev, document_type: e.target.value }))
                      }
                      className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                    >
                      <option value="factura">Factură</option>
                      <option value="chitanta">Chitanță</option>
                      <option value="contract">Contract</option>
                      <option value="extras_bancar">Extras Bancar</option>
                      <option value="bon_fiscal">Bon Fiscal</option>
                      <option value="declaratie">Declarație</option>
                      <option value="act_constitutiv">Act Constitutiv</option>
                      <option value="certificat">Certificat</option>
                      <option value="proces_verbal">Proces Verbal</option>
                      <option value="stat_plata">Stat de Plată</option>
                      <option value="altele">Altele</option>
                    </select>
                    {selectedDoc.document.document_type_confidence && (
                      <span className={`text-sm ${getConfidenceColor(selectedDoc.document.document_type_confidence)}`}>
                        {(selectedDoc.document.document_type_confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  {/* Urgency feedback */}
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">
                      Urgență: {selectedDoc.document.urgency_score?.toFixed(0) ?? '—'}/100
                    </p>
                    <div className="flex gap-2">
                      {(['too_high', 'correct', 'too_low'] as const).map((fb) => (
                        <button
                          key={fb}
                          onClick={() => setCorrections((prev) => ({ ...prev, urgency_feedback: fb }))}
                          className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                            corrections.urgency_feedback === fb
                              ? 'bg-primary text-white border-primary'
                              : 'border-neutral-300 text-neutral-500 hover:border-primary'
                          }`}
                        >
                          {fb === 'too_high' ? 'Prea mare' : fb === 'correct' ? 'Corect' : 'Prea mic'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Extracted Fields */}
                <EntityEditor
                  fields={selectedDoc.extracted_fields}
                  onFieldChange={(fieldName, value) => {
                    setCorrections((prev) => ({
                      ...prev,
                      fields: { ...prev.fields, [fieldName]: value },
                    }));
                  }}
                  corrections={corrections.fields || {}}
                />

                {/* OCR Text */}
                <div className="border border-neutral-200 rounded-lg p-4">
                  <h4 className="font-medium text-sm text-neutral-black mb-2">
                    Text Extras (complet)
                  </h4>
                  <pre className="text-xs text-neutral-600 whitespace-pre-wrap max-h-[200px] overflow-y-auto bg-neutral-50 p-3 rounded">
                    {selectedDoc.ocr.text || 'Niciun text extras'}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Entity Editor - Editare inline a câmpurilor extrase.
 * Arată fiecare câmp cu:
 * - Numele câmpului (invoice_num, date, vendor, etc.)
 * - Valoarea extrasă de AI
 * - Confidence (heatmap color)
 * - Input de corecție
 * - Buton confirm/edit
 *
 * Tailwind CSS only.
 */
import { useState } from 'react';
import type { ExtractedField } from '../../../api/trainingApi';

interface EntityEditorProps {
  fields: ExtractedField[];
  corrections: Record<string, string>;
  onFieldChange: (fieldName: string, value: string) => void;
}

const FIELD_LABELS: Record<string, string> = {
  invoice_num: 'Nr. Factură',
  date: 'Data',
  vendor: 'Furnizor',
  cui: 'CUI / CIF',
  amount: 'Sumă',
  vat: 'TVA',
  total: 'Total',
  iban: 'IBAN',
};

const FIELD_ICONS: Record<string, string> = {
  invoice_num: '#️⃣',
  date: '📅',
  vendor: '🏢',
  cui: '🆔',
  amount: '💰',
  vat: '📊',
  total: '💵',
  iban: '🏦',
};

const ALL_FIELD_TYPES = [
  'invoice_num', 'date', 'vendor', 'cui', 'amount', 'vat', 'total', 'iban',
];

export default function EntityEditor({ fields, corrections, onFieldChange }: EntityEditorProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldType, setNewFieldType] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  const existingFieldNames = new Set(fields.map((f) => f.field_name));
  const missingFields = ALL_FIELD_TYPES.filter((f) => !existingFieldNames.has(f));

  function getConfidenceStyle(confidence: number): string {
    if (confidence >= 0.9) return 'bg-green-50 border-green-200';
    if (confidence >= 0.75) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  }

  function getConfidenceBadge(confidence: number): string {
    if (confidence >= 0.9) return 'bg-green-100 text-green-700';
    if (confidence >= 0.75) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  }

  function handleAddField() {
    if (newFieldType && newFieldValue) {
      onFieldChange(newFieldType, newFieldValue);
      setNewFieldType('');
      setNewFieldValue('');
      setShowAddField(false);
    }
  }

  return (
    <div className="border border-neutral-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-sm text-neutral-black">
          Câmpuri Extrase ({fields.length})
        </h4>
        {missingFields.length > 0 && (
          <button
            onClick={() => setShowAddField(!showAddField)}
            className="text-xs text-primary hover:underline"
          >
            + Adaugă câmp lipsă
          </button>
        )}
      </div>

      {fields.length === 0 ? (
        <p className="text-sm text-neutral-400 py-4 text-center">
          Niciun câmp extras. Adaugă manual câmpurile din document.
        </p>
      ) : (
        <div className="space-y-2">
          {fields.map((field) => {
            const isEditing = editingField === field.field_name;
            const hasCorrected = field.field_name in corrections;
            const displayValue = hasCorrected ? corrections[field.field_name] : field.value;

            return (
              <div
                key={field.id}
                className={`rounded-lg border p-3 transition-all ${
                  hasCorrected
                    ? 'bg-blue-50 border-blue-200'
                    : field.is_flagged
                    ? 'bg-red-50 border-red-200'
                    : getConfidenceStyle(field.confidence)
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {FIELD_ICONS[field.field_name] || '📝'}
                    </span>
                    <span className="text-xs font-medium text-neutral-700">
                      {FIELD_LABELS[field.field_name] || field.field_name}
                    </span>
                    {field.is_flagged && (
                      <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                        Nesigur
                      </span>
                    )}
                    {field.was_corrected && (
                      <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">
                        Corectat anterior
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getConfidenceBadge(field.confidence)}`}>
                    {(field.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      defaultValue={displayValue}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onFieldChange(field.field_name, (e.target as HTMLInputElement).value);
                          setEditingField(null);
                        }
                        if (e.key === 'Escape') setEditingField(null);
                      }}
                      className="flex-1 text-sm border border-primary rounded px-2 py-1 outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      onClick={() => setEditingField(null)}
                      className="text-xs text-neutral-400 hover:text-neutral-600"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-neutral-black font-mono">
                      {displayValue}
                      {hasCorrected && field.value !== corrections[field.field_name] && (
                        <span className="text-xs text-neutral-400 line-through ml-2">
                          {field.value}
                        </span>
                      )}
                    </p>
                    <button
                      onClick={() => setEditingField(field.field_name)}
                      className="text-xs text-primary hover:underline shrink-0 ml-2"
                    >
                      Editează
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Missing Field */}
      {showAddField && (
        <div className="mt-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
          <p className="text-xs font-medium text-neutral-600 mb-2">Adaugă câmp lipsă</p>
          <div className="flex items-center gap-2">
            <select
              value={newFieldType}
              onChange={(e) => setNewFieldType(e.target.value)}
              className="text-sm border border-neutral-300 rounded px-2 py-1.5 outline-none focus:border-primary"
            >
              <option value="">Selectează...</option>
              {missingFields.map((f) => (
                <option key={f} value={f}>
                  {FIELD_LABELS[f] || f}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Valoare..."
              value={newFieldValue}
              onChange={(e) => setNewFieldValue(e.target.value)}
              className="flex-1 text-sm border border-neutral-300 rounded px-2 py-1.5 outline-none focus:border-primary"
            />
            <button
              onClick={handleAddField}
              disabled={!newFieldType || !newFieldValue}
              className="px-3 py-1.5 bg-primary text-white text-sm rounded hover:bg-primary-light transition-colors disabled:opacity-40"
            >
              Adaugă
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

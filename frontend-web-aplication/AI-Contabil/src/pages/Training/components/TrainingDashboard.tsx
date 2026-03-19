/**
 * Training Dashboard - Statistici, modele active, progres antrenare.
 * Tailwind CSS only.
 */
import { useState, useEffect } from 'react';
import { fetchTrainingStats, type TrainingStats } from '../../../api/trainingApi';

export default function TrainingDashboard() {
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      const data = await fetchTrainingStats();
      setStats(data);
    } catch (e) {
      setError('Nu s-au putut încărca statisticile');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
        {error}
      </div>
    );
  }

  if (!stats) return null;

  const progressClassifier = Math.min(
    (stats.type_corrections / stats.min_required_for_training) * 100,
    100,
  );
  const progressNER = Math.min(
    (stats.entity_corrections / stats.min_required_for_training) * 100,
    100,
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Documente Procesate"
          value={stats.processed_documents}
          color="bg-blue-50 text-blue-700"
        />
        <StatCard
          label="Exemple Antrenare"
          value={stats.total_examples}
          sub={`${stats.unused_examples} nefolosite`}
          color="bg-green-50 text-green-700"
        />
        <StatCard
          label="Corecții Clasificare"
          value={stats.type_corrections}
          color="bg-amber-50 text-amber-700"
        />
        <StatCard
          label="Confidence Mediu OCR"
          value={`${(stats.avg_ocr_confidence * 100).toFixed(1)}%`}
          color="bg-purple-50 text-purple-700"
        />
      </div>

      {/* Training Progress */}
      <div className="grid grid-cols-2 gap-6">
        <div className="border border-neutral-200 rounded-lg p-6">
          <h3 className="font-semibold text-neutral-black mb-4">
            Progres Antrenare - Clasificator
          </h3>
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-neutral-500">Corecții acumulate</span>
            <span className="font-medium">
              {stats.type_corrections} / {stats.min_required_for_training}
            </span>
          </div>
          <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.can_retrain_classifier ? 'bg-green-500' : 'bg-amber-500'
              }`}
              style={{ width: `${progressClassifier}%` }}
            />
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            {stats.can_retrain_classifier
              ? 'Gata pentru re-antrenare!'
              : `Mai sunt necesare ${stats.min_required_for_training - stats.type_corrections} corecții`}
          </p>
          {stats.can_retrain_classifier && (
            <button className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors">
              Lansează Antrenare
            </button>
          )}
        </div>

        <div className="border border-neutral-200 rounded-lg p-6">
          <h3 className="font-semibold text-neutral-black mb-4">
            Progres Antrenare - Extractor Entități (NER)
          </h3>
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-neutral-500">Corecții câmpuri</span>
            <span className="font-medium">
              {stats.entity_corrections} / {stats.min_required_for_training}
            </span>
          </div>
          <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.can_retrain_ner ? 'bg-green-500' : 'bg-amber-500'
              }`}
              style={{ width: `${progressNER}%` }}
            />
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            {stats.can_retrain_ner
              ? 'Gata pentru re-antrenare!'
              : `Mai sunt necesare ${stats.min_required_for_training - stats.entity_corrections} corecții`}
          </p>
        </div>
      </div>

      {/* Active Models */}
      <div className="border border-neutral-200 rounded-lg p-6">
        <h3 className="font-semibold text-neutral-black mb-4">Modele Active</h3>
        {stats.active_models.length === 0 ? (
          <div className="text-center py-8 text-neutral-400">
            <p className="text-lg mb-2">Niciun model antrenat încă</p>
            <p className="text-sm">
              Începe prin a revizui documente și a corecta erorile AI-ului.
              După 50 de corecții, poți lansa prima antrenare.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.active_models.map((model, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg"
              >
                <div>
                  <span className="font-medium text-neutral-black">{model.name}</span>
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    v{model.version}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-sm text-neutral-500">
                  {model.accuracy && (
                    <span>
                      Acuratețe:{' '}
                      <strong className="text-neutral-black">
                        {(model.accuracy.accuracy * 100).toFixed(1)}%
                      </strong>
                    </span>
                  )}
                  <span>{model.dataset_size} exemple</span>
                  <span>{new Date(model.training_date).toLocaleDateString('ro-RO')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: number | string;
  sub?: string;
  color: string;
}) {
  return (
    <div className={`rounded-lg p-5 ${color}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
    </div>
  );
}

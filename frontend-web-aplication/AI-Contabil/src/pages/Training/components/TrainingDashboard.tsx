import { useState, useEffect } from 'react';
import { fetchTrainingStats, type TrainingStats } from '../../../api/trainingApi';
import { useLanguage } from '../../../context/LanguageContext';
import type { Lang } from '../../../context/LanguageContext';

const t: Record<Lang, {
  loadError: string; processedDocs: string; trainingExamples: string; unused: string;
  classCorrections: string; avgOcrConf: string; classifierProgress: string;
  accumulatedCorr: string; readyRetrain: string; moreNeeded: string; startTraining: string;
  nerProgress: string; fieldCorr: string; activeModels: string; noModels: string;
  noModelsDesc: string; accuracy: string; examples: string;
}> = {
  ro: {
    loadError: 'Nu s-au putut incarca statisticile', processedDocs: 'Documente procesate',
    trainingExamples: 'Exemple antrenare', unused: 'nefolosite',
    classCorrections: 'Corectii clasificare', avgOcrConf: 'Confidence mediu OCR',
    classifierProgress: 'Progres antrenare — Clasificator', accumulatedCorr: 'Corectii acumulate',
    readyRetrain: 'Gata pentru re-antrenare!', moreNeeded: 'Mai sunt necesare {n} corectii',
    startTraining: 'Lanseaza antrenare', nerProgress: 'Progres antrenare — Extractor entitati (NER)',
    fieldCorr: 'Corectii campuri', activeModels: 'Modele active', noModels: 'Niciun model antrenat inca',
    noModelsDesc: 'Incepe prin a revizui documente si a corecta erorile AI-ului. Dupa 50 de corectii, poti lansa prima antrenare.',
    accuracy: 'Acuratete:', examples: 'exemple',
  },
  en: {
    loadError: 'Could not load statistics', processedDocs: 'Processed Documents',
    trainingExamples: 'Training Examples', unused: 'unused',
    classCorrections: 'Classification Corrections', avgOcrConf: 'Average OCR Confidence',
    classifierProgress: 'Training Progress — Classifier', accumulatedCorr: 'Accumulated corrections',
    readyRetrain: 'Ready for retraining!', moreNeeded: '{n} more corrections needed',
    startTraining: 'Start Training', nerProgress: 'Training Progress — Entity Extractor (NER)',
    fieldCorr: 'Field corrections', activeModels: 'Active Models', noModels: 'No trained models yet',
    noModelsDesc: 'Start by reviewing documents and correcting AI errors. After 50 corrections, you can start the first training.',
    accuracy: 'Accuracy:', examples: 'examples',
  },
  ru: {
    loadError: 'Не удалось загрузить статистику', processedDocs: 'Обработанные документы',
    trainingExamples: 'Примеры обучения', unused: 'неиспользованных',
    classCorrections: 'Коррекции классификации', avgOcrConf: 'Средняя уверенность OCR',
    classifierProgress: 'Прогресс обучения — Классификатор', accumulatedCorr: 'Накопленные коррекции',
    readyRetrain: 'Готово к переобучению!', moreNeeded: 'Необходимо ещё {n} коррекций',
    startTraining: 'Начать обучение', nerProgress: 'Прогресс обучения — Извлечение сущностей (NER)',
    fieldCorr: 'Коррекции полей', activeModels: 'Активные модели', noModels: 'Обученных моделей пока нет',
    noModelsDesc: 'Начните с проверки документов и исправления ошибок ИИ. После 50 коррекций вы сможете начать первое обучение.',
    accuracy: 'Точность:', examples: 'примеров',
  },
};

const locales: Record<Lang, string> = { ro: 'ro-RO', en: 'en-US', ru: 'ru-RU' };

export default function TrainingDashboard() {
  const { lang } = useLanguage();
  const tr = t[lang];
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadStats(); }, []);

  async function loadStats() {
    try { setLoading(true); const data = await fetchTrainingStats(); setStats(data); }
    catch { setError(tr.loadError); }
    finally { setLoading(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">{error}</div>;
  if (!stats) return null;

  const progressClassifier = Math.min((stats.type_corrections / stats.min_required_for_training) * 100, 100);
  const progressNER = Math.min((stats.entity_corrections / stats.min_required_for_training) * 100, 100);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-4 max-md:grid-cols-2 gap-4">
        <StatCard label={tr.processedDocs} value={stats.processed_documents} color="bg-blue-50 text-blue-700" />
        <StatCard label={tr.trainingExamples} value={stats.total_examples} sub={`${stats.unused_examples} ${tr.unused}`} color="bg-green-50 text-green-700" />
        <StatCard label={tr.classCorrections} value={stats.type_corrections} color="bg-amber-50 text-amber-700" />
        <StatCard label={tr.avgOcrConf} value={`${(stats.avg_ocr_confidence * 100).toFixed(1)}%`} color="bg-purple-50 text-purple-700" />
      </div>

      <div className="grid grid-cols-2 max-md:grid-cols-1 gap-6">
        <div className="border border-neutral-200 rounded-lg p-6">
          <h3 className="font-semibold text-neutral-black mb-4">{tr.classifierProgress}</h3>
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-neutral-500">{tr.accumulatedCorr}</span>
            <span className="font-medium">{stats.type_corrections} / {stats.min_required_for_training}</span>
          </div>
          <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${stats.can_retrain_classifier ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${progressClassifier}%` }} />
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            {stats.can_retrain_classifier ? tr.readyRetrain : tr.moreNeeded.replace('{n}', String(stats.min_required_for_training - stats.type_corrections))}
          </p>
          {stats.can_retrain_classifier && <button className="btn-gradient mt-4 px-4 py-2 rounded-lg text-sm">{tr.startTraining}</button>}
        </div>

        <div className="border border-neutral-200 rounded-lg p-6">
          <h3 className="font-semibold text-neutral-black mb-4">{tr.nerProgress}</h3>
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-neutral-500">{tr.fieldCorr}</span>
            <span className="font-medium">{stats.entity_corrections} / {stats.min_required_for_training}</span>
          </div>
          <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${stats.can_retrain_ner ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${progressNER}%` }} />
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            {stats.can_retrain_ner ? tr.readyRetrain : tr.moreNeeded.replace('{n}', String(stats.min_required_for_training - stats.entity_corrections))}
          </p>
        </div>
      </div>

      <div className="border border-neutral-200 rounded-lg p-6">
        <h3 className="font-semibold text-neutral-black mb-4">{tr.activeModels}</h3>
        {stats.active_models.length === 0 ? (
          <div className="text-center py-8 text-neutral-400">
            <p className="text-lg mb-2">{tr.noModels}</p>
            <p className="text-sm">{tr.noModelsDesc}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.active_models.map((model, i) => (
              <div key={i} className="flex items-center justify-between max-md:flex-col max-md:items-start max-md:gap-2 p-4 bg-neutral-50 rounded-lg">
                <div>
                  <span className="font-medium text-neutral-black">{model.name}</span>
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">v{model.version}</span>
                </div>
                <div className="flex items-center gap-6 max-md:gap-3 text-sm text-neutral-500">
                  {model.accuracy && <span>{tr.accuracy} <strong className="text-neutral-black">{(model.accuracy.accuracy * 100).toFixed(1)}%</strong></span>}
                  <span>{model.dataset_size} {tr.examples}</span>
                  <span>{new Date(model.training_date).toLocaleDateString(locales[lang])}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color: string }) {
  return (
    <div className={`rounded-lg p-5 ${color}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
    </div>
  );
}

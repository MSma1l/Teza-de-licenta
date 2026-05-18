import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import type { Lang } from '../../../context/LanguageContext';

interface Stage {
  number: string;
  text: string;
  image: string;
}

const stages: Record<Lang, {
  title: string;
  button: string;
  steps: Stage[];
}> = {
  ro: {
    title: 'Etapele crearii unui document',
    button: 'Creaza document',
    steps: [
      { number: '01', text: 'Selectarea tipului de document', image: '/instructions/screen-1.svg' },
      { number: '02', text: 'Introducerea datelor necesare si scanarea documentului cu aplicatia mobila', image: '/instructions/screen-2.svg' },
      { number: '03', text: 'Confirmarea si validarea datelor cu aplicatia mobila', image: '/instructions/screen-3.svg' },
      { number: '04', text: 'Generarea actului si programarea la oficiu pentru semnatura', image: '/instructions/screen-4.svg' },
      { number: '05', text: 'Cererea a fost trimisa cu succes', image: '/instructions/screen-5.svg' },
    ],
  },
  en: {
    title: 'Stages of creating a document',
    button: 'Create document',
    steps: [
      { number: '01', text: 'Select the type of document', image: '/instructions/screen-1.svg' },
      { number: '02', text: 'Enter the necessary data and scan the document with the mobile app', image: '/instructions/screen-2.svg' },
      { number: '03', text: 'Confirmation and validation of data with the mobile app', image: '/instructions/screen-3.svg' },
      { number: '04', text: 'Generation of the act and scheduling at the office for signature', image: '/instructions/screen-4.svg' },
      { number: '05', text: 'The request was sent successfully', image: '/instructions/screen-5.svg' },
    ],
  },
  ru: {
    title: 'Этапы создания документа',
    button: 'Создать документ',
    steps: [
      { number: '01', text: 'Выбор типа документа', image: '/instructions/screen-1.svg' },
      { number: '02', text: 'Ввод необходимых данных и сканирование документа через мобильное приложение', image: '/instructions/screen-2.svg' },
      { number: '03', text: 'Подтверждение и проверка данных через мобильное приложение', image: '/instructions/screen-3.svg' },
      { number: '04', text: 'Генерация акта и запись в офис для подписи', image: '/instructions/screen-4.svg' },
      { number: '05', text: 'Запрос успешно отправлен', image: '/instructions/screen-5.svg' },
    ],
  },
};

const StagesSection = () => {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = stages[lang];
  const current = t.steps[activeStep];

  return (
    <section className="px-8 py-16 border-t border-neutral-200">
      <h2 className="font-heading text-[2.2rem] font-semibold text-neutral-black mb-10 leading-[1.3]">
        {t.title}
      </h2>

      <div className="grid grid-cols-[1fr_1.6fr] max-md:grid-cols-1 gap-10 items-start">
        {/* Steps list */}
        <div className="flex flex-col">
          <div className="flex flex-col gap-1">
            {t.steps.map((stage, index) => (
              <div
                key={stage.number}
                className={`flex items-start gap-4 px-5 py-4 rounded-xl cursor-pointer transition-all duration-300 border-l-[3px] ${
                  activeStep === index
                    ? 'bg-gradient-to-r from-[#4f46e5]/8 to-transparent border-l-[#4f46e5] shadow-sm'
                    : 'border-transparent hover:bg-neutral-50'
                }`}
                onClick={() => setActiveStep(index)}
              >
                <span className={`text-lg font-bold min-w-[32px] transition-colors duration-200 ${
                  activeStep === index ? 'text-[#4f46e5]' : 'text-neutral-400'
                }`}>
                  {stage.number}
                </span>
                <span className={`text-base leading-relaxed transition-all duration-200 ${
                  activeStep === index ? 'text-neutral-black font-semibold' : 'text-neutral-600'
                }`}>
                  {stage.text}
                </span>
              </div>
            ))}
          </div>

          <button
            className="btn-gradient mt-8 px-8 py-3.5 rounded-full text-base font-bold self-start"
            onClick={() => navigate('/documents')}
          >
            {t.button}
          </button>
        </div>

        {/* Screenshot preview - desktop-like frame */}
        <div className="w-full max-md:mt-4" key={activeStep}>
          <div className="rounded-xl overflow-hidden border border-neutral-200 shadow-xl bg-white animate-stage-fade">
            {/* Browser bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-neutral-100 border-b border-neutral-200">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-white rounded-md px-3 py-1 text-xs text-neutral-400 font-mono border border-neutral-200 max-w-[300px]">
                  ai-contabil.md
                </div>
              </div>
            </div>
            {/* Screenshot image */}
            <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
              {/* Fallback placeholder — pe fundal. Apare doar daca imaginea nu se incarca. */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#eef2ff] to-[#e0f2fe] z-0">
                <span className="font-heading text-[4rem] font-bold text-[#4f46e5]/10">
                  {current.number}
                </span>
                <span className="text-sm text-neutral-400 font-medium mt-2 px-8 text-center">
                  {current.text}
                </span>
              </div>
              <img
                src={current.image}
                alt={current.text}
                className="absolute inset-0 w-full h-full object-cover object-top z-10"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StagesSection;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useLanguage } from '../../../context/LanguageContext';
import type { Lang } from '../../../context/LanguageContext';

interface DocCard {
  icon: React.ReactNode;
  name: string;
  description: string;
  items: string[];
  color: string;
}

const t: Record<Lang, {
  label: string;
  title: string;
  subtitle: string;
  button: string;
  allDocs: string;
  cards: DocCard[];
}> = {
  ro: {
    label: 'Documente',
    title: 'Rapoartele si documentele esentiale',
    subtitle: 'Top 3 documente contabile pe care AI-Contabil le genereaza automat pentru afacerea ta',
    button: 'Vezi toate documentele',
    allDocs: 'Toate documentele generate',
    cards: [
      {
        icon: <ReceiptLongOutlinedIcon />,
        name: 'Factura fiscala',
        description: 'Document principal pentru operatiunile comerciale',
        color: '#4f46e5',
        items: [
          'Denumirea si IDNO furnizor / cumparator',
          'Data emiterii si numarul facturii',
          'Lista bunurilor / serviciilor prestate',
          'Pretul unitar, cantitatea, suma totala',
          'Cota si suma TVA',
          'Semnatura digitala si stampila',
        ],
      },
      {
        icon: <AssessmentOutlinedIcon />,
        name: 'Raport financiar',
        description: 'Situatia financiara completa a companiei',
        color: '#0ea5e9',
        items: [
          'Bilantul contabil (active si pasive)',
          'Raportul de profit si pierderi',
          'Fluxul de numerar pe perioade',
          'Declaratia privind capitalul propriu',
          'Note explicative la rapoarte',
          'Indicatori financiari cheie',
        ],
      },
      {
        icon: <DescriptionOutlinedIcon />,
        name: 'Declaratie fiscala',
        description: 'Documente obligatorii catre Serviciul Fiscal',
        color: '#8b5cf6',
        items: [
          'Declaratia privind impozitul pe venit (Forma VEN)',
          'Declaratia TVA (Forma TVA)',
          'Darea de seama privind retinerea impozitului',
          'Raportul contributiilor sociale (BASS)',
          'Raportul primelor de asigurare medicala',
          'Declaratia privind impozitul pe bunuri imobiliare',
        ],
      },
    ],
  },
  en: {
    label: 'Documents',
    title: 'Essential reports and documents',
    subtitle: 'Top 3 accounting documents that AI-Contabil generates automatically for your business',
    button: 'View all documents',
    allDocs: 'All generated documents',
    cards: [
      {
        icon: <ReceiptLongOutlinedIcon />,
        name: 'Tax Invoice',
        description: 'Primary document for commercial operations',
        color: '#4f46e5',
        items: [
          'Supplier / buyer name and Tax ID',
          'Issue date and invoice number',
          'List of goods / services provided',
          'Unit price, quantity, total amount',
          'VAT rate and amount',
          'Digital signature and stamp',
        ],
      },
      {
        icon: <AssessmentOutlinedIcon />,
        name: 'Financial Report',
        description: 'Complete financial statement of the company',
        color: '#0ea5e9',
        items: [
          'Balance sheet (assets and liabilities)',
          'Profit and loss statement',
          'Cash flow by periods',
          'Equity statement',
          'Explanatory notes to reports',
          'Key financial indicators',
        ],
      },
      {
        icon: <DescriptionOutlinedIcon />,
        name: 'Tax Declaration',
        description: 'Mandatory documents to the Tax Service',
        color: '#8b5cf6',
        items: [
          'Income tax declaration (VEN Form)',
          'VAT declaration (TVA Form)',
          'Tax withholding report',
          'Social contributions report (BASS)',
          'Medical insurance premiums report',
          'Real estate tax declaration',
        ],
      },
    ],
  },
  ru: {
    label: 'Документы',
    title: 'Основные отчёты и документы',
    subtitle: 'Топ-3 бухгалтерских документа, которые AI-Contabil генерирует автоматически для вашего бизнеса',
    button: 'Смотреть все документы',
    allDocs: 'Все генерируемые документы',
    cards: [
      {
        icon: <ReceiptLongOutlinedIcon />,
        name: 'Налоговая накладная',
        description: 'Основной документ для коммерческих операций',
        color: '#4f46e5',
        items: [
          'Наименование и IDNO поставщика / покупателя',
          'Дата выдачи и номер накладной',
          'Список товаров / оказанных услуг',
          'Цена за единицу, количество, общая сумма',
          'Ставка и сумма НДС',
          'Электронная подпись и печать',
        ],
      },
      {
        icon: <AssessmentOutlinedIcon />,
        name: 'Финансовый отчёт',
        description: 'Полная финансовая отчётность компании',
        color: '#0ea5e9',
        items: [
          'Бухгалтерский баланс (активы и пассивы)',
          'Отчёт о прибылях и убытках',
          'Движение денежных средств по периодам',
          'Отчёт о собственном капитале',
          'Пояснительные записки к отчётам',
          'Ключевые финансовые показатели',
        ],
      },
      {
        icon: <DescriptionOutlinedIcon />,
        name: 'Налоговая декларация',
        description: 'Обязательные документы в Налоговую службу',
        color: '#8b5cf6',
        items: [
          'Декларация о подоходном налоге (Форма VEN)',
          'Декларация НДС (Форма TVA)',
          'Отчёт об удержании налога',
          'Отчёт по социальным взносам (BASS)',
          'Отчёт по медицинскому страхованию',
          'Декларация по налогу на недвижимость',
        ],
      },
    ],
  },
};

const DocumentsSection = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const tr = t[lang];
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <section id="documents" className="py-16 border-t border-neutral-200">
      <div className="text-center mb-12">
        <span
          className="inline-block text-sm font-semibold mb-3"
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {tr.label}
        </span>

        <h2 className="font-heading text-[2.2rem] font-semibold text-neutral-black mb-3">
          {tr.title}
        </h2>

        <p className="text-lg text-neutral-600 mb-8 max-w-[650px] mx-auto">
          {tr.subtitle}
        </p>

        <button
          className="btn-gradient px-8 py-3.5 rounded-full text-base font-bold"
          onClick={() => navigate('/documents')}
        >
          {tr.button} <ArrowForwardIcon style={{ fontSize: 18, marginLeft: 4 }} />
        </button>
      </div>

      <div className="grid grid-cols-3 max-md:grid-cols-1 gap-6">
        {tr.cards.map((card, index) => (
          <div
            key={index}
            className="relative rounded-2xl border border-neutral-200 bg-white overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl group"
            onMouseEnter={() => setHoveredCard(index)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            {/* Top color bar */}
            <div
              className="h-1.5 transition-all duration-300"
              style={{
                background: hoveredCard === index
                  ? `linear-gradient(90deg, ${card.color}, ${card.color}88)`
                  : '#e5e7eb',
              }}
            />

            <div className="p-7">
              {/* Icon + title */}
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center [&_svg]:text-white transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `linear-gradient(135deg, ${card.color}, ${card.color}99)` }}
                >
                  {card.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-black">{card.name}</h3>
                  <p className="text-sm text-neutral-500">{card.description}</p>
                </div>
              </div>

              {/* Items list */}
              <div className="flex flex-col gap-3 mt-5">
                {card.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-start gap-3">
                    <CheckCircleOutlineIcon
                      style={{ fontSize: 18, color: card.color, marginTop: 2, flexShrink: 0 }}
                    />
                    <span className="text-[15px] text-neutral-700 leading-snug">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default DocumentsSection;

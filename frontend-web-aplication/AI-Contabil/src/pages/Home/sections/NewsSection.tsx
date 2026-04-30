import { useRef, useEffect, useState } from 'react';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useLanguage } from '../../../context/LanguageContext';
import type { Lang } from '../../../context/LanguageContext';
import { fetchPublicContent, type PublicContent } from '../../../api/publicContentApi';

interface NewsItem {
  title: string;
  summary: string;
  date: string;
  tag: string;
  color: string;
}

const t: Record<Lang, {
  label: string;
  title: string;
  subtitle: string;
  readMore: string;
  allNews: string;
  items: NewsItem[];
}> = {
  ro: {
    label: 'Noutati',
    title: 'Noutati din lumea contabilitatii',
    subtitle: 'Ultimele modificari legislative, noutati fiscale si actualizari importante pentru afacerea ta',
    readMore: 'Citeste mai mult',
    allNews: 'Toate noutatile',
    items: [
      {
        title: 'Modificari la Codul Fiscal 2026: ce trebuie sa stii',
        summary: 'Parlamentul a aprobat noi modificari la Codul Fiscal care afecteaza impozitul pe venit si cotele TVA pentru afacerile mici din Republica Moldova.',
        date: '2 aprilie 2026',
        tag: 'Cod Fiscal',
        color: '#4f46e5',
      },
      {
        title: 'Noi termene de depunere a declaratiilor fiscale',
        summary: 'Serviciul Fiscal de Stat a anuntat modificarea termenelor de depunere a declaratiilor TVA si a rapoartelor privind contributiile sociale obligatorii.',
        date: '28 martie 2026',
        tag: 'SFS',
        color: '#0ea5e9',
      },
      {
        title: 'Digitalizarea contabilitatii: obligatii noi pentru IMM-uri',
        summary: 'Incepand cu 2026, toate intreprinderile mici si mijlocii sunt obligate sa treaca la facturarea electronica si raportarea digitala catre fisc.',
        date: '15 martie 2026',
        tag: 'Digitalizare',
        color: '#8b5cf6',
      },
      {
        title: 'Actualizare SNC: noi standarde de contabilitate',
        summary: 'Ministerul Finantelor a publicat versiunea actualizata a Standardelor Nationale de Contabilitate, cu modificari importante privind recunoasterea veniturilor.',
        date: '5 martie 2026',
        tag: 'SNC',
        color: '#059669',
      },
      {
        title: 'Cota TVA redusa pentru servicii IT in Moldova',
        summary: 'Guvernul a introdus o cota TVA redusa de 6% pentru serviciile IT si dezvoltarea software, stimuland sectorul tehnologic din tara.',
        date: '20 februarie 2026',
        tag: 'TVA',
        color: '#d97706',
      },
    ],
  },
  en: {
    label: 'News',
    title: 'Accounting world news',
    subtitle: 'Latest legislative changes, tax updates and important news for your business',
    readMore: 'Read more',
    allNews: 'All news',
    items: [
      {
        title: 'Tax Code 2026 changes: what you need to know',
        summary: 'Parliament approved new Tax Code amendments affecting income tax and VAT rates for small businesses in the Republic of Moldova.',
        date: 'April 2, 2026',
        tag: 'Tax Code',
        color: '#4f46e5',
      },
      {
        title: 'New deadlines for tax declaration submissions',
        summary: 'The State Tax Service announced changes to VAT declaration deadlines and mandatory social contribution reporting schedules.',
        date: 'March 28, 2026',
        tag: 'STS',
        color: '#0ea5e9',
      },
      {
        title: 'Accounting digitalization: new obligations for SMEs',
        summary: 'Starting 2026, all small and medium enterprises are required to switch to electronic invoicing and digital reporting to the tax authority.',
        date: 'March 15, 2026',
        tag: 'Digital',
        color: '#8b5cf6',
      },
      {
        title: 'NAS update: new accounting standards',
        summary: 'The Ministry of Finance published the updated version of National Accounting Standards, with significant changes in revenue recognition.',
        date: 'March 5, 2026',
        tag: 'NAS',
        color: '#059669',
      },
      {
        title: 'Reduced VAT rate for IT services in Moldova',
        summary: 'The government introduced a reduced 6% VAT rate for IT services and software development, stimulating the country\'s tech sector.',
        date: 'February 20, 2026',
        tag: 'VAT',
        color: '#d97706',
      },
    ],
  },
  ru: {
    label: 'Новости',
    title: 'Новости из мира бухгалтерии',
    subtitle: 'Последние законодательные изменения, налоговые обновления и важные новости для вашего бизнеса',
    readMore: 'Читать далее',
    allNews: 'Все новости',
    items: [
      {
        title: 'Изменения в Налоговом кодексе 2026: что нужно знать',
        summary: 'Парламент утвердил новые поправки к Налоговому кодексу, затрагивающие подоходный налог и ставки НДС для малого бизнеса Республики Молдова.',
        date: '2 апреля 2026',
        tag: 'Налоговый кодекс',
        color: '#4f46e5',
      },
      {
        title: 'Новые сроки подачи налоговых деклараций',
        summary: 'Государственная налоговая служба объявила об изменении сроков подачи деклараций НДС и отчётов по обязательным социальным взносам.',
        date: '28 марта 2026',
        tag: 'ГНС',
        color: '#0ea5e9',
      },
      {
        title: 'Цифровизация бухгалтерии: новые обязательства для МСП',
        summary: 'С 2026 года все малые и средние предприятия обязаны перейти на электронное выставление счетов и цифровую отчётность в налоговую.',
        date: '15 марта 2026',
        tag: 'Цифровизация',
        color: '#8b5cf6',
      },
      {
        title: 'Обновление НСБУ: новые стандарты бухгалтерского учёта',
        summary: 'Министерство финансов опубликовало обновлённую версию Национальных стандартов бухгалтерского учёта с важными изменениями в признании доходов.',
        date: '5 марта 2026',
        tag: 'НСБУ',
        color: '#059669',
      },
      {
        title: 'Сниженная ставка НДС для IT-услуг в Молдове',
        summary: 'Правительство ввело сниженную ставку НДС 6% для IT-услуг и разработки программного обеспечения, стимулируя технологический сектор страны.',
        date: '20 февраля 2026',
        tag: 'НДС',
        color: '#d97706',
      },
    ],
  },
};

const NewsSection = () => {
  const { lang } = useLanguage();
  const tr = t[lang];
  const scrollRef = useRef<HTMLDivElement>(null);

  // Stiri adaugate de admin din panou — apar primele in carusel
  const [adminNews, setAdminNews] = useState<PublicContent[]>([]);
  useEffect(() => {
    fetchPublicContent('stire', 30)
      .then((items) => setAdminNews(items))
      .catch(() => setAdminNews([]));
  }, []);

  const adminAsNewsItems: NewsItem[] = adminNews.map((n) => ({
    title: n.title,
    summary: n.body,
    date: new Date(n.published_date).toLocaleDateString('ro', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    tag: n.tag || 'Admin',
    color: n.color || '#4f46e5',
  }));
  const allNews: NewsItem[] = [...adminAsNewsItems, ...tr.items];

  // Auto-scroll carousel
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const interval = setInterval(() => {
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 10) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: 340, behavior: 'smooth' });
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="news" className="py-16 border-t border-neutral-200">
      <div className="flex items-end justify-between mb-10">
        <div>
          <span
            className="inline-block text-sm font-semibold mb-2"
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {tr.label}
          </span>
          <h2 className="font-heading text-[2.2rem] font-semibold text-neutral-black mb-2">
            {tr.title}
          </h2>
          <p className="text-base text-neutral-500 max-w-[600px]">
            {tr.subtitle}
          </p>
        </div>
      </div>

      {/* Scrollable news carousel */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {allNews.map((item, index) => (
          <article
            key={index}
            className="flex-[0_0_320px] max-md:flex-[0_0_85%] snap-start flex flex-col rounded-2xl border border-neutral-200 bg-white overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group"
          >
            {/* Color top accent */}
            <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${item.color}, ${item.color}66)` }} />

            <div className="p-6 flex flex-col flex-1">
              {/* Tag */}
              <span
                className="inline-block self-start px-3 py-1 rounded-full text-xs font-bold mb-4 text-white"
                style={{ background: item.color }}
              >
                {item.tag}
              </span>

              {/* Title */}
              <h3 className="text-lg font-bold text-neutral-black mb-3 leading-snug group-hover:text-[#4f46e5] transition-colors duration-200">
                {item.title}
              </h3>

              {/* Summary */}
              <p className="text-[15px] text-neutral-600 leading-relaxed mb-4 line-clamp-3">
                {item.summary}
              </p>

              {/* Footer */}
              <div className="mt-auto flex items-center justify-between pt-4 border-t border-neutral-100">
                <span className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <CalendarTodayIcon style={{ fontSize: 13 }} />
                  {item.date}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default NewsSection;

import { useRef, useState, useEffect } from 'react';

import GavelIcon from '@mui/icons-material/Gavel';
import BalanceIcon from '@mui/icons-material/Balance';
import GroupsIcon from '@mui/icons-material/Groups';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import SecurityIcon from '@mui/icons-material/Security';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { useLanguage } from '../../../context/LanguageContext';
import type { Lang } from '../../../context/LanguageContext';

interface LawItem {
  icon: React.ReactNode;
  title: string;
  text: string;
  url: string;
}

const lawsContent: Record<Lang, {
  sectionLabel: string;
  title: string;
  subtitle: string;
  viewLaw: string;
  laws: LawItem[];
}> = {
  ro: {
    sectionLabel: 'Legislatie',
    title: 'Legile principale in domeniul contabilitatii',
    subtitle: 'Cadrul legal care reglementeaza activitatea contabila in Republica Moldova',
    viewLaw: 'Vezi legea',
    laws: [
      {
        icon: <GavelIcon />,
        title: 'Legea Contabilitatii nr. 113/2007',
        text: 'Stabileste cadrul juridic, principiile si cerintele generale ale contabilitatii, regulile de intocmire a rapoartelor financiare pentru entitatile din Republica Moldova.',
        url: 'https://www.legis.md/cautare/getResults?doc_id=134777&lang=ro',
      },
      {
        icon: <BalanceIcon />,
        title: 'Codul Fiscal al RM (nr. 1163/1997)',
        text: 'Reglementeaza sistemul de impozite si taxe, inclusiv impozitul pe venit, TVA, contributiile sociale obligatorii si modul de evidenta fiscala.',
        url: 'https://www.fisc.md/CodulFiscal',
      },
      {
        icon: <GroupsIcon />,
        title: 'SNC - Standardele Nationale de Contabilitate',
        text: 'Definesc regulile de recunoastere, evaluare si prezentare a elementelor contabile: active, datorii, capital propriu, venituri si cheltuieli.',
        url: 'https://www.mf.gov.md/ro/content/standarde-na%C8%9Bionale-de-contabilitate',
      },
      {
        icon: <TrendingUpIcon />,
        title: 'Legea nr. 845/1992 privind antreprenoriatul',
        text: 'Reglementeaza activitatea de intreprinzator, inclusiv obligatiile de evidenta contabila, raportare financiara si conformitate fiscala.',
        url: 'https://www.legis.md/cautare/getResults?doc_id=133613&lang=ro',
      },
      {
        icon: <AccountBalanceIcon />,
        title: 'Legea nr. 1585/1998 privind asigurarea obligatorie',
        text: 'Reglementeaza contributiile de asigurari sociale de stat obligatorii, calculul si raportarea fondului de salarizare si a contributiilor individuale.',
        url: 'https://www.legis.md/cautare/getResults?doc_id=133436&lang=ro',
      },
      {
        icon: <ReceiptLongIcon />,
        title: 'Legea nr. 1164/1997 privind impozitul pe bunurile imobiliare',
        text: 'Stabileste modul de calcul, declarare si achitare a impozitului pe bunurile imobiliare pentru persoanele juridice si fizice.',
        url: 'https://www.legis.md/cautare/getResults?doc_id=133253&lang=ro',
      },
      {
        icon: <WorkOutlineIcon />,
        title: 'Codul Muncii al RM (nr. 154/2003)',
        text: 'Reglementeaza relatiile de munca, salarizarea, concediile, contributiile angajatorului si drepturile angajatilor - esentiale pentru evidenta contabila a salariilor.',
        url: 'https://www.legis.md/cautare/getResults?doc_id=133594&lang=ro',
      },
      {
        icon: <SecurityIcon />,
        title: 'Legea nr. 171/2012 privind piata de capital',
        text: 'Reglementeaza transparenta financiara, raportarea obligatorie si auditul pentru societatile pe actiuni si entitatile de interes public.',
        url: 'https://www.legis.md/cautare/getResults?doc_id=134665&lang=ro',
      },
    ],
  },
  en: {
    sectionLabel: 'Legislation',
    title: 'Key accounting laws',
    subtitle: 'The legal framework governing accounting activities in the Republic of Moldova',
    viewLaw: 'View law',
    laws: [
      {
        icon: <GavelIcon />,
        title: 'Accounting Law No. 113/2007',
        text: 'Establishes the legal framework, principles, and general requirements of accounting, as well as the rules for preparing financial reports.',
        url: 'https://www.legis.md/cautare/getResults?doc_id=134777&lang=ro',
      },
      {
        icon: <BalanceIcon />,
        title: 'Tax Code of RM (No. 1163/1997)',
        text: 'Regulates the tax system including income tax, VAT, mandatory social contributions, and the fiscal recording of economic operations.',
        url: 'https://www.fisc.md/CodulFiscal',
      },
      {
        icon: <GroupsIcon />,
        title: 'NAS - National Accounting Standards',
        text: 'Define the rules for recognition, measurement, and presentation of accounting elements: assets, liabilities, equity, revenues, and expenses.',
        url: 'https://www.mf.gov.md/ro/content/standarde-na%C8%9Bionale-de-contabilitate',
      },
      {
        icon: <TrendingUpIcon />,
        title: 'Law No. 845/1992 on Entrepreneurship',
        text: 'Regulates entrepreneurial activity, including accounting obligations, financial reporting, and fiscal compliance for SMEs.',
        url: 'https://www.legis.md/cautare/getResults?doc_id=133613&lang=ro',
      },
      {
        icon: <AccountBalanceIcon />,
        title: 'Law No. 1585/1998 on Mandatory Insurance',
        text: 'Regulates mandatory state social insurance contributions, payroll fund calculation, and individual contribution reporting.',
        url: 'https://www.legis.md/cautare/getResults?doc_id=133436&lang=ro',
      },
      {
        icon: <ReceiptLongIcon />,
        title: 'Law No. 1164/1997 on Real Estate Tax',
        text: 'Establishes the calculation, declaration, and payment of real estate tax for legal entities and individuals.',
        url: 'https://www.legis.md/cautare/getResults?doc_id=133253&lang=ro',
      },
      {
        icon: <WorkOutlineIcon />,
        title: 'Labor Code of RM (No. 154/2003)',
        text: 'Regulates labor relations, payroll, leaves, employer contributions, and employee rights - essential for salary accounting.',
        url: 'https://www.legis.md/cautare/getResults?doc_id=133594&lang=ro',
      },
      {
        icon: <SecurityIcon />,
        title: 'Law No. 171/2012 on Capital Markets',
        text: 'Regulates financial transparency, mandatory reporting, and audit requirements for joint-stock companies and public interest entities.',
        url: 'https://www.legis.md/cautare/getResults?doc_id=134665&lang=ro',
      },
    ],
  },
  ru: {
    sectionLabel: 'Законодательство',
    title: 'Основные законы в области бухгалтерского учёта',
    subtitle: 'Правовая база, регулирующая бухгалтерскую деятельность в Республике Молдова',
    viewLaw: 'Смотреть закон',
    laws: [
      {
        icon: <GavelIcon />,
        title: 'Закон о бухгалтерском учёте № 113/2007',
        text: 'Устанавливает правовую базу, принципы и общие требования бухгалтерского учёта, правила составления финансовой отчётности.',
        url: 'https://www.legis.md/cautare/getResults?doc_id=134777&lang=ro',
      },
      {
        icon: <BalanceIcon />,
        title: 'Налоговый кодекс РМ (№ 1163/1997)',
        text: 'Регулирует систему налогов и сборов, включая подоходный налог, НДС, обязательные социальные взносы и порядок налогового учёта.',
        url: 'https://www.fisc.md/CodulFiscal',
      },
      {
        icon: <GroupsIcon />,
        title: 'НСБУ — Национальные стандарты бухгалтерского учёта',
        text: 'Определяют правила признания, оценки и представления элементов учёта: активов, обязательств, капитала, доходов и расходов.',
        url: 'https://www.mf.gov.md/ro/content/standarde-na%C8%9Bionale-de-contabilitate',
      },
      {
        icon: <TrendingUpIcon />,
        title: 'Закон № 845/1992 о предпринимательстве',
        text: 'Регулирует предпринимательскую деятельность, включая обязанности по ведению бухгалтерского учёта и налоговому соответствию.',
        url: 'https://www.legis.md/cautare/getResults?doc_id=133613&lang=ro',
      },
      {
        icon: <AccountBalanceIcon />,
        title: 'Закон № 1585/1998 об обязательном страховании',
        text: 'Регулирует обязательные государственные взносы социального страхования, расчёт фонда заработной платы.',
        url: 'https://www.legis.md/cautare/getResults?doc_id=133436&lang=ro',
      },
      {
        icon: <ReceiptLongIcon />,
        title: 'Закон № 1164/1997 о налоге на недвижимость',
        text: 'Устанавливает порядок расчёта, декларирования и уплаты налога на недвижимое имущество для юридических и физических лиц.',
        url: 'https://www.legis.md/cautare/getResults?doc_id=133253&lang=ro',
      },
      {
        icon: <WorkOutlineIcon />,
        title: 'Трудовой кодекс РМ (№ 154/2003)',
        text: 'Регулирует трудовые отношения, оплату труда, отпуска, взносы работодателя и права работников — важно для учёта зарплат.',
        url: 'https://www.legis.md/cautare/getResults?doc_id=133594&lang=ro',
      },
      {
        icon: <SecurityIcon />,
        title: 'Закон № 171/2012 о рынке капитала',
        text: 'Регулирует финансовую прозрачность, обязательную отчётность и аудит для акционерных обществ.',
        url: 'https://www.legis.md/cautare/getResults?doc_id=134665&lang=ro',
      },
    ],
  },
};

const LawsSection = () => {
  const { lang } = useLanguage();
  const t = lawsContent[lang];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener('scroll', checkScroll);
    return () => el?.removeEventListener('scroll', checkScroll);
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.6;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <section id="laws" className="px-8 py-12 border-t border-neutral-200">
      <div className="flex items-end justify-between mb-8">
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
            {t.sectionLabel}
          </span>
          <h2 className="font-heading text-[2rem] font-semibold text-neutral-black mb-2">
            {t.title}
          </h2>
          <p className="text-base text-neutral-500 max-w-[600px]">
            {t.subtitle}
          </p>
        </div>
        {/* Navigation arrows */}
        <div className="flex gap-2 max-md:hidden">
          <button
            onClick={() => scroll('left')}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-200 cursor-pointer ${
              canScrollLeft
                ? 'border-neutral-300 text-neutral-600 hover:border-[#4f46e5] hover:text-[#4f46e5] hover:shadow-sm'
                : 'border-neutral-200 text-neutral-300 cursor-default'
            }`}
            disabled={!canScrollLeft}
          >
            <ChevronLeftIcon style={{ fontSize: 20 }} />
          </button>
          <button
            onClick={() => scroll('right')}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-200 cursor-pointer ${
              canScrollRight
                ? 'border-neutral-300 text-neutral-600 hover:border-[#4f46e5] hover:text-[#4f46e5] hover:shadow-sm'
                : 'border-neutral-200 text-neutral-300 cursor-default'
            }`}
            disabled={!canScrollRight}
          >
            <ChevronRightIcon style={{ fontSize: 20 }} />
          </button>
        </div>
      </div>

      {/* Scrollable cards with fade edges */}
      <div className="relative">
        {/* Left fade */}
        <div
          className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none transition-opacity duration-300"
          style={{
            background: 'linear-gradient(90deg, white 0%, transparent 100%)',
            opacity: canScrollLeft ? 1 : 0,
          }}
        />
        {/* Right fade */}
        <div
          className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none transition-opacity duration-300"
          style={{
            background: 'linear-gradient(270deg, white 0%, transparent 100%)',
            opacity: canScrollRight ? 1 : 0,
          }}
        />

        <div
          ref={scrollRef}
          className="flex gap-4 mb-8 overflow-x-auto scroll-smooth snap-x snap-mandatory py-2 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {t.laws.map((law, index) => (
            <a
              key={index}
              href={law.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-[0_0_31%] max-md:flex-[0_0_80%] snap-start flex flex-col gap-3 p-6 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:border-[#4f46e5]/30 group no-underline"
            >
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center [&_svg]:text-white"
                style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)',
                }}
              >
                {law.icon}
              </div>
              <h3 className="text-base font-bold text-[#1e1b4b] leading-snug group-hover:text-[#4f46e5] transition-colors duration-200">
                {law.title}
              </h3>
              <p className="text-[15px] text-neutral-800 leading-relaxed line-clamp-3">
                {law.text}
              </p>
              <span className="flex items-center gap-1 text-sm font-semibold text-[#4f46e5] mt-auto opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                {t.viewLaw} <OpenInNewIcon style={{ fontSize: 14 }} />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LawsSection;

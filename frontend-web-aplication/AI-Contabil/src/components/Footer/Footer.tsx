import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import type { Lang } from '../../context/LanguageContext';

const t: Record<Lang, {
  quickLinks: string;
  resources: string;
  mobileApp: string;
  contact: string;
  about: string;
  laws: string;
  documents: string;
  news: string;
  consultation: string;
  signIn: string;
  signUp: string;
  training: string;
  officialLinks: string;
  taxCode: string;
  sfs: string;
  mf: string;
  cnas: string;
  cnam: string;
  legis: string;
  brandDesc: string;
  createReport: string;
  myDocuments: string;
  aiTraining: string;
  settings: string;
  rights: string;
  madeBy: string;
}> = {
  ro: {
    quickLinks: 'Linkuri rapide',
    resources: 'Resurse',
    contact: 'Contact',
    about: 'Despre noi',
    laws: 'Legislatie',
    documents: 'Documente',
    news: 'Noutati',
    consultation: 'Consultare',
    signIn: 'Logare',
    signUp: 'Inregistrare',
    training: 'Antrenare AI',
    mobileApp: 'Aplicatia mobila',
    officialLinks: 'Organizatii oficiale',
    taxCode: 'Codul Fiscal al RM',
    sfs: 'Serviciul Fiscal de Stat',
    mf: 'Ministerul Finantelor',
    cnas: 'Casa Nationala de Asigurari Sociale',
    cnam: 'Compania Nationala de Asigurari in Medicina',
    legis: 'Legislatia RM',
    brandDesc: 'Platforma inteligenta de contabilitate pentru afaceri mici din Republica Moldova.',
    createReport: 'Creaza raport',
    myDocuments: 'Documentele mele',
    aiTraining: 'Antrenare AI',
    settings: 'Setari cont',
    rights: 'Toate drepturile rezervate.',
    madeBy: 'Creat de',
  },
  en: {
    quickLinks: 'Quick links',
    resources: 'Resources',
    contact: 'Contact',
    about: 'About us',
    laws: 'Legislation',
    documents: 'Documents',
    news: 'News',
    consultation: 'Consultation',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    training: 'AI Training',
    mobileApp: 'Mobile app',
    officialLinks: 'Official organizations',
    taxCode: 'Tax Code of RM',
    sfs: 'State Tax Service',
    mf: 'Ministry of Finance',
    cnas: 'National Social Insurance House',
    cnam: 'National Health Insurance Company',
    legis: 'RM Legislation',
    brandDesc: 'Smart accounting platform for small businesses in the Republic of Moldova.',
    createReport: 'Create report',
    myDocuments: 'My documents',
    aiTraining: 'AI Training',
    settings: 'Account settings',
    rights: 'All rights reserved.',
    madeBy: 'Made by',
  },
  ru: {
    quickLinks: 'Быстрые ссылки',
    resources: 'Ресурсы',
    contact: 'Контакт',
    about: 'О нас',
    laws: 'Законодательство',
    documents: 'Документы',
    news: 'Новости',
    consultation: 'Консультация',
    signIn: 'Вход',
    signUp: 'Регистрация',
    training: 'Обучение ИИ',
    mobileApp: 'Мобильное приложение',
    officialLinks: 'Официальные организации',
    taxCode: 'Налоговый кодекс РМ',
    sfs: 'Государственная налоговая служба',
    mf: 'Министерство финансов',
    cnas: 'Национальная касса социального страхования',
    cnam: 'Национальная компания медицинского страхования',
    legis: 'Законодательство РМ',
    brandDesc: 'Интеллектуальная бухгалтерская платформа для малого бизнеса Республики Молдова.',
    createReport: 'Создать отчёт',
    myDocuments: 'Мои документы',
    aiTraining: 'Обучение ИИ',
    settings: 'Настройки аккаунта',
    rights: 'Все права защищены.',
    madeBy: 'Создано',
  },
};

interface FooterProps {
  showChat?: boolean;
  isLoggedIn?: boolean;
}

const EMAIL = 'chistol.maxim@gmail.com';
const LINKEDIN = 'https://www.linkedin.com/in/maxim-chistol';

const Footer = ({ showChat = false, isLoggedIn = false }: FooterProps) => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const tr = t[lang];

  const linkClass = "text-sm text-neutral-400 hover:text-white transition-colors duration-200 cursor-pointer";

  return (
    <>
      <footer className="bg-[#0d1b2a] text-white">
        <div className="w-[85%] max-md:w-full max-md:px-6 mx-auto py-14">
          <div className="grid grid-cols-6 max-lg:grid-cols-3 max-md:grid-cols-2 gap-10 mb-12">
            {/* Brand */}
            <div className="max-md:col-span-2">
              <div
                className="mb-4 cursor-pointer"
                style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '1.3rem', fontWeight: 800, letterSpacing: '0.12em' }}
                onClick={() => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                AI-CONTABIL
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed max-w-[260px]">
                {tr.brandDesc}
              </p>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-4 text-neutral-300">{tr.quickLinks}</h4>
              <div className="flex flex-col gap-2.5">
                {isLoggedIn ? (
                  <>
                    <span className={linkClass} onClick={() => navigate('/reports')}>{tr.createReport}</span>
                    <span className={linkClass} onClick={() => navigate('/documents')}>{tr.myDocuments}</span>
                    <span className={linkClass} onClick={() => navigate('/training')}>{tr.aiTraining}</span>
                    <span className={linkClass} onClick={() => navigate('/settings')}>{tr.settings}</span>
                  </>
                ) : (
                  <>
                    <a href="#about" className={linkClass}>{tr.about}</a>
                    <a href="#laws" className={linkClass}>{tr.laws}</a>
                    <a href="#documents" className={linkClass}>{tr.documents}</a>
                    <a href="#news" className={linkClass}>{tr.news}</a>
                    <a href="#contact" className={linkClass}>{tr.consultation}</a>
                  </>
                )}
              </div>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-4 text-neutral-300">{tr.resources}</h4>
              <div className="flex flex-col gap-2.5">
                <span className={linkClass} onClick={() => navigate('/signin')}>{tr.signIn}</span>
                <span className={linkClass} onClick={() => navigate('/signup')}>{tr.signUp}</span>
                <span className={linkClass} onClick={() => navigate('/training')}>{tr.training}</span>
              </div>
            </div>

            {/* Official Links */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-4 text-neutral-300">{tr.officialLinks}</h4>
              <div className="flex flex-col gap-2.5">
                <a href="https://www.fisc.md/CodulFiscal" target="_blank" rel="noopener noreferrer" className={linkClass}>{tr.taxCode}</a>
                <a href="https://www.fisc.md" target="_blank" rel="noopener noreferrer" className={linkClass}>{tr.sfs}</a>
                <a href="https://www.mf.gov.md" target="_blank" rel="noopener noreferrer" className={linkClass}>{tr.mf}</a>
                <a href="https://www.cnas.md" target="_blank" rel="noopener noreferrer" className={linkClass}>{tr.cnas}</a>
                <a href="https://www.cnam.md" target="_blank" rel="noopener noreferrer" className={linkClass}>{tr.cnam}</a>
                <a href="https://www.legis.md" target="_blank" rel="noopener noreferrer" className={linkClass}>{tr.legis}</a>
              </div>
            </div>

            {/* Mobile App */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-4 text-neutral-300">{tr.mobileApp}</h4>
              <div className="flex flex-col gap-3">
                {/* Google Play Badge */}
                <a
                  href="https://play.google.com/store"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 hover:border-white/30 transition-all duration-200 group"
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" className="flex-shrink-0">
                    <path d="M3.61 1.814L13.793 12 3.61 22.186a.996.996 0 01-.61-.92V2.734c0-.382.218-.72.61-.92z" fill="#4285F4"/>
                    <path d="M17.114 8.683L5.041.907a1.024 1.024 0 00-1.07-.02L14.58 11.5l2.534-2.817z" fill="#EA4335"/>
                    <path d="M17.114 15.317L14.58 12.5 3.971 23.113a1.024 1.024 0 001.07-.02l12.073-7.776z" fill="#34A853"/>
                    <path d="M20.39 10.844l-3.276-2.161L14.58 11.5l2.534 2.817 3.276-2.161c.61-.394.61-1.308 0-1.312z" fill="#FBBC05"/>
                  </svg>
                  <div>
                    <div className="text-[10px] text-neutral-500 leading-none uppercase tracking-wider">GET IT ON</div>
                    <div className="text-[15px] font-semibold text-white leading-tight">Google Play</div>
                  </div>
                </a>
                {/* App Store Badge */}
                <a
                  href="https://apps.apple.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 hover:border-white/30 transition-all duration-200 group"
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="white" className="flex-shrink-0">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div>
                    <div className="text-[10px] text-neutral-500 leading-none uppercase tracking-wider">Download on the</div>
                    <div className="text-[15px] font-semibold text-white leading-tight">App Store</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-4 text-neutral-300">{tr.contact}</h4>
              <div className="flex flex-col gap-3">
                <a
                  href={`https://mail.google.com/mail/?view=cm&to=${EMAIL}&su=AI-Contabil%20-%20Consultare`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors duration-200"
                >
                  <EmailOutlinedIcon style={{ fontSize: 16 }} />
                  {EMAIL}
                </a>
                <a
                  href={LINKEDIN}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors duration-200"
                >
                  <LinkedInIcon style={{ fontSize: 16 }} />
                  LinkedIn
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 pt-6 flex items-center justify-between max-md:flex-col max-md:gap-3">
            <p className="text-xs text-neutral-500">
              &copy; {new Date().getFullYear()} AI-Contabil. {tr.rights}
            </p>
            <p className="text-xs text-neutral-500">
              {tr.madeBy}{' '}
              <a
                href={LINKEDIN}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white transition-colors font-semibold"
              >
                Maxim Chistol
              </a>
            </p>
          </div>
        </div>
      </footer>

      {showChat && (
        <div
          className="btn-gradient w-12 h-12 rounded-full flex items-center justify-center cursor-pointer fixed bottom-6 right-6 z-[999] hover:scale-110 transition-transform"
          onClick={() => navigate('/settings')}
          title="Ajutor & Suport"
        >
          <ChatBubbleOutlineIcon style={{ color: '#fff' }} />
        </div>
      )}
    </>
  );
};

export default Footer;

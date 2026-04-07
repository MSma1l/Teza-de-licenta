import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SchoolIcon from '@mui/icons-material/School';
import DescriptionIcon from '@mui/icons-material/Description';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import LanguageIcon from '@mui/icons-material/Language';

import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import type { Lang } from '../../context/LanguageContext';

const langOptions: { key: Lang; flag: string; label: string }[] = [
  { key: 'ro', flag: '🇲🇩', label: 'RO' },
  { key: 'en', flag: '🇬🇧', label: 'EN' },
  { key: 'ru', flag: '🇷🇺', label: 'RU' },
];

const t = {
  ro: {
    about: 'DESPRE NOI',
    laws: 'LEGISLATIE',
    documents: 'DOCUMENTE',
    news: 'NOUTATI',
    contact: 'CONTACT',
    login: 'LOGARE',
    docs: 'Documente',
    reports: 'Rapoarte',
    training: 'Antrenare AI',
    settings: 'Setari',
    logout: 'Deconectare',
  },
  en: {
    about: 'ABOUT US',
    laws: 'LEGISLATION',
    documents: 'DOCUMENTS',
    news: 'NEWS',
    contact: 'CONTACT',
    login: 'LOGIN',
    docs: 'Documents',
    reports: 'Reports',
    training: 'AI Training',
    settings: 'Settings',
    logout: 'Logout',
  },
  ru: {
    about: 'О НАС',
    laws: 'ЗАКОНЫ',
    documents: 'ДОКУМЕНТЫ',
    news: 'НОВОСТИ',
    contact: 'КОНТАКТ',
    login: 'ВХОД',
    docs: 'Документы',
    reports: 'Отчёты',
    training: 'Обучение ИИ',
    settings: 'Настройки',
    logout: 'Выход',
  },
};

interface NavbarProps {
  isLoggedIn?: boolean;
  showNavLinks?: boolean;
}

const Navbar = ({ isLoggedIn = false, showNavLinks = true }: NavbarProps) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { lang, setLang } = useLanguage();
  const tr = t[lang];

  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const currentLang = langOptions.find((l) => l.key === lang) || langOptions[0];

  const navLinkClass = "nav-link-hover text-base font-bold uppercase tracking-wide text-neutral-600 cursor-pointer relative py-1";

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  return (
    <nav className="navbar-glass flex items-center justify-center px-4 max-md:px-4 py-4 sticky top-0 z-[1000]">
      <div className="flex items-center justify-between w-[85%] max-md:w-full">
        <div
          className="logo-hover cursor-pointer select-none"
          style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.12em', color: '#1a1a1a' }}
          onClick={() => navigate('/')}
        >
          AI-CONTABIL
        </div>

        {/* Desktop nav links */}
        {showNavLinks && (
          <div className="flex items-center gap-8 max-md:hidden">
            <a href="#about" className={navLinkClass}>{tr.about}</a>
            <a href="#laws" className={navLinkClass}>{tr.laws}</a>
            <a href="#documents" className={navLinkClass}>{tr.documents}</a>
            <a href="#news" className={navLinkClass}>{tr.news}</a>
            <a href="#contact" className={navLinkClass}>{tr.contact}</a>
          </div>
        )}

        {/* Desktop right section */}
        <div className="flex items-center gap-3 max-md:hidden">
          {/* Language switcher */}
          <div ref={langRef} className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-200 bg-white text-sm font-medium text-neutral-600 cursor-pointer transition-all duration-200 hover:border-[#4f46e5] hover:text-[#4f46e5] hover:shadow-sm"
            >
              <LanguageIcon style={{ fontSize: 16 }} />
              <span>{currentLang.flag}</span>
              <span className="text-xs font-semibold">{currentLang.label}</span>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`}>
                <path d="M2 4L5 7L8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {langOpen && (
              <div className="absolute top-full right-0 mt-2 bg-white rounded-xl border border-neutral-200 shadow-lg overflow-hidden animate-fade-in min-w-[140px] z-50">
                {langOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { setLang(opt.key); setLangOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium cursor-pointer transition-all duration-150 ${
                      lang === opt.key
                        ? 'bg-gradient-to-r from-[#4f46e5]/10 to-[#0ea5e9]/10 text-[#4f46e5]'
                        : 'text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <span className="text-base">{opt.flag}</span>
                    <span>{opt.key === 'ro' ? 'Romana' : opt.key === 'en' ? 'English' : 'Русский'}</span>
                    {lang === opt.key && (
                      <svg className="ml-auto" width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 7L6 10L11 4" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isLoggedIn ? (
            <>
              <div
                className="nav-icon-hover w-10 h-10 flex items-center justify-center cursor-pointer text-neutral-600 rounded-lg"
                onClick={() => navigate('/documents')}
                title={tr.docs}
              >
                <DescriptionIcon />
              </div>
              <div
                className="nav-icon-hover w-10 h-10 flex items-center justify-center cursor-pointer text-neutral-600 rounded-lg"
                onClick={() => navigate('/reports')}
                title={tr.reports}
              >
                <AssessmentIcon />
              </div>
              <div
                className="nav-icon-hover w-10 h-10 flex items-center justify-center cursor-pointer text-neutral-600 rounded-lg"
                onClick={() => navigate('/training')}
                title={tr.training}
              >
                <SchoolIcon />
              </div>
              <div
                className="nav-icon-hover w-10 h-10 flex items-center justify-center cursor-pointer text-neutral-600 rounded-lg"
                onClick={() => navigate('/settings')}
                title={tr.settings}
              >
                <NotificationsNoneIcon />
              </div>
              <div
                className="w-9 h-9 rounded-full bg-neutral-300 flex items-center justify-center cursor-pointer overflow-hidden border-2 border-neutral-200 hover:border-primary transition-all duration-300 hover:scale-110 [&_svg]:text-neutral-500"
                onClick={() => navigate('/settings')}
                title={tr.settings}
              >
                <PersonOutlineIcon fontSize="small" />
              </div>
              <button
                onClick={handleLogout}
                className="w-10 h-10 flex items-center justify-center cursor-pointer text-neutral-400 hover:text-red-500 transition-all duration-300 hover:scale-110 rounded-lg"
                title={tr.logout}
              >
                <LogoutIcon />
              </button>
            </>
          ) : (
            <button className="btn-gradient py-2 px-8 rounded-full text-sm font-bold uppercase tracking-wider" onClick={() => navigate('/signin')}>
              {tr.login} &gt;
            </button>
          )}
        </div>

        {/* Mobile hamburger button */}
        <button
          className="hidden max-md:flex w-10 h-10 items-center justify-center text-neutral-600 cursor-pointer"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="hidden max-md:flex fixed inset-0 top-[65px] bg-white z-[999] flex-col p-6 gap-2 animate-fade-in">
            {/* Mobile language selector */}
              <div className="flex gap-2 mb-4">
                {langOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setLang(opt.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 ${
                      lang === opt.key
                        ? 'btn-gradient'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    <span>{opt.flag}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>

            {isLoggedIn ? (
              <>
                <button onClick={() => { navigate('/documents'); setMobileMenuOpen(false); }} className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-neutral-100 text-neutral-600 text-left cursor-pointer">
                  <DescriptionIcon /> {tr.docs}
                </button>
                <button onClick={() => { navigate('/reports'); setMobileMenuOpen(false); }} className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-neutral-100 text-neutral-600 text-left cursor-pointer">
                  <AssessmentIcon /> {tr.reports}
                </button>
                <button onClick={() => { navigate('/training'); setMobileMenuOpen(false); }} className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-neutral-100 text-neutral-600 text-left cursor-pointer">
                  <SchoolIcon /> {tr.training}
                </button>
                <button onClick={() => { navigate('/settings'); setMobileMenuOpen(false); }} className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-neutral-100 text-neutral-600 text-left cursor-pointer">
                  <PersonOutlineIcon /> {tr.settings}
                </button>
                <hr className="border-neutral-200 my-2" />
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-red-50 text-red-500 text-left cursor-pointer">
                  <LogoutIcon /> {tr.logout}
                </button>
              </>
            ) : (
              <button onClick={() => { navigate('/signin'); setMobileMenuOpen(false); }} className="btn-gradient py-3 px-6 rounded-full text-sm font-bold uppercase text-center">
                {tr.login}
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

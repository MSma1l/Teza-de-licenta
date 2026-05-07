import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SchoolIcon from '@mui/icons-material/School';
import DescriptionIcon from '@mui/icons-material/Description';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import InboxIcon from '@mui/icons-material/Inbox';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import NoteAddOutlinedIcon from '@mui/icons-material/NoteAddOutlined';

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
    queue: 'Coada documente',
    reports: 'Rapoarte',
    training: 'Antrenare AI',
    admin: 'Panou administrator',
    notifications: 'Notificari',
    settings: 'Profil',
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
    queue: 'Document queue',
    reports: 'Reports',
    training: 'AI Training',
    admin: 'Admin panel',
    notifications: 'Notifications',
    settings: 'Profile',
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
    queue: 'Очередь документов',
    reports: 'Отчёты',
    training: 'Обучение ИИ',
    admin: 'Админ панель',
    notifications: 'Уведомления',
    settings: 'Профиль',
    logout: 'Выход',
  },
};

interface NavbarProps {
  isLoggedIn?: boolean;
  showNavLinks?: boolean;
}

const Navbar = ({ isLoggedIn = false, showNavLinks = true }: NavbarProps) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // Comparare case-insensitive a rolului. In DB rolurile sunt UPPERCASE (CLIENT/CONTABIL/ADMIN).
  const role = (user?.role || '').toLowerCase();
  const isContabil = role === 'contabil';
  const isAdmin = role === 'admin' || role === 'super_admin';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { lang, setLang } = useLanguage();
  const tr = t[lang];

  const navLinkClass = "nav-link-hover text-base font-bold uppercase tracking-wide text-neutral-600 cursor-pointer relative py-1";
  const iconBtnClass = "nav-icon-hover w-10 h-10 flex items-center justify-center cursor-pointer text-neutral-600 rounded-lg";

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

        {/* Desktop nav links — doar pe pagina publica */}
        {showNavLinks && (
          <div className="flex items-center gap-8 max-md:hidden">
            <a href="#about" className={navLinkClass}>{tr.about}</a>
            <a href="#laws" className={navLinkClass}>{tr.laws}</a>
            <a href="#documents" className={navLinkClass}>{tr.documents}</a>
            <a href="#news" className={navLinkClass}>{tr.news}</a>
            <a href="#contact" className={navLinkClass}>{tr.contact}</a>
          </div>
        )}

        {/* Desktop right — iconite pe rol */}
        <div className="flex items-center gap-3 max-md:hidden">
          {isLoggedIn ? (
            <>
              {/* TOTI: Documente */}
              <div
                className={iconBtnClass}
                onClick={() => navigate('/documents')}
                title={tr.docs}
              >
                <DescriptionIcon />
              </div>

              {/* CONTABIL + CLIENT + RECEPTIONIST: Generator documente (PDF) */}
              {!isAdmin && (
                <div
                  className={iconBtnClass}
                  onClick={() => navigate('/generator')}
                  title="Generator documente (factura, chitanta, contract, stat de plata)"
                >
                  <NoteAddOutlinedIcon />
                </div>
              )}

              {/* CONTABIL + ADMIN: Coada documente */}
              {(isContabil || isAdmin) && (
                <div
                  className={iconBtnClass}
                  onClick={() => navigate('/contabil')}
                  title={tr.queue}
                >
                  <InboxIcon />
                </div>
              )}

              {/* CONTABIL + ADMIN: Rapoarte fiscale */}
              {(isContabil || isAdmin) && (
                <div
                  className={iconBtnClass}
                  onClick={() => navigate('/reports')}
                  title={tr.reports}
                >
                  <AssessmentIcon />
                </div>
              )}

              {/* ADMIN: Antrenare modele */}
              {isAdmin && (
                <div
                  className={iconBtnClass}
                  onClick={() => navigate('/training')}
                  title={tr.training}
                >
                  <SchoolIcon />
                </div>
              )}

              {/* ADMIN: Panou admin */}
              {isAdmin && (
                <div
                  className={iconBtnClass}
                  onClick={() => navigate('/admin')}
                  title={tr.admin}
                >
                  <AdminPanelSettingsIcon />
                </div>
              )}

              {/* TOTI: Notificari */}
              <div
                className={iconBtnClass}
                onClick={() => navigate('/settings?tab=notifications')}
                title={tr.notifications}
              >
                <NotificationsNoneIcon />
              </div>

              {/* TOTI: Profil */}
              <div
                className="w-9 h-9 rounded-full bg-neutral-300 flex items-center justify-center cursor-pointer overflow-hidden border-2 border-neutral-200 hover:border-primary transition-all duration-300 hover:scale-110 [&_svg]:text-neutral-500"
                onClick={() => navigate('/settings')}
                title={tr.settings}
              >
                <PersonOutlineIcon fontSize="small" />
              </div>

              {/* TOTI: Logout */}
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

        {/* Mobile hamburger */}
        <button
          className="hidden max-md:flex w-10 h-10 items-center justify-center text-neutral-600 cursor-pointer"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="hidden max-md:flex fixed inset-0 top-[65px] bg-white z-[999] flex-col p-6 gap-2 animate-fade-in">
            <div className="flex gap-2 mb-4">
              {langOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setLang(opt.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 ${
                    lang === opt.key ? 'btn-gradient' : 'bg-neutral-100 text-neutral-600'
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
                {(isContabil || isAdmin) && (
                  <button onClick={() => { navigate('/contabil'); setMobileMenuOpen(false); }} className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-neutral-100 text-neutral-600 text-left cursor-pointer">
                    <InboxIcon /> {tr.queue}
                  </button>
                )}
                {(isContabil || isAdmin) && (
                  <button onClick={() => { navigate('/reports'); setMobileMenuOpen(false); }} className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-neutral-100 text-neutral-600 text-left cursor-pointer">
                    <AssessmentIcon /> {tr.reports}
                  </button>
                )}
                {isAdmin && (
                  <button onClick={() => { navigate('/training'); setMobileMenuOpen(false); }} className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-neutral-100 text-neutral-600 text-left cursor-pointer">
                    <SchoolIcon /> {tr.training}
                  </button>
                )}
                {isAdmin && (
                  <button onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }} className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-neutral-100 text-neutral-600 text-left cursor-pointer">
                    <AdminPanelSettingsIcon /> {tr.admin}
                  </button>
                )}
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

// Marca: client = 1 iconita (Documente). contabil = +Coada +Rapoarte. admin = +Antrenare +AdminPanel.
// Pentru ca rolurile in DB sunt UPPERCASE (CLIENT/CONTABIL/ADMIN), comparam mereu cu .toLowerCase().

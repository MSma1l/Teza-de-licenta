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

import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  isLoggedIn?: boolean;
  showNavLinks?: boolean;
}

const Navbar = ({ isLoggedIn = false, showNavLinks = true }: NavbarProps) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinkClass = "text-sm font-medium text-neutral-600 cursor-pointer relative py-1 hover:text-primary transition-colors after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all hover:after:w-full";

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  return (
    <nav className="flex items-center justify-between px-12 max-md:px-4 py-4 bg-white sticky top-0 z-[1000] border-b border-neutral-200">
      <div className="font-heading text-xl font-bold text-neutral-black cursor-pointer" onClick={() => navigate('/')}>
        Logo
      </div>

      {/* Desktop nav links */}
      {showNavLinks && (
        <div className="flex items-center gap-8 max-md:hidden">
          <span className={navLinkClass}>About</span>
          <span className={navLinkClass} onClick={() => navigate('/documents')}>Documents</span>
          <span className={navLinkClass}>Editing</span>
          <span className={navLinkClass}>Contact Us</span>
        </div>
      )}

      {/* Desktop right section */}
      <div className="flex items-center gap-3 max-md:hidden">
        {isLoggedIn ? (
          <>
            <div
              className="w-10 h-10 flex items-center justify-center cursor-pointer text-neutral-600 hover:text-primary transition-colors"
              onClick={() => navigate('/documents')}
              title="Documente"
            >
              <DescriptionIcon />
            </div>
            <div
              className="w-10 h-10 flex items-center justify-center cursor-pointer text-neutral-600 hover:text-primary transition-colors"
              onClick={() => navigate('/reports')}
              title="Rapoarte"
            >
              <AssessmentIcon />
            </div>
            <div
              className="w-10 h-10 flex items-center justify-center cursor-pointer text-neutral-600 hover:text-primary transition-colors"
              onClick={() => navigate('/training')}
              title="Antrenare AI"
            >
              <SchoolIcon />
            </div>
            <div
              className="w-10 h-10 flex items-center justify-center cursor-pointer text-neutral-600 hover:text-primary transition-colors"
              onClick={() => navigate('/settings')}
              title="Notificări"
            >
              <NotificationsNoneIcon />
            </div>
            <div
              className="w-9 h-9 rounded-full bg-neutral-300 flex items-center justify-center cursor-pointer overflow-hidden border-2 border-neutral-200 hover:border-primary transition-colors [&_svg]:text-neutral-500"
              onClick={() => navigate('/settings')}
              title="Setări profil"
            >
              <PersonOutlineIcon fontSize="small" />
            </div>
            <button
              onClick={handleLogout}
              className="w-10 h-10 flex items-center justify-center cursor-pointer text-neutral-400 hover:text-red-500 transition-colors"
              title="Deconectare"
            >
              <LogoutIcon />
            </button>
          </>
        ) : (
          <>
            <button className="py-1 px-6 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary-light transition-colors cursor-pointer" onClick={() => navigate('/signin')}>
              Sign In &gt;
            </button>
            <button className="py-1 px-6 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary-light transition-colors cursor-pointer" onClick={() => navigate('/signup')}>
              Sign up &gt;
            </button>
          </>
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
          {isLoggedIn ? (
            <>
              <button onClick={() => { navigate('/documents'); setMobileMenuOpen(false); }} className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-neutral-100 text-neutral-600 text-left cursor-pointer">
                <DescriptionIcon /> Documente
              </button>
              <button onClick={() => { navigate('/reports'); setMobileMenuOpen(false); }} className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-neutral-100 text-neutral-600 text-left cursor-pointer">
                <AssessmentIcon /> Rapoarte
              </button>
              <button onClick={() => { navigate('/training'); setMobileMenuOpen(false); }} className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-neutral-100 text-neutral-600 text-left cursor-pointer">
                <SchoolIcon /> Antrenare AI
              </button>
              <button onClick={() => { navigate('/settings'); setMobileMenuOpen(false); }} className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-neutral-100 text-neutral-600 text-left cursor-pointer">
                <PersonOutlineIcon /> Setări
              </button>
              <hr className="border-neutral-200 my-2" />
              <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-red-50 text-red-500 text-left cursor-pointer">
                <LogoutIcon /> Deconectare
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { navigate('/signin'); setMobileMenuOpen(false); }} className="py-3 px-6 rounded-full bg-primary text-white text-sm font-medium text-center cursor-pointer">
                Sign In
              </button>
              <button onClick={() => { navigate('/signup'); setMobileMenuOpen(false); }} className="py-3 px-6 rounded-full bg-primary text-white text-sm font-medium text-center cursor-pointer">
                Sign Up
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;

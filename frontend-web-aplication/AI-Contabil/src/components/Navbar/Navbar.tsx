import { useNavigate } from 'react-router-dom';

import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

interface NavbarProps {
  isLoggedIn?: boolean;
  showNavLinks?: boolean;
}

const Navbar = ({ isLoggedIn = false, showNavLinks = true }: NavbarProps) => {
  const navigate = useNavigate();

  return (
    <nav className="flex items-center justify-between px-12 py-4 bg-white sticky top-0 z-[1000] border-b border-neutral-200">
      <div className="font-heading text-xl font-bold text-neutral-black cursor-pointer" onClick={() => navigate('/')}>
        Logo
      </div>

      {showNavLinks && (
        <div className="flex items-center gap-8">
          <span className="text-sm font-medium text-neutral-600 cursor-pointer relative py-1 hover:text-primary transition-colors after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all hover:after:w-full">About</span>
          <span className="text-sm font-medium text-neutral-600 cursor-pointer relative py-1 hover:text-primary transition-colors after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all hover:after:w-full">Documnets</span>
          <span className="text-sm font-medium text-neutral-600 cursor-pointer relative py-1 hover:text-primary transition-colors after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all hover:after:w-full">Editing</span>
          <span className="text-sm font-medium text-neutral-600 cursor-pointer relative py-1 hover:text-primary transition-colors after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all hover:after:w-full">Contact Us</span>
        </div>
      )}

      <div className="flex items-center gap-4">
        {isLoggedIn ? (
          <>
            <div className="w-10 h-10 flex items-center justify-center cursor-pointer text-neutral-600 hover:text-primary transition-colors">
              <NotificationsNoneIcon />
            </div>
            <div
              className="w-9 h-9 rounded-full bg-neutral-300 flex items-center justify-center cursor-pointer overflow-hidden border-2 border-neutral-200 hover:border-primary transition-colors [&_svg]:text-neutral-500"
              onClick={() => navigate('/settings')}
            >
              <PersonOutlineIcon fontSize="small" />
            </div>
          </>
        ) : (
          <>
            <button className="py-1 px-6 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary-light transition-colors" onClick={() => navigate('/signin')}>
              Sign In &gt;
            </button>
            <button className="py-1 px-6 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary-light transition-colors" onClick={() => navigate('/signup')}>
              Sign up &gt;
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

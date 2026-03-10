/* ============================================
   COMPONENTA NAVBAR

   Bara de navigație afișează:
   - Logo-ul aplicației (stânga)
   - Linkurile de navigare (centru) - doar pe pagina Home
   - Butoane Sign In / Sign Up (dreapta) - înainte de logare
   - Iconiță notificări + Avatar (dreapta) - după logare

   Props:
   - isLoggedIn: boolean - determină ce se afișează în dreapta
   - showNavLinks: boolean - determină dacă se afișează linkurile
   ============================================ */

import { useNavigate } from 'react-router-dom';

/* Importăm iconițe Material UI */
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

/* Importăm stilurile CSS ale navbar-ului */
import './Navbar.css';

/* --- Tipul props-urilor componentei --- */
interface NavbarProps {
  isLoggedIn?: boolean;      /* Este utilizatorul logat? */
  showNavLinks?: boolean;    /* Afișăm linkurile de navigare? */
}

/* --- Componenta Navbar --- */
const Navbar = ({ isLoggedIn = false, showNavLinks = true }: NavbarProps) => {
  /* Hook pentru navigare între pagini */
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      {/* === LOGO - întotdeauna vizibil, click duce la pagina principală === */}
      <div className="navbar__logo" onClick={() => navigate('/')}>
        Logo
      </div>

      {/* === LINKURI DE NAVIGARE - afișate doar pe pagina Home === */}
      {showNavLinks && (
        <div className="navbar__links">
          <span className="navbar__link">About</span>
          <span className="navbar__link">Documnets</span>
          <span className="navbar__link">Editing</span>
          <span className="navbar__link">Contact Us</span>
        </div>
      )}

      {/* === ACȚIUNI DIN DREAPTA === */}
      <div className="navbar__actions">
        {isLoggedIn ? (
          /* --- După logare: notificări + avatar --- */
          <>
            {/* Iconița de notificări */}
            <div className="navbar__notification">
              <NotificationsNoneIcon />
            </div>
            {/* Avatarul utilizatorului - click duce la Settings */}
            <div className="navbar__avatar" onClick={() => navigate('/settings')}>
              <PersonOutlineIcon fontSize="small" />
            </div>
          </>
        ) : (
          /* --- Înainte de logare: butoane Sign In și Sign Up --- */
          <>
            {/* Butonul Sign In - duce la pagina de logare */}
            <button
              className="navbar__btn--signin"
              onClick={() => navigate('/signin')}
            >
              Sign In &gt;
            </button>
            {/* Butonul Sign Up - duce la pagina de înregistrare */}
            <button
              className="navbar__btn--signup"
              onClick={() => navigate('/signup')}
            >
              Sign up &gt;
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

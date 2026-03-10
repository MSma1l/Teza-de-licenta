/* ============================================
   PAGINA DE ÎNREGISTRARE (SIGN UP)

   Această pagină permite utilizatorului să-și
   creeze un cont nou. Conține:
   - Navbar cu butoane Sign In / Sign Up
   - Card centrat cu formular de înregistrare
   - 4 câmpuri: Name, Email, Contact number, Password
   - Buton de creare cont
   - Link către pagina de Sign In

   NOTĂ: Momentan este doar partea vizuală,
   fără logică de procesare a datelor.
   ============================================ */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* Importăm iconițele Material UI pentru câmpuri */
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LocalPhoneOutlinedIcon from '@mui/icons-material/LocalPhoneOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

/* Importăm componenta Navbar */
import Navbar from '../../components/Navbar/Navbar';

/* Importăm stilurile CSS ale paginii */
import './SignUp.css';

/* --- Componenta paginii de înregistrare --- */
const SignUp = () => {
  /* Hook pentru navigare programatică */
  const navigate = useNavigate();

  /* State pentru afișarea/ascunderea parolei */
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="signup-page">
      {/* === NAVBAR - fără linkuri de navigare, cu butoane auth === */}
      <Navbar isLoggedIn={false} showNavLinks={false} />

      {/* === CONȚINUTUL PRINCIPAL - card centrat === */}
      <div className="signup-page__content">
        {/* Elementele animate de fundal */}
        <div className="signup-page__bg-shapes">
          <div className="signup-page__shape signup-page__shape--1" />
          <div className="signup-page__shape signup-page__shape--2" />
          <div className="signup-page__shape signup-page__shape--3" />
          <div className="signup-page__shape signup-page__shape--4" />
          <div className="signup-page__shape signup-page__shape--5" />
        </div>

        <div className="signup-card">
          {/* --- Titlul cardului --- */}
          <h1 className="signup-card__title">Hello !</h1>

          {/* --- Formularul de înregistrare --- */}
          <form className="signup-card__form" onSubmit={(e) => e.preventDefault()}>
            {/* Câmpul NUME - cu iconița de persoană */}
            <div className="signup-card__input-group">
              <span className="signup-card__input-icon">
                <PersonOutlineIcon />
              </span>
              <input
                type="text"
                className="signup-card__input"
                placeholder="Name"
              />
            </div>

            {/* Câmpul EMAIL - cu iconița de email */}
            <div className="signup-card__input-group">
              <span className="signup-card__input-icon">
                <EmailOutlinedIcon />
              </span>
              <input
                type="email"
                className="signup-card__input"
                placeholder="Email"
              />
            </div>

            {/* Câmpul NUMĂR DE CONTACT - cu iconița de telefon */}
            <div className="signup-card__input-group">
              <span className="signup-card__input-icon">
                <LocalPhoneOutlinedIcon />
              </span>
              <input
                type="tel"
                className="signup-card__input"
                placeholder="Contact number"
              />
            </div>

            {/* Câmpul PAROLĂ - cu iconița de lacăt + buton ochi */}
            <div className="signup-card__input-group">
              <span className="signup-card__input-icon">
                <LockOutlinedIcon />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="signup-card__input"
                placeholder="Password"
              />
              {/* Buton pentru afișarea/ascunderea parolei */}
              <span
                className="signup-card__password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <VisibilityOutlinedIcon />
                ) : (
                  <VisibilityOffOutlinedIcon />
                )}
              </span>
            </div>

            {/* Butonul de creare cont */}
            <button type="submit" className="signup-card__submit">
              CREATE ACCOUNT
            </button>
          </form>

          {/* --- Footer-ul cardului cu link către Sign In --- */}
          <div className="signup-card__footer">
            <span className="signup-card__footer-link">
              Already registered?{' '}
            </span>
            <span
              className="signup-card__footer-link--bold"
              onClick={() => navigate('/signin')}
            >
              Sign In
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;

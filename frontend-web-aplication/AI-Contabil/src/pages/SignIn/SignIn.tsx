/* ============================================
   PAGINA DE LOGARE (SIGN IN)

   Această pagină permite utilizatorului să se
   logheze în cont. Conține:
   - Navbar cu butoane Sign In / Sign Up
   - Card centrat cu formular de logare
   - 2 câmpuri: Identificare + Password
   - Buton "SIGN IN"
   - Link către pagina de Sign Up

   NOTĂ: Momentan este doar partea vizuală,
   fără logică de autentificare.
   ============================================ */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* Importăm iconițele Material UI */
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

/* Importăm Navbar */
import Navbar from '../../components/Navbar/Navbar';

/* Importăm stilurile */
import './SignIn.css';

/* --- Componenta paginii de logare --- */
const SignIn = () => {
  const navigate = useNavigate();

  /* State pentru toggle vizibilitate parolă */
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="signin-page">
      {/* === NAVBAR - fără linkuri navigare === */}
      <Navbar isLoggedIn={false} showNavLinks={false} />

      {/* === CONȚINUT PRINCIPAL === */}
      <div className="signin-page__content">
        {/* Elementele animate de fundal */}
        <div className="signin-page__bg-shapes">
          <div className="signin-page__shape signin-page__shape--1" />
          <div className="signin-page__shape signin-page__shape--2" />
          <div className="signin-page__shape signin-page__shape--3" />
          <div className="signin-page__shape signin-page__shape--4" />
          <div className="signin-page__shape signin-page__shape--5" />
        </div>

        <div className="signin-card">
          {/* --- Titlu --- */}
          <h1 className="signin-card__title">Hello !</h1>

          {/* --- Formular de logare --- */}
          <form className="signin-card__form" onSubmit={(e) => e.preventDefault()}>
            {/* Câmpul de identificare (Name, Email sau Contact number) */}
            <div className="signin-card__input-group">
              <span className="signin-card__input-icon">
                <PersonOutlineIcon />
              </span>
              <input
                type="text"
                className="signin-card__input"
                placeholder="Name, Email, Contact number"
              />
            </div>

            {/* Câmpul parolă cu toggle vizibilitate */}
            <div className="signin-card__input-group">
              <span className="signin-card__input-icon">
                <LockOutlinedIcon />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="signin-card__input"
                placeholder="Password"
              />
              {/* Buton ochi - toggle parolă vizibilă/ascunsă */}
              <span
                className="signin-card__password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <VisibilityOutlinedIcon />
                ) : (
                  <VisibilityOffOutlinedIcon />
                )}
              </span>
            </div>

            {/* Butonul de logare */}
            <button type="submit" className="signin-card__submit">
              SIGN IN
            </button>
          </form>

          {/* --- Link către Sign Up --- */}
          <div className="signin-card__footer">
            <span className="signin-card__footer-link">
              Already registered?{' '}
            </span>
            <span
              className="signin-card__footer-link--bold"
              onClick={() => navigate('/signup')}
            >
              Sign up
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;

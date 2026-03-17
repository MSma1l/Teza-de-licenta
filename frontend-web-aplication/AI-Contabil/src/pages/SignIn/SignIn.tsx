/* ============================================
   PAGINA DE LOGARE (SIGN IN)

   Permite utilizatorului să se logheze în cont.
   Conectat la backend-ul real prin AuthContext.
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

/* Importăm AuthContext */
import { useAuth } from '../../context/AuthContext';

/* Importăm stilurile */
import './SignIn.css';

/* --- Componenta paginii de logare --- */
const SignIn = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  /* State pentru câmpuri */
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /* Handler pentru submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Completează toate câmpurile');
      return;
    }

    setLoading(true);
    try {
      await login({ username: username.trim(), password });
      navigate('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la autentificare');
    } finally {
      setLoading(false);
    }
  };

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

          {/* --- Mesaj de eroare --- */}
          {error && <p className="signin-card__error">{error}</p>}

          {/* --- Formular de logare --- */}
          <form className="signin-card__form" onSubmit={handleSubmit}>
            {/* Câmpul de identificare */}
            <div className="signin-card__input-group">
              <span className="signin-card__input-icon">
                <PersonOutlineIcon />
              </span>
              <input
                type="text"
                className="signin-card__input"
                placeholder="Name, Email, Contact number"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
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
            <button type="submit" className="signin-card__submit" disabled={loading}>
              {loading ? 'SE CONECTEAZĂ...' : 'SIGN IN'}
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

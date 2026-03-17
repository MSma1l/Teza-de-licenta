/* ============================================
   PAGINA DE ÎNREGISTRARE (SIGN UP)

   Permite utilizatorului să-și creeze un cont nou.
   Conectat la backend-ul real prin AuthContext.
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

/* Importăm AuthContext */
import { useAuth } from '../../context/AuthContext';

/* Importăm stilurile CSS ale paginii */
import './SignUp.css';

/* --- Componenta paginii de înregistrare --- */
const SignUp = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  /* State pentru câmpuri */
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /* Handler pentru submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('Completează toate câmpurile obligatorii');
      return;
    }

    if (username.trim().length < 3) {
      setError('Username-ul trebuie să aibă minim 3 caractere');
      return;
    }

    if (password.length < 6) {
      setError('Parola trebuie să aibă minim 6 caractere');
      return;
    }

    setLoading(true);
    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      });
      navigate('/signin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la înregistrare');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      {/* === NAVBAR === */}
      <Navbar isLoggedIn={false} showNavLinks={false} />

      {/* === CONȚINUTUL PRINCIPAL === */}
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

          {/* --- Mesaj de eroare --- */}
          {error && <p className="signup-card__error">{error}</p>}

          {/* --- Formularul de înregistrare --- */}
          <form className="signup-card__form" onSubmit={handleSubmit}>
            {/* Câmpul NUME */}
            <div className="signup-card__input-group">
              <span className="signup-card__input-icon">
                <PersonOutlineIcon />
              </span>
              <input
                type="text"
                className="signup-card__input"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Câmpul EMAIL */}
            <div className="signup-card__input-group">
              <span className="signup-card__input-icon">
                <EmailOutlinedIcon />
              </span>
              <input
                type="email"
                className="signup-card__input"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Câmpul NUMĂR DE CONTACT */}
            <div className="signup-card__input-group">
              <span className="signup-card__input-icon">
                <LocalPhoneOutlinedIcon />
              </span>
              <input
                type="tel"
                className="signup-card__input"
                placeholder="Contact number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Câmpul PAROLĂ */}
            <div className="signup-card__input-group">
              <span className="signup-card__input-icon">
                <LockOutlinedIcon />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="signup-card__input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
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
            <button type="submit" className="signup-card__submit" disabled={loading}>
              {loading ? 'SE CREEAZĂ...' : 'CREATE ACCOUNT'}
            </button>
          </form>

          {/* --- Footer-ul cardului --- */}
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

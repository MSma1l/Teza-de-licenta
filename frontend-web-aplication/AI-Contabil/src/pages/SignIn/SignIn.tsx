import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

import Navbar from '../../components/Navbar/Navbar';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { initiateQrLogin, getQrLoginStatus, fetchQrLoginImage } from '../../api/qrLoginApi';

const t = {
  ro: {
    title: 'Bine ai venit!',
    userPlaceholder: 'Nume, Email sau Telefon',
    passPlaceholder: 'Parola',
    submit: 'LOGARE',
    loading: 'SE CONECTEAZA...',
    noAccount: 'Nu ai cont?',
    register: 'Inregistreaza-te',
    errorEmpty: 'Completeaza toate campurile',
    errorGeneric: 'Eroare la autentificare',
    tabPassword: 'Parola',
    tabQr: 'Cod QR',
    qrTitle: 'Logare prin QR',
    qrSubtitle: 'Scaneaza acest cod cu aplicatia mobila ai-contabil',
    qrExpiresIn: 'Expira in',
    qrExpired: 'QR-ul a expirat',
    qrLoading: 'Se genereaza QR...',
    qrApproved: 'Logat cu succes!',
    qrError: 'Eroare la generare. Reincearca.',
    qrRetry: 'Genereaza nou',
  },
  en: {
    title: 'Welcome!',
    userPlaceholder: 'Name, Email or Phone',
    passPlaceholder: 'Password',
    submit: 'LOGIN',
    loading: 'CONNECTING...',
    noAccount: "Don't have an account?",
    register: 'Register',
    errorEmpty: 'Fill in all fields',
    errorGeneric: 'Authentication error',
    tabPassword: 'Password',
    tabQr: 'QR Code',
    qrTitle: 'Login with QR',
    qrSubtitle: 'Scan this code with the ai-contabil mobile app',
    qrExpiresIn: 'Expires in',
    qrExpired: 'QR expired',
    qrLoading: 'Generating QR...',
    qrApproved: 'Logged in successfully!',
    qrError: 'Generation error. Retry.',
    qrRetry: 'Generate new',
  },
  ru: {
    title: 'Добро пожаловать!',
    userPlaceholder: 'Имя, Email или Телефон',
    passPlaceholder: 'Пароль',
    submit: 'ВХОД',
    loading: 'ПОДКЛЮЧЕНИЕ...',
    noAccount: 'Нет аккаунта?',
    register: 'Зарегистрироваться',
    errorEmpty: 'Заполните все поля',
    errorGeneric: 'Ошибка аутентификации',
    tabPassword: 'Пароль',
    tabQr: 'QR-код',
    qrTitle: 'Вход через QR',
    qrSubtitle: 'Отсканируйте этот код мобильным приложением ai-contabil',
    qrExpiresIn: 'Истекает через',
    qrExpired: 'QR истёк',
    qrLoading: 'Генерация QR...',
    qrApproved: 'Успешный вход!',
    qrError: 'Ошибка генерации. Попробуйте снова.',
    qrRetry: 'Создать новый',
  },
};

const SignIn = () => {
  const navigate = useNavigate();
  const { login, setSession } = useAuth();
  const { lang } = useLanguage();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Tab + QR state
  const [tab, setTab] = useState<'password' | 'qr'>('password');
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [qrSecondsLeft, setQrSecondsLeft] = useState(0);
  const [qrStatus, setQrStatus] = useState<'idle' | 'loading' | 'pending' | 'approved' | 'expired' | 'error'>('idle');
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tr = t[lang];

  // Curatare timers la unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (qrImageUrl) URL.revokeObjectURL(qrImageUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Genereaza QR cand utilizatorul deschide tab-ul "qr"
  const generateQr = async () => {
    setQrStatus('loading');
    if (qrImageUrl) URL.revokeObjectURL(qrImageUrl);
    setQrImageUrl(null);
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    try {
      const session = await initiateQrLogin();
      const expiresMs = new Date(session.expires_at).getTime();
      setQrSecondsLeft(Math.max(0, Math.floor((expiresMs - Date.now()) / 1000)));

      const imgUrl = await fetchQrLoginImage(session.qr_token);
      setQrImageUrl(imgUrl);
      setQrStatus('pending');

      // Polling status la 2 secunde
      pollIntervalRef.current = setInterval(async () => {
        try {
          const status = await getQrLoginStatus(session.session_token);
          if (status.status === 'approved' && status.access_token && status.refresh_token) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
            setQrStatus('approved');
            await setSession(status.access_token, status.refresh_token);
            setTimeout(() => navigate('/home'), 800);
          } else if (status.status === 'expired') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
            setQrStatus('expired');
          }
        } catch {
          // ignora erori temporare de retea
        }
      }, 2000);

      // Countdown la 1 secunda
      countdownRef.current = setInterval(() => {
        setQrSecondsLeft((s) => {
          if (s <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch {
      setQrStatus('error');
    }
  };

  const handleTabChange = (newTab: 'password' | 'qr') => {
    setTab(newTab);
    if (newTab === 'qr' && qrStatus === 'idle') {
      generateQr();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError(tr.errorEmpty);
      return;
    }

    setLoading(true);
    try {
      await login({ username: username.trim(), password });
      navigate('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : tr.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d1b2a] via-[#1b2a4a] to-[#0a1628] bg-[length:400%_400%] animate-auth-gradient flex flex-col relative overflow-hidden">
      <Navbar isLoggedIn={false} showNavLinks={false} />

      <div className="flex-1 flex justify-center items-center p-8 relative z-[1]">
        {/* Forme animate de fundal */}
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
          <div className="absolute rounded-full blur-[80px] opacity-35 animate-float-1" style={{ width: 400, height: 400, top: -100, left: -100, background: 'radial-gradient(circle, #8a9a6a, #6b7a4e)' }} />
          <div className="absolute rounded-full blur-[80px] opacity-35 animate-float-2" style={{ width: 350, height: 350, bottom: -80, right: -80, background: 'radial-gradient(circle, #2a5a6a, #1a3a4a)' }} />
          <div className="absolute rounded-full blur-[80px] opacity-35 animate-float-3" style={{ width: 200, height: 200, top: '40%', right: '15%', background: 'radial-gradient(circle, #3a8a8a, #1a5a6a)' }} />
          <div className="absolute rounded-full blur-[80px] opacity-35 animate-float-4" style={{ width: 180, height: 180, bottom: '20%', left: '10%', background: 'radial-gradient(circle, #a8b878, #8a9a6a)' }} />
          <div className="absolute rounded-full blur-[80px] opacity-35 animate-float-5" style={{ width: 150, height: 150, top: '15%', left: '55%', background: 'radial-gradient(circle, #4a7a8a, #2a5a6a)' }} />
        </div>

        <div className="bg-white/95 backdrop-blur-[20px] border border-white/20 rounded-xl px-16 max-md:px-8 py-12 w-full max-w-[480px] relative z-[2] animate-scale-in shadow-[0_8px_40px_rgba(0,0,0,0.3),0_0_80px_rgba(138,154,106,0.08)]">
          <h1 className="font-heading text-[2rem] font-bold text-primary text-center mb-6">{tr.title}</h1>

          {/* Tab switcher */}
          <div className="flex bg-neutral-100 rounded-full p-1 mb-6">
            <button
              type="button"
              onClick={() => handleTabChange('password')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-bold transition-all ${
                tab === 'password' ? 'bg-white text-[#4f46e5] shadow-sm' : 'text-neutral-500'
              }`}
            >
              <KeyboardIcon style={{ fontSize: 18 }} />
              {tr.tabPassword}
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('qr')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-bold transition-all ${
                tab === 'qr' ? 'bg-white text-[#4f46e5] shadow-sm' : 'text-neutral-500'
              }`}
            >
              <QrCodeScannerIcon style={{ fontSize: 18 }} />
              {tr.tabQr}
            </button>
          </div>

          {tab === 'qr' ? (
            <div className="flex flex-col items-center text-center">
              <p className="text-sm text-neutral-500 mb-5">{tr.qrSubtitle}</p>

              {qrStatus === 'loading' && (
                <div className="w-[220px] h-[220px] bg-neutral-100 rounded-2xl flex items-center justify-center">
                  <div className="w-10 h-10 border-4 border-[#4f46e5]/20 border-t-[#4f46e5] rounded-full animate-spin" />
                </div>
              )}

              {qrStatus === 'pending' && qrImageUrl && (
                <>
                  <div className="p-4 bg-white border-4 border-neutral-100 rounded-2xl">
                    <img src={qrImageUrl} alt="QR Login" width={220} height={220} />
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-neutral-500">
                    <HourglassEmptyIcon style={{ fontSize: 16 }} />
                    <span>{tr.qrExpiresIn}</span>
                    <span className="font-bold text-[#4f46e5]">{formatTime(qrSecondsLeft)}</span>
                  </div>
                </>
              )}

              {qrStatus === 'approved' && (
                <div className="py-8">
                  <div className="text-6xl mb-3">&#10004;</div>
                  <p className="text-lg font-bold text-green-600">{tr.qrApproved}</p>
                </div>
              )}

              {qrStatus === 'expired' && (
                <div className="py-6">
                  <p className="text-red-500 mb-4">{tr.qrExpired}</p>
                  <button
                    type="button"
                    onClick={generateQr}
                    className="btn-gradient px-6 py-2 rounded-full text-sm font-bold"
                  >
                    {tr.qrRetry}
                  </button>
                </div>
              )}

              {qrStatus === 'error' && (
                <div className="py-6">
                  <p className="text-red-500 mb-4">{tr.qrError}</p>
                  <button
                    type="button"
                    onClick={generateQr}
                    className="btn-gradient px-6 py-2 rounded-full text-sm font-bold"
                  >
                    {tr.qrRetry}
                  </button>
                </div>
              )}
            </div>
          ) : (
          <>
          {error && <p className="text-red-600 text-sm text-center mb-4">{error}</p>}

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="flex items-center gap-3 bg-input-bg rounded-full px-5 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow duration-200 focus-within:shadow-[0_2px_12px_rgba(0,0,0,0.15)]">
              <span className="text-neutral-400 flex items-center">
                <PersonOutlineIcon />
              </span>
              <input
                type="text"
                className="flex-1 bg-transparent text-base text-primary font-medium placeholder:text-primary placeholder:font-medium"
                placeholder={tr.userPlaceholder}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="flex items-center gap-3 bg-input-bg rounded-full px-5 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow duration-200 focus-within:shadow-[0_2px_12px_rgba(0,0,0,0.15)]">
              <span className="text-neutral-400 flex items-center">
                <LockOutlinedIcon />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="flex-1 bg-transparent text-base text-primary font-medium placeholder:text-primary placeholder:font-medium"
                placeholder={tr.passPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <span
                className="text-neutral-400 cursor-pointer flex items-center transition-colors duration-200 hover:text-primary"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
              </span>
            </div>

            <button
              type="submit"
              className="btn-gradient mt-3 px-8 py-3 rounded-full text-base tracking-[1px] self-center font-bold"
              disabled={loading}
            >
              {loading ? tr.loading : tr.submit}
            </button>
          </form>
          </>
          )}

          <div className="text-center mt-5 text-sm text-neutral-500">
            <span>{tr.noAccount} </span>
            <span
              className="font-bold text-neutral-black cursor-pointer transition-colors duration-200 hover:text-primary"
              onClick={() => navigate('/signup')}
            >
              {tr.register}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;

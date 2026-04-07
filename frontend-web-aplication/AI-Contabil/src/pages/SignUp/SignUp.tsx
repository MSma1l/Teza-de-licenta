import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LocalPhoneOutlinedIcon from '@mui/icons-material/LocalPhoneOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import BusinessIcon from '@mui/icons-material/Business';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';

import Navbar from '../../components/Navbar/Navbar';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const t = {
  ro: {
    title: 'Inregistrare',
    stepAccount: 'Cont',
    stepCompany: 'Companie',
    username: 'Nume utilizator',
    email: 'Email',
    phone: 'Numar de telefon',
    password: 'Parola',
    confirmPassword: 'Confirma parola',
    companyName: 'Denumirea companiei',
    idno: 'IDNO / Cod fiscal',
    vatCode: 'Cod TVA (daca este cazul)',
    legalAddress: 'Adresa juridica',
    bankName: 'Banca',
    iban: 'Cont bancar / IBAN',
    directorName: 'Administrator / Director',
    next: 'URMATORUL',
    back: 'INAPOI',
    submit: 'CREAZA CONT',
    loading: 'SE CREAZA...',
    hasAccount: 'Ai deja un cont?',
    login: 'Logheaza-te',
    errorEmpty: 'Completeaza toate campurile obligatorii',
    errorUserMin: 'Numele trebuie sa aiba minim 3 caractere',
    errorPassMin: 'Parola: minim 8 caractere, 1 majuscula, 1 minuscula, 1 cifra',
    errorPassMatch: 'Parolele nu coincid',
    errorCompany: 'Completeaza denumirea companiei si IDNO',
    errorGeneric: 'Eroare la inregistrare',
  },
  en: {
    title: 'Registration',
    stepAccount: 'Account',
    stepCompany: 'Company',
    username: 'Username',
    email: 'Email',
    phone: 'Phone number',
    password: 'Password',
    confirmPassword: 'Confirm password',
    companyName: 'Company name',
    idno: 'IDNO / Tax ID',
    vatCode: 'VAT code (if applicable)',
    legalAddress: 'Legal address',
    bankName: 'Bank name',
    iban: 'Bank account / IBAN',
    directorName: 'Administrator / Director',
    next: 'NEXT',
    back: 'BACK',
    submit: 'CREATE ACCOUNT',
    loading: 'CREATING...',
    hasAccount: 'Already have an account?',
    login: 'Log in',
    errorEmpty: 'Fill in all required fields',
    errorUserMin: 'Username must be at least 3 characters',
    errorPassMin: 'Password: min 8 chars, 1 uppercase, 1 lowercase, 1 digit',
    errorPassMatch: 'Passwords do not match',
    errorCompany: 'Fill in company name and IDNO',
    errorGeneric: 'Registration error',
  },
  ru: {
    title: 'Регистрация',
    stepAccount: 'Аккаунт',
    stepCompany: 'Компания',
    username: 'Имя пользователя',
    email: 'Электронная почта',
    phone: 'Номер телефона',
    password: 'Пароль',
    confirmPassword: 'Подтвердите пароль',
    companyName: 'Название компании',
    idno: 'IDNO / Налоговый код',
    vatCode: 'Код НДС (если применимо)',
    legalAddress: 'Юридический адрес',
    bankName: 'Банк',
    iban: 'Банковский счёт / IBAN',
    directorName: 'Администратор / Директор',
    next: 'ДАЛЕЕ',
    back: 'НАЗАД',
    submit: 'СОЗДАТЬ АККАУНТ',
    loading: 'СОЗДАНИЕ...',
    hasAccount: 'Уже есть аккаунт?',
    login: 'Войти',
    errorEmpty: 'Заполните все обязательные поля',
    errorUserMin: 'Имя должно быть не менее 3 символов',
    errorPassMin: 'Пароль: мин. 8 символов, 1 заглавная, 1 строчная, 1 цифра',
    errorPassMatch: 'Пароли не совпадают',
    errorCompany: 'Заполните название компании и IDNO',
    errorGeneric: 'Ошибка регистрации',
  },
};

const inputWrapClass = "flex items-center gap-3 bg-input-bg rounded-full px-5 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow duration-200 focus-within:shadow-[0_2px_12px_rgba(0,0,0,0.15)]";
const inputClass = "flex-1 bg-transparent text-base text-primary font-medium placeholder:text-primary/60 placeholder:font-medium";
const iconClass = "text-neutral-400 flex items-center";

const SignUp = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { lang } = useLanguage();

  const [step, setStep] = useState<1 | 2>(1);

  // Account fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Company fields
  const [companyName, setCompanyName] = useState('');
  const [idno, setIdno] = useState('');
  const [vatCode, setVatCode] = useState('');
  const [legalAddress, setLegalAddress] = useState('');
  const [bankName, setBankName] = useState('');
  const [iban, setIban] = useState('');
  const [directorName, setDirectorName] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const tr = t[lang];

  const validateStep1 = () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError(tr.errorEmpty);
      return false;
    }
    if (username.trim().length < 3 || username.trim().length > 100) {
      setError(tr.errorUserMin);
      return false;
    }
    if (password.length < 8 || password.length > 128) {
      setError(tr.errorPassMin);
      return false;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      setError(tr.errorPassMin);
      return false;
    }
    if (password !== confirmPassword) {
      setError(tr.errorPassMatch);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!companyName.trim() || !idno.trim()) {
      setError(tr.errorCompany);
      return;
    }

    setLoading(true);
    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        company_name: companyName.trim(),
        idno: idno.trim(),
        vat_code: vatCode.trim() || undefined,
        legal_address: legalAddress.trim() || undefined,
        bank_name: bankName.trim() || undefined,
        iban: iban.trim() || undefined,
        director_name: directorName.trim() || undefined,
      });
      navigate('/signin');
    } catch (err) {
      setError(err instanceof Error ? err.message : tr.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d1b2a] via-[#1b2a4a] to-[#0a1628] bg-[length:400%_400%] animate-auth-gradient flex flex-col relative overflow-hidden">
      <Navbar isLoggedIn={false} showNavLinks={false} />

      <div className="flex-1 flex justify-center items-center p-8 relative z-[1]">
        {/* Background shapes */}
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
          <div className="absolute rounded-full blur-[80px] opacity-35 animate-float-2" style={{ width: 420, height: 420, top: -120, right: -80, background: 'radial-gradient(circle, #8a9a6a, #6b7a4e)' }} />
          <div className="absolute rounded-full blur-[80px] opacity-35 animate-float-1" style={{ width: 380, height: 380, bottom: -100, left: -100, background: 'radial-gradient(circle, #2a5a6a, #1a3a4a)' }} />
          <div className="absolute rounded-full blur-[80px] opacity-35 animate-float-3" style={{ width: 220, height: 220, top: '35%', left: '12%', background: 'radial-gradient(circle, #3a8a8a, #1a5a6a)' }} />
          <div className="absolute rounded-full blur-[80px] opacity-35 animate-float-5" style={{ width: 170, height: 170, top: '25%', right: '15%', background: 'radial-gradient(circle, #a8b878, #8a9a6a)' }} />
          <div className="absolute rounded-full blur-[80px] opacity-35 animate-float-4" style={{ width: 160, height: 160, bottom: '15%', left: '45%', background: 'radial-gradient(circle, #4a7a8a, #2a5a6a)' }} />
        </div>

        <div className="bg-white/95 backdrop-blur-[20px] border border-white/20 rounded-xl px-16 py-10 w-full max-w-[540px] relative z-[2] animate-scale-in shadow-[0_8px_40px_rgba(0,0,0,0.3),0_0_80px_rgba(138,154,106,0.08)]">
          <h1 className="font-heading text-[2rem] font-bold text-primary text-center mb-4">{tr.title}</h1>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${
              step === 1 ? 'btn-gradient text-white' : 'bg-neutral-100 text-neutral-400'
            }`}>
              <span className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-xs font-bold">1</span>
              {tr.stepAccount}
            </div>
            <div className="w-8 h-[2px] bg-neutral-200 rounded-full" />
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${
              step === 2 ? 'btn-gradient text-white' : 'bg-neutral-100 text-neutral-400'
            }`}>
              <span className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-xs font-bold">2</span>
              {tr.stepCompany}
            </div>
          </div>

          {error && <p className="text-red-600 text-sm text-center mb-4">{error}</p>}

          {/* Step 1: Account */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div className={inputWrapClass}>
                <span className={iconClass}><PersonOutlineIcon /></span>
                <input type="text" className={inputClass} placeholder={tr.username} value={username} onChange={(e) => setUsername(e.target.value)} maxLength={100} />
              </div>

              <div className={inputWrapClass}>
                <span className={iconClass}><EmailOutlinedIcon /></span>
                <input type="email" className={inputClass} placeholder={tr.email} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className={inputWrapClass}>
                <span className={iconClass}><LocalPhoneOutlinedIcon /></span>
                <input type="tel" className={inputClass} placeholder={tr.phone} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <div className={inputWrapClass}>
                <span className={iconClass}><LockOutlinedIcon /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={inputClass}
                  placeholder={tr.password}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={128}
                />
                <span className="text-neutral-400 cursor-pointer flex items-center transition-colors duration-200 hover:text-primary" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
                </span>
              </div>

              <div className={inputWrapClass}>
                <span className={iconClass}><LockOutlinedIcon /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={inputClass}
                  placeholder={tr.confirmPassword}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  maxLength={128}
                />
              </div>

              <button
                type="button"
                className="btn-gradient mt-2 px-8 py-3 rounded-full text-base tracking-[1px] self-center font-bold"
                onClick={handleNext}
              >
                {tr.next} &rarr;
              </button>
            </div>
          )}

          {/* Step 2: Company */}
          {step === 2 && (
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className={inputWrapClass}>
                <span className={iconClass}><BusinessIcon /></span>
                <input type="text" className={inputClass} placeholder={tr.companyName + ' *'} value={companyName} onChange={(e) => setCompanyName(e.target.value)} disabled={loading} maxLength={200} />
              </div>

              <div className={inputWrapClass}>
                <span className={iconClass}><BadgeOutlinedIcon /></span>
                <input type="text" className={inputClass} placeholder={tr.idno + ' *'} value={idno} onChange={(e) => setIdno(e.target.value)} disabled={loading} maxLength={13} />
              </div>

              <div className={inputWrapClass}>
                <span className={iconClass}><BadgeOutlinedIcon /></span>
                <input type="text" className={inputClass} placeholder={tr.vatCode} value={vatCode} onChange={(e) => setVatCode(e.target.value)} disabled={loading} />
              </div>

              <div className={inputWrapClass}>
                <span className={iconClass}><LocationOnOutlinedIcon /></span>
                <input type="text" className={inputClass} placeholder={tr.legalAddress} value={legalAddress} onChange={(e) => setLegalAddress(e.target.value)} disabled={loading} maxLength={300} />
              </div>

              <div className={inputWrapClass}>
                <span className={iconClass}><AccountBalanceOutlinedIcon /></span>
                <input type="text" className={inputClass} placeholder={tr.bankName} value={bankName} onChange={(e) => setBankName(e.target.value)} disabled={loading} />
              </div>

              <div className={inputWrapClass}>
                <span className={iconClass}><CreditCardOutlinedIcon /></span>
                <input type="text" className={inputClass} placeholder={tr.iban} value={iban} onChange={(e) => setIban(e.target.value)} disabled={loading} maxLength={34} />
              </div>

              <div className={inputWrapClass}>
                <span className={iconClass}><PersonOutlineIcon /></span>
                <input type="text" className={inputClass} placeholder={tr.directorName} value={directorName} onChange={(e) => setDirectorName(e.target.value)} disabled={loading} />
              </div>

              <div className="flex gap-3 mt-2 justify-center">
                <button
                  type="button"
                  className="px-6 py-3 rounded-full text-base font-bold border-2 border-neutral-300 text-neutral-600 hover:border-primary hover:text-primary transition-all duration-200 cursor-pointer"
                  onClick={() => { setError(''); setStep(1); }}
                >
                  &larr; {tr.back}
                </button>
                <button
                  type="submit"
                  className="btn-gradient px-8 py-3 rounded-full text-base tracking-[1px] font-bold"
                  disabled={loading}
                >
                  {loading ? tr.loading : tr.submit}
                </button>
              </div>
            </form>
          )}

          <div className="text-center mt-5 text-sm text-neutral-500">
            <span>{tr.hasAccount} </span>
            <span
              className="font-bold text-neutral-black cursor-pointer transition-colors duration-200 hover:text-primary"
              onClick={() => navigate('/signin')}
            >
              {tr.login}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;

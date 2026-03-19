import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LocalPhoneOutlinedIcon from '@mui/icons-material/LocalPhoneOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import Navbar from '../../components/Navbar/Navbar';
import { useAuth } from '../../context/AuthContext';

const SignUp = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-[#0d1b2a] via-[#1b2a4a] to-[#0a1628] bg-[length:400%_400%] animate-auth-gradient flex flex-col relative overflow-hidden">
      <Navbar isLoggedIn={false} showNavLinks={false} />

      <div className="flex-1 flex justify-center items-center p-8 relative z-[1]">
        {/* Forme animate de fundal */}
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
          <div
            className="absolute rounded-full blur-[80px] opacity-35 animate-float-2"
            style={{ width: 420, height: 420, top: -120, right: -80, background: 'radial-gradient(circle, #8a9a6a, #6b7a4e)' }}
          />
          <div
            className="absolute rounded-full blur-[80px] opacity-35 animate-float-1"
            style={{ width: 380, height: 380, bottom: -100, left: -100, background: 'radial-gradient(circle, #2a5a6a, #1a3a4a)' }}
          />
          <div
            className="absolute rounded-full blur-[80px] opacity-35 animate-float-3"
            style={{ width: 220, height: 220, top: '35%', left: '12%', background: 'radial-gradient(circle, #3a8a8a, #1a5a6a)' }}
          />
          <div
            className="absolute rounded-full blur-[80px] opacity-35 animate-float-5"
            style={{ width: 170, height: 170, top: '25%', right: '15%', background: 'radial-gradient(circle, #a8b878, #8a9a6a)' }}
          />
          <div
            className="absolute rounded-full blur-[80px] opacity-35 animate-float-4"
            style={{ width: 160, height: 160, bottom: '15%', left: '45%', background: 'radial-gradient(circle, #4a7a8a, #2a5a6a)' }}
          />
        </div>

        <div className="bg-white/95 backdrop-blur-[20px] border border-white/20 rounded-xl px-16 py-12 w-full max-w-[520px] relative z-[2] animate-scale-in shadow-[0_8px_40px_rgba(0,0,0,0.3),0_0_80px_rgba(138,154,106,0.08)]">
          <h1 className="font-heading text-[2rem] font-bold text-primary text-center mb-8">Hello !</h1>

          {error && <p className="text-red-600 text-sm text-center mb-4">{error}</p>}

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="flex items-center gap-3 bg-input-bg rounded-full px-5 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow duration-200 focus-within:shadow-[0_2px_12px_rgba(0,0,0,0.15)]">
              <span className="text-neutral-400 flex items-center"><PersonOutlineIcon /></span>
              <input
                type="text"
                className="flex-1 bg-transparent text-base text-primary font-medium placeholder:text-primary placeholder:font-medium"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="flex items-center gap-3 bg-input-bg rounded-full px-5 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow duration-200 focus-within:shadow-[0_2px_12px_rgba(0,0,0,0.15)]">
              <span className="text-neutral-400 flex items-center"><EmailOutlinedIcon /></span>
              <input
                type="email"
                className="flex-1 bg-transparent text-base text-primary font-medium placeholder:text-primary placeholder:font-medium"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="flex items-center gap-3 bg-input-bg rounded-full px-5 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow duration-200 focus-within:shadow-[0_2px_12px_rgba(0,0,0,0.15)]">
              <span className="text-neutral-400 flex items-center"><LocalPhoneOutlinedIcon /></span>
              <input
                type="tel"
                className="flex-1 bg-transparent text-base text-primary font-medium placeholder:text-primary placeholder:font-medium"
                placeholder="Contact number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="flex items-center gap-3 bg-input-bg rounded-full px-5 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow duration-200 focus-within:shadow-[0_2px_12px_rgba(0,0,0,0.15)]">
              <span className="text-neutral-400 flex items-center"><LockOutlinedIcon /></span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="flex-1 bg-transparent text-base text-primary font-medium placeholder:text-primary placeholder:font-medium"
                placeholder="Password"
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
              className="mt-3 px-8 py-3 bg-primary text-white rounded-full text-base font-semibold tracking-[1px] self-center transition-all duration-200 hover:bg-primary-light hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'SE CREEAZĂ...' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <div className="text-center mt-5 text-sm text-neutral-500">
            <span className="text-primary cursor-pointer">Already registered? </span>
            <span
              className="font-bold text-neutral-black cursor-pointer transition-colors duration-200 hover:text-primary"
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

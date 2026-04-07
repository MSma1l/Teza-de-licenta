import { useState } from 'react';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LocalPhoneOutlinedIcon from '@mui/icons-material/LocalPhoneOutlined';
import BusinessIcon from '@mui/icons-material/Business';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useLanguage } from '../../../context/LanguageContext';
import type { Lang } from '../../../context/LanguageContext';

const t: Record<Lang, {
  label: string;
  title: string;
  subtitle: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  submit: string;
  success: string;
  benefits: string[];
}> = {
  ro: {
    label: 'Consultare',
    title: 'Inscrie-te la o consultare gratuita',
    subtitle: 'Specialistii nostri te vor ajuta sa intelegi cum AI-Contabil poate automatiza contabilitatea afacerii tale',
    name: 'Numele complet',
    email: 'Adresa de email',
    phone: 'Numar de telefon',
    company: 'Denumirea companiei',
    message: 'Mesajul tau (optional)',
    submit: 'Trimite cererea',
    success: 'Cererea a fost trimisa cu succes! Va vom contacta in curand.',
    benefits: [
      'Consultare gratuita de 30 minute',
      'Analiza personalizata a nevoilor tale',
      'Demo live al platformei AI-Contabil',
      'Fara obligatii sau angajamente',
    ],
  },
  en: {
    label: 'Consultation',
    title: 'Sign up for a free consultation',
    subtitle: 'Our specialists will help you understand how AI-Contabil can automate your business accounting',
    name: 'Full name',
    email: 'Email address',
    phone: 'Phone number',
    company: 'Company name',
    message: 'Your message (optional)',
    submit: 'Send request',
    success: 'Request sent successfully! We will contact you soon.',
    benefits: [
      'Free 30-minute consultation',
      'Personalized needs analysis',
      'Live demo of AI-Contabil platform',
      'No obligations or commitments',
    ],
  },
  ru: {
    label: 'Консультация',
    title: 'Запишитесь на бесплатную консультацию',
    subtitle: 'Наши специалисты помогут вам понять, как AI-Contabil может автоматизировать бухгалтерию вашего бизнеса',
    name: 'Полное имя',
    email: 'Электронная почта',
    phone: 'Номер телефона',
    company: 'Название компании',
    message: 'Ваше сообщение (необязательно)',
    submit: 'Отправить заявку',
    success: 'Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.',
    benefits: [
      'Бесплатная 30-минутная консультация',
      'Персонализированный анализ потребностей',
      'Живая демонстрация платформы AI-Contabil',
      'Без обязательств',
    ],
  },
};

const inputWrap = "flex items-center gap-3 bg-neutral-50 rounded-xl px-5 py-3.5 border border-neutral-200 transition-all duration-200 focus-within:border-[#4f46e5] focus-within:shadow-[0_0_0_3px_rgba(79,70,229,0.1)]";
const inputClass = "flex-1 bg-transparent text-base text-neutral-black font-medium placeholder:text-neutral-400";

const ConnectSection = () => {
  const { lang } = useLanguage();
  const tr = t[lang];
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <section id="contact" className="py-16 border-t border-neutral-200">
      <div className="text-center mb-10">
        <span
          className="inline-block text-sm font-semibold mb-2"
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {tr.label}
        </span>
        <h2 className="font-heading text-[2.2rem] font-semibold text-neutral-black mb-3">
          {tr.title}
        </h2>
        <p className="text-lg text-neutral-500 max-w-[600px] mx-auto">
          {tr.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-2 max-md:grid-cols-1 gap-12 items-start">
        {/* Benefits */}
        <div className="flex flex-col gap-5 pt-4">
          {tr.benefits.map((b, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)' }}>
                <CheckCircleOutlineIcon style={{ fontSize: 20, color: '#fff' }} />
              </div>
              <span className="text-lg text-neutral-700 font-medium pt-1.5">{b}</span>
            </div>
          ))}
        </div>

        {/* Form */}
        {sent ? (
          <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-gradient-to-br from-[#eef2ff] to-[#e0f2fe] text-center">
            <CheckCircleOutlineIcon style={{ fontSize: 56, color: '#4f46e5' }} />
            <p className="text-xl font-semibold text-neutral-black mt-4">{tr.success}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-8 rounded-2xl border border-neutral-200 bg-white shadow-lg">
            <div className={inputWrap}>
              <PersonOutlineIcon className="text-neutral-400" />
              <input type="text" className={inputClass} placeholder={tr.name} required />
            </div>
            <div className={inputWrap}>
              <EmailOutlinedIcon className="text-neutral-400" />
              <input type="email" className={inputClass} placeholder={tr.email} required />
            </div>
            <div className={inputWrap}>
              <LocalPhoneOutlinedIcon className="text-neutral-400" />
              <input type="tel" className={inputClass} placeholder={tr.phone} />
            </div>
            <div className={inputWrap}>
              <BusinessIcon className="text-neutral-400" />
              <input type="text" className={inputClass} placeholder={tr.company} />
            </div>
            <textarea
              className="bg-neutral-50 rounded-xl px-5 py-3.5 border border-neutral-200 text-base text-neutral-black font-medium placeholder:text-neutral-400 resize-none h-24 transition-all duration-200 focus:border-[#4f46e5] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] focus:outline-none"
              placeholder={tr.message}
            />
            <button type="submit" className="btn-gradient py-3.5 rounded-xl text-base font-bold mt-2 flex items-center justify-center gap-2">
              <SendIcon style={{ fontSize: 18 }} />
              {tr.submit}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

export default ConnectSection;

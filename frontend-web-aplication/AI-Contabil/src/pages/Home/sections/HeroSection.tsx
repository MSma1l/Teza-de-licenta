import { useEffect, useRef } from 'react';
import { useLanguage } from '../../../context/LanguageContext';

const HERO_IMAGE_URL = '/accounting-hero.jpg';

const t = {
  ro: {
    badge: 'Inteligenta Artificiala · Contabilitate',
    title1: 'Contabilitate simpla',
    title2: 'pentru afaceri mici, cu ',
    subtitle: 'AI-Contabil gestioneaza documentele contabile ale business-ului tau — extrage date din facturi, clasifica automat si ofera recomandari inteligente. Totul local, fara cloud, 100% privat.',
    btnStart: 'Incepe acum',
    btnMore: 'Afla mai mult',
    ocrLabel: 'Extractie text',
    aiLabel: '100% privat',
    rtLabel: 'Procesare live',
  },
  en: {
    badge: 'Artificial Intelligence · Accounting',
    title1: 'Simple accounting',
    title2: 'for small businesses, with ',
    subtitle: 'AI-Contabil manages your business accounting documents — extracts data from invoices, classifies automatically and provides smart recommendations. Everything local, no cloud, 100% private.',
    btnStart: 'Get started',
    btnMore: 'Learn more',
    ocrLabel: 'Text extraction',
    aiLabel: '100% private',
    rtLabel: 'Live processing',
  },
  ru: {
    badge: 'Искусственный интеллект · Бухгалтерия',
    title1: 'Простая бухгалтерия',
    title2: 'для малого бизнеса, с ',
    subtitle: 'AI-Contabil управляет бухгалтерскими документами вашего бизнеса — извлекает данные из счетов, автоматически классифицирует и предоставляет интеллектуальные рекомендации. Всё локально, без облака, 100% конфиденциально.',
    btnStart: 'Начать сейчас',
    btnMore: 'Узнать больше',
    ocrLabel: 'Извлечение текста',
    aiLabel: '100% приватно',
    rtLabel: 'Обработка в реальном времени',
  },
};

const HeroSection = () => {
  const { lang } = useLanguage();
  const tr = t[lang];
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('hero-visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = sectionRef.current?.querySelectorAll('.hero-animate');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        background: '#f0f4ff',
        borderRadius: '20px',
        overflow: 'hidden',
        marginTop: '4px',
      }}
    >
      {/* Image - centered behind everything, dimmed */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
        }}
        className="hero-image-wrapper"
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundImage: `url(${HERO_IMAGE_URL})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center right',
            backgroundRepeat: 'no-repeat',
            animation: 'heroZoom 14s ease-in-out infinite alternate',
            opacity: 0.90,
          }}
        />
        {/* Overlay to dim + blend with left side */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, #f0f4ff 0%, rgba(240,244,255,0.95) 35%, rgba(240,244,255,0.7) 55%, rgba(240,244,255,0.45) 75%, rgba(240,244,255,0.3) 100%)',
            backdropFilter: 'blur(2px)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Left side - Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '720px',
          padding: '56px 48px 56px 56px',
        }}
        className="hero-content"
      >
        {/* Badge */}
        <div
          className="hero-animate"
          style={{
            opacity: 0,
            animation: 'heroFadeUp 0.8s ease 0.1s forwards',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '999px',
              background: 'rgba(79,70,229,0.18)',
              color: '#3730a3',
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: '0.3px',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#4f46e5',
                animation: 'heroBlink 1.5s ease-in-out infinite',
              }}
            />
            {tr.badge}
          </span>
        </div>

        {/* Title */}
        <h1
          className="hero-animate"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2.2rem, 4vw, 3.5rem)',
            fontWeight: 700,
            lineHeight: 1.15,
            color: '#1e1b4b',
            marginTop: '20px',
            marginBottom: '18px',
            opacity: 0,
            animation: 'heroFadeUp 0.8s ease 0.25s forwards',
          }}
        >
          {tr.title1}{' '}
          {tr.title2}
          <span
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            AI
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="hero-animate"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 400,
            fontSize: '1.15rem',
            lineHeight: 1.7,
            color: '#374151',
            marginBottom: '32px',
            maxWidth: '600px',
            opacity: 0,
            animation: 'heroFadeUp 0.8s ease 0.4s forwards',
          }}
        >
          {tr.subtitle}
        </p>

        {/* Buttons */}
        <div
          className="hero-animate"
          style={{
            display: 'flex',
            gap: '14px',
            flexWrap: 'wrap',
            marginBottom: '40px',
            opacity: 0,
            animation: 'heroFadeUp 0.8s ease 0.55s forwards',
          }}
        >
          <a
            href="/signin"
            className="hero-btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 32px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              textDecoration: 'none',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 14px rgba(79,70,229,0.3)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            {tr.btnStart}
          </a>
          <a
            href="#about"
            className="hero-btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 32px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.85)',
              color: '#1e1b4b',
              fontSize: '15px',
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              textDecoration: 'none',
              border: '1.5px solid #e2e8f0',
              transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
              backdropFilter: 'blur(8px)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            {tr.btnMore}
          </a>
        </div>

        {/* Stat pills */}
        <div
          className="hero-animate"
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            opacity: 0,
            animation: 'heroFadeUp 0.8s ease 0.7s forwards',
          }}
        >
          <StatPill
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            }
            value="OCR"
            label={tr.ocrLabel}
          />
          <StatPill
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            }
            value="AI Local"
            label={tr.aiLabel}
          />
          <StatPill
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            }
            value="Real-time"
            label={tr.rtLabel}
          />
        </div>
      </div>

      {/* Inline styles for hover effects & responsive */}
      <style>{`
        .hero-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(79,70,229,0.4) !important;
        }
        .hero-btn-secondary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important;
          border-color: #4f46e5 !important;
        }
        @media (max-width: 768px) {
          .hero-image-wrapper {
            opacity: 0.1 !important;
          }
          .hero-content {
            max-width: 100% !important;
            padding: 36px 24px !important;
            text-align: center;
          }
          .hero-content > div {
            justify-content: center;
          }
        }
      `}</style>
    </section>
  );
};

interface StatPillProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

const StatPill = ({ icon, value, label }: StatPillProps) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      padding: '14px 24px',
      borderRadius: '16px',
      background: 'rgba(255,255,255,0.85)',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      backdropFilter: 'blur(8px)',
    }}
  >
    <div
      style={{
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        background: 'rgba(99,102,241,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div>
      <div
        style={{
          fontSize: '16px',
          fontWeight: 700,
          color: '#1e1b4b',
          fontFamily: "'DM Sans', sans-serif",
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: '14px',
          fontWeight: 400,
          color: '#64748b',
          fontFamily: "'DM Sans', sans-serif",
          lineHeight: 1.3,
        }}
      >
        {label}
      </div>
    </div>
  </div>
);

export default HeroSection;

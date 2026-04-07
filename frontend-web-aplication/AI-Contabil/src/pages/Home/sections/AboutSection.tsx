import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';

import { useLanguage } from '../../../context/LanguageContext';
import type { Lang } from '../../../context/LanguageContext';

const content: Record<Lang, {
  title: string;
  subtitle: string;
  description: string;
  features: { icon: React.ReactNode; title: string; text: string }[];
  closing: string;
}> = {
  ro: {
    title: 'Despre AI-Contabil',
    subtitle: 'Platforma inteligentă pentru afaceri mici',
    description:
      'AI-Contabil este o platformă inovatoare care combină inteligența artificială cu procesele contabile, oferind soluții automate pentru gestionarea documentelor financiare. Creată special pentru antreprenori și business-uri mici, platforma elimină complexitatea contabilității tradiționale și o transformă într-un proces simplu, rapid și sigur.',
    features: [
      {
        icon: <SmartToyOutlinedIcon />,
        title: 'Procesare AI',
        text: 'Modele de inteligență artificială locale (OCR, NER, clasificare) extrag automat date din facturi, contracte și alte documente contabile — fără intervenție manuală.',
      },
      {
        icon: <DescriptionOutlinedIcon />,
        title: 'Gestionare documente',
        text: 'Încarcă, organizează și monitorizează toate documentele financiare într-un singur loc. Clasificare automată pe categorii, urmărire status și recomandări inteligente.',
      },
      {
        icon: <SecurityOutlinedIcon />,
        title: '100% privat și local',
        text: 'Toate datele tale sunt procesate local, fără a fi trimise în cloud. Criptare AES-256, autentificare JWT și audit log complet pentru securitate maximă.',
      },
      {
        icon: <SpeedOutlinedIcon />,
        title: 'Procesare în timp real',
        text: 'Actualizări live prin WebSocket, coadă de procesare asincronă și notificări instant. Documentele tale sunt procesate în câteva secunde.',
      },
    ],
    closing:
      'AI-Contabil învață din corecțiile tale și devine mai precis cu fiecare document procesat. Un asistent contabil inteligent care crește odată cu afacerea ta.',
  },
  en: {
    title: 'About AI-Contabil',
    subtitle: 'The smart platform for small businesses',
    description:
      'AI-Contabil is an innovative platform that combines artificial intelligence with accounting processes, providing automated solutions for managing financial documents. Built specifically for entrepreneurs and small businesses, the platform eliminates the complexity of traditional accounting and turns it into a simple, fast, and secure process.',
    features: [
      {
        icon: <SmartToyOutlinedIcon />,
        title: 'AI Processing',
        text: 'Local AI models (OCR, NER, classification) automatically extract data from invoices, contracts, and other accounting documents — without manual intervention.',
      },
      {
        icon: <DescriptionOutlinedIcon />,
        title: 'Document Management',
        text: 'Upload, organize, and monitor all financial documents in one place. Automatic categorization, status tracking, and smart recommendations.',
      },
      {
        icon: <SecurityOutlinedIcon />,
        title: '100% Private & Local',
        text: 'All your data is processed locally, never sent to the cloud. AES-256 encryption, JWT authentication, and complete audit logs for maximum security.',
      },
      {
        icon: <SpeedOutlinedIcon />,
        title: 'Real-time Processing',
        text: 'Live updates via WebSocket, async processing queue, and instant notifications. Your documents are processed within seconds.',
      },
    ],
    closing:
      'AI-Contabil learns from your corrections and becomes more accurate with every processed document. A smart accounting assistant that grows with your business.',
  },
  ru: {
    title: 'О платформе AI-Contabil',
    subtitle: 'Интеллектуальная платформа для малого бизнеса',
    description:
      'AI-Contabil — это инновационная платформа, которая сочетает искусственный интеллект с бухгалтерскими процессами, предоставляя автоматизированные решения для управления финансовыми документами. Созданная специально для предпринимателей и малого бизнеса, платформа устраняет сложность традиционной бухгалтерии и превращает её в простой, быстрый и безопасный процесс.',
    features: [
      {
        icon: <SmartToyOutlinedIcon />,
        title: 'Обработка ИИ',
        text: 'Локальные модели искусственного интеллекта (OCR, NER, классификация) автоматически извлекают данные из счетов, договоров и других бухгалтерских документов — без ручного вмешательства.',
      },
      {
        icon: <DescriptionOutlinedIcon />,
        title: 'Управление документами',
        text: 'Загружайте, организуйте и отслеживайте все финансовые документы в одном месте. Автоматическая категоризация, отслеживание статуса и умные рекомендации.',
      },
      {
        icon: <SecurityOutlinedIcon />,
        title: '100% конфиденциально',
        text: 'Все ваши данные обрабатываются локально, без отправки в облако. Шифрование AES-256, аутентификация JWT и полный журнал аудита для максимальной безопасности.',
      },
      {
        icon: <SpeedOutlinedIcon />,
        title: 'Обработка в реальном времени',
        text: 'Обновления в реальном времени через WebSocket, асинхронная очередь обработки и мгновенные уведомления. Ваши документы обрабатываются за секунды.',
      },
    ],
    closing:
      'AI-Contabil учится на ваших исправлениях и становится точнее с каждым обработанным документом. Умный бухгалтерский помощник, который растёт вместе с вашим бизнесом.',
  },
};

const AboutSection = () => {
  const { lang } = useLanguage();
  const t = content[lang];

  return (
    <section id="about" className="px-8 py-16">
      {/* Title & description */}
      <h2 className="font-heading text-[2.5rem] font-bold text-neutral-black mb-3">
        {t.title}
      </h2>
      <p
        className="text-xl font-medium mb-5"
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {t.subtitle}
      </p>
      <p className="text-xl text-neutral-600 leading-relaxed mb-12">
        {t.description}
      </p>

      {/* Feature cards */}
      <div className="grid grid-cols-2 max-md:grid-cols-1 gap-5 mb-10">
        {t.features.map((feature, index) => (
          <div
            key={index}
            className="flex gap-4 p-6 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 [&_svg]:text-white"
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)',
              }}
            >
              {feature.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1e1b4b] mb-1">
                {feature.title}
              </h3>
              <p className="text-base text-neutral-600 leading-relaxed">
                {feature.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Closing statement */}
      <div className="relative overflow-hidden rounded-xl px-12 py-10" style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)',
      }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white" />
        </div>
        <p className="relative text-white text-2xl leading-snug font-semibold text-center">
          {t.closing}
        </p>
      </div>
    </section>
  );
};

export default AboutSection;

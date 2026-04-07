import { createContext, useContext, useState, useEffect } from 'react';

export type Lang = 'ro' | 'en' | 'ru';

const STORAGE_KEY = 'ai-contabil-lang';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ro',
  setLang: () => {},
});

const getStoredLang = (): Lang => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'ro' || stored === 'en' || stored === 'ru') return stored;
  return 'ro';
};

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(getStoredLang);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

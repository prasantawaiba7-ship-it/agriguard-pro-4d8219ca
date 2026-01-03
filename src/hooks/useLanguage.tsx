import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations, languages } from '@/lib/languages';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  languages: typeof languages;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('cropic-language');
    // Check if saved language is valid for Nepal
    if (saved && (saved === 'en' || saved === 'ne' || saved === 'tamang' || saved === 'newar' || saved === 'maithili' || saved === 'magar' || saved === 'rai')) {
      return saved as Language;
    }
    return 'ne'; // Default to Nepali
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('cropic-language', lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

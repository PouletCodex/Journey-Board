import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Language } from '../constants';
import { LOCALES } from '../constants';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  locale: string;
  t: (key: string) => string; // Translation function will be provided by App
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "journey_language_v1";

export function LanguageProvider({
  children,
  translations
}: {
  children: ReactNode;
  translations: Record<Language, Record<string, string>>;
}) {
  const [language, setLanguage] = useLocalStorage<Language>(
    LANGUAGE_STORAGE_KEY,
    'en'
  );

  const value: LanguageContextType = useMemo(() => ({
    language,
    setLanguage,
    locale: LOCALES[language],
    t: (key: string) => {
      return translations[language]?.[key] ?? key;
    },
  }), [language, translations]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

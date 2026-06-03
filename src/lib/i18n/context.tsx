"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { Language, TranslationKey, translations } from "./translations";

type I18nContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "crossyarn-lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("uk");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "uk" || stored === "en") {
      setLangState(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
    document.documentElement.lang = newLang;
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      let value: string = translations[lang][key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          value = value.replace(`{${k}}`, String(v));
        }
      }
      return value;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type { Language } from "@klaro/validators/language";
import { DEFAULT_LANGUAGE } from "@klaro/validators/language";

import type { TranslationKeys } from "~/i18n";
import { t as translate } from "~/i18n";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "klaro-language";

function getStoredLanguage(): Language {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ["en", "fil", "ceb", "ilo"].includes(stored)) {
      return stored as Language;
    }
  } catch {
    // localStorage not available
  }
  return DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getStoredLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // localStorage not available
    }
  }, []);

  const tFn = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return translate(language, key, params);
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: tFn,
    }),
    [language, setLanguage, tFn],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      language: DEFAULT_LANGUAGE,
      setLanguage: () => {
        void 0;
      },
      t: (key: string) => key,
    };
  }
  return ctx;
}

export type { TranslationKeys };

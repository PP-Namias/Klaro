"use client";

import { useCallback, useRef, useState } from "react";

import type { Language } from "@klaro/validators/language";
import { LANGUAGE_OPTIONS } from "@klaro/validators/language";

import { useLanguage } from "~/providers/language-provider";
import styles from "./language-selector.module.css";

const FLAG_EMOJI: Record<Language, string> = {
  en: "🇺🇸",
  fil: "🇵🇭",
  ceb: "🇵🇭",
  ilo: "🇵🇭",
};

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback(
    (code: Language) => {
      setLanguage(code);
      setOpen(false);
    },
    [setLanguage],
  );

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    if (!ref.current?.contains(e.relatedTarget as Node)) {
      setOpen(false);
    }
  }, []);

  const current = LANGUAGE_OPTIONS.find((l) => l.code === language);

  return (
    <div ref={ref} className={styles.container} onBlur={handleBlur}>
      <button
        type="button"
        onClick={handleToggle}
        className={styles.trigger}
        aria-label="Select language"
        aria-expanded={open}
      >
        <span className={styles.flag}>{FLAG_EMOJI[language]}</span>
        <span className={styles.code}>{current?.code.toUpperCase()}</span>
        <svg
          className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className={styles.dropdown}>
          {LANGUAGE_OPTIONS.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelect(lang.code)}
              className={`${styles.option} ${lang.code === language ? styles.optionActive : ""}`}
            >
              <span className={styles.flag}>{FLAG_EMOJI[lang.code]}</span>
              <span className={styles.optionLabel}>{lang.nativeName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import { z } from "zod/v4";

export const LanguageCode = {
  ENGLISH: "en",
  FILIPINO: "fil",
  BISAYA: "ceb",
  ILOCANO: "ilo",
} as const;

export type LanguageCode = (typeof LanguageCode)[keyof typeof LanguageCode];

export const languageSchema = z.enum(["en", "fil", "ceb", "ilo"]);

export type Language = z.infer<typeof languageSchema>;

export const LANGUAGE_LABELS: Record<Language, { name: string; nativeName: string }> = {
  en: { name: "English", nativeName: "English" },
  fil: { name: "Filipino", nativeName: "Filipino" },
  ceb: { name: "Bisaya", nativeName: "Binisaya" },
  ilo: { name: "Ilocano", nativeName: "Ilokano" },
};

export const LANGUAGE_OPTIONS = Object.entries(LANGUAGE_LABELS).map(
  ([code, label]) => ({
    code: code as Language,
    name: label.name,
    nativeName: label.nativeName,
  }),
);

export const DEFAULT_LANGUAGE: Language = "fil";

export const DIALECT_TO_LANGUAGE: Record<string, Language> = {
  Filipino: "fil",
  Bisaya: "ceb",
  Ilocano: "ilo",
  English: "en",
};

export const LANGUAGE_TO_DIALECT: Record<Language, string> = {
  en: "English",
  fil: "Filipino",
  ceb: "Bisaya",
  ilo: "Ilocano",
};

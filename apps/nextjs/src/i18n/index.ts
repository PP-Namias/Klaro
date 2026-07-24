import type { Language } from "@klaro/validators/language";

import ceb from "./ceb";
import en from "./en";
import fil from "./fil";
import ilo from "./ilo";

const dictionaries: Record<Language, Record<string, string>> = {
  en,
  fil,
  ceb,
  ilo,
};

export function getTranslation(language: Language): Record<string, string> {
  return dictionaries[language];
}

export function t(
  language: Language,
  key: string,
  params?: Record<string, string | number>,
): string {
  const dict = dictionaries[language];
  let value = dict[key] ?? dictionaries.en[key] ?? key;

  if (params) {
    for (const [paramKey, paramValue] of Object.entries(params)) {
      value = value.replace(
        new RegExp(`\\{${paramKey}\\}`, "g"),
        String(paramValue),
      );
    }
  }

  return value;
}

export { en, fil, ceb, ilo };

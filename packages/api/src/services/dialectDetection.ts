export type Dialect = "en" | "fil" | "bisaya" | "ilocano";

export interface DialectDetectionResult {
  dialect: Dialect;
  confidence: number;
  alternativeDialects: { dialect: Dialect; confidence: number }[];
}

const DIALECT_PATTERNS: Record<Dialect, RegExp[]> = {
  fil: [
    /\bang\s+(mga\s+)?\w+/i,
    /ng\s+\w+/i,
    /mga\s+\w+/i,
    /para\s+sa\s+\w+/i,
    /isa\s+sa\s+\w+/i,
    /ang\s+pangalan/i,
    /ako\s+ay/i,
    /ikaw\s+ay/i,
    /siya\s+ay/i,
  ],
  bisaya: [
    /ako\s+ay/i,
    /ikaw\s+ay/i,
    /siya\s+ay/i,
    /nindot\s+\w+/i,
    /dako\s+\w+/i,
    /gamay\s+\w+/i,
    /daghan\s+\w+/i,
  ],
  ilocano: [
    /ti\s+\w+/i,
    /nga\s+\w+/i,
    /kadagiti\s+\w+/i,
    /iti\s+\w+/i,
    /ti\s+nagan/i,
    /maymaysa\s+\w+/i,
  ],
  en: [],
};

export function detectDialect(text: string): DialectDetectionResult {
  const scores: Record<Dialect, number> = {
    en: 0,
    fil: 0,
    bisaya: 0,
    ilocano: 0,
  };

  for (const [dialect, patterns] of Object.entries(DIALECT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        scores[dialect as Dialect] += 1;
      }
    }
  }

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

  const dialectConfidences: { dialect: Dialect; confidence: number }[] = (
    Object.entries(scores) as [Dialect, number][]
  ).map(([dialect, score]) => ({
    dialect,
    confidence: totalScore > 0 ? score / totalScore : dialect === "en" ? 1 : 0,
  }));

  dialectConfidences.sort((a, b) => b.confidence - a.confidence);

  const topDialect = dialectConfidences[0];

  if (!topDialect || topDialect.confidence === 0) {
    return {
      dialect: "en",
      confidence: 1,
      alternativeDialects: [],
    };
  }

  return {
    dialect: topDialect.dialect,
    confidence: topDialect.confidence,
    alternativeDialects: dialectConfidences.slice(1),
  };
}

export function adaptResponseToDialect(
  response: string,
  targetDialect: Dialect,
): string {
  if (targetDialect === "en") return response;

  const translations: Record<string, Record<Dialect, string>> = {
    "Your results show": {
      en: "Your results show",
      fil: "Ang iyong mga resulta ay nagpapakita",
      bisaya: "Ang imong mga resulta nagpakita",
      ilocano: "Dagiti resultam ket nagpapakita",
    },
    "This means": {
      en: "This means",
      fil: "Ibig sabihin nito",
      bisaya: "Kini nagpasabot",
      ilocano: "Daytoy ket agnanaat",
    },
    "You should": {
      en: "You should",
      fil: "Dapat kang",
      bisaya: "Kinahanglan nimo",
      ilocano: "Ket ammo",
    },
    "Consult your doctor": {
      en: "Consult your doctor",
      fil: "Kumonsulta sa iyong doktor",
      bisaya: "Konsulta sa imong doktor",
      ilocano: "Konsultam ti doktor mo",
    },
  };

  let adapted = response;
  for (const [phrase, dialects] of Object.entries(translations)) {
    if (adapted.includes(phrase)) {
      adapted = adapted.replace(phrase, dialects[targetDialect] || phrase);
    }
  }

  return adapted;
}

export function simplifyLanguage(text: string): string {
  return text
    .replace(/however/gi, "but")
    .replace(/therefore/gi, "so")
    .replace(/furthermore/gi, "also")
    .replace(/consequently/gi, "so")
    .replace(/nevertheless/gi, "but")
    .replace(/approximately/gi, "about")
    .replace(/subsequently/gi, "then")
    .replace(/prior to/gi, "before")
    .replace(/in accordance with/gi, "per")
    .replace(/with regard to/gi, "about")
    .replace(/utilize/gi, "use")
    .replace(/demonstrate/gi, "show")
    .replace(/commence/gi, "start")
    .replace(/terminate/gi, "end");
}

export function getMessageLanguage(
  messages: { role: string; content: string }[],
): Dialect {
  const userMessages = messages.filter((m) => m.role === "user");
  if (userMessages.length === 0) return "en";

  const lastMessage = userMessages.at(-1);
  return detectDialect(lastMessage?.content ?? "").dialect;
}

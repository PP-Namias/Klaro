import type { Document } from "@langchain/core/documents";

/**
 * Deterministic mock fallback when Gemini is rate-limited or unavailable.
 * No network, no API key needed, respects dialect and provides safe disclaimer.
 */

const MOCK_TEMPLATES: Record<string, string> = {
  en: `This is a simulated response for: "{question}". I am currently experiencing high demand and cannot reach the AI service. Here is a helpful interim response — Context available: {docCount} document chunk(s). Please try again in a moment. {disclaimer}`,
  fil: `This is a simulated response for: "{question}". Kasalukuyang mataas ang demand at hindi maabot ang AI service. Konteksto: {docCount} tipak. {disclaimer}`,
  ceb: `This is a simulated response for: "{question}". Karon taas ang demand ug dili maabot ang AI service. Konteksto: {docCount} ka tipik. {disclaimer}`,
  ilo: `This is a simulated response for: "{question}". Iti agdama ket nangato ti demand ket saan a maabot ti AI service. Konteksto: {docCount} a tipak. {disclaimer}`,
};

const DISCLAIMERS: Record<string, string> = {
  en: "Disclaimer: I am an AI assistant, not a doctor. Consult a licensed professional.",
  fil: "Paalala: Ako ay AI assistant, hindi doktor. Kumonsulta sa lisensyadong propesyonal.",
  ceb: "Pahinumdom: AI assistant ako, dili doktor. Konsultaha ang lisensyadong propesyonal.",
  ilo: "Palagip: Siak ket AI assistant, saan a doktor. Dumawag iti lisensiado a propesyonal.",
};

export function getMockAnswer(
  question: string,
  docs: Document[],
  locale = "en",
): string {
  const template = MOCK_TEMPLATES[locale] ?? MOCK_TEMPLATES["en"]!;
  const disclaimer = DISCLAIMERS[locale] ?? DISCLAIMERS["en"]!;
  const snippet = docs[0]?.pageContent.slice(0, 120) ?? "No documents retrieved";
  const docPart = docs.length > 0 ? ` Context: ${snippet}` : "";
  return template
    .replace("{question}", question.slice(0, 200))
    .replace("{docCount}", String(docs.length))
    .replace("{disclaimer}", disclaimer)
    .replace("{snippet}", snippet) + docPart;
}

export function isMockFallbackEnabled(): boolean {
  return process.env.ENABLE_MOCK_MODE === "true" || process.env.ENABLE_MOCK_FALLBACK === "true";
}

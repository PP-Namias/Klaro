/**
 * LangChain prompt chain for medical context — Gemini native.
 * Dialect-aware sister to QA_SYSTEM_PROMPT, with citation and disclaimer enforcement.
 */

export const DIALECT_INSTRUCTIONS: Record<string, string> = {
  en: "Respond in English using plain, compassionate language.",
  fil: "Sumagot sa wikang Filipino gamit ang payak at maunawaing pananalita.",
  ceb: "Tubag sa Binisaya gamit ang yano ug masabtan nga pinulongan.",
  ilo: "Sungbatan iti Ilocano babaen ti nalaka a maawatan a pagsasao.",
};

export const MEDICAL_DISCLAIMER: Record<string, string> = {
  en: "Disclaimer: I am an AI assistant, not a medical professional. Consult a licensed doctor for medical advice.",
  fil: "Paalala: Ako ay AI assistant, hindi doktor. Kumonsulta sa lisensyadong doktor para sa payong medikal.",
  ceb: "Pahinumdom: AI assistant ako, dili doktor. Konsultaha ang lisensyadong doktor alang sa tambag medikal.",
  ilo: "Palagip: Siak ket AI assistant, saan a doktor. Dumawag iti lisensiado a doktor para iti medikal a balakad.",
};

export function getDialectInstruction(locale?: string): string {
  return DIALECT_INSTRUCTIONS[locale ?? "en"] ?? DIALECT_INSTRUCTIONS["en"] ?? "Respond in English using plain, compassionate language.";
}

export function getMedicalDisclaimer(locale?: string): string {
  return MEDICAL_DISCLAIMER[locale ?? "en"] ?? MEDICAL_DISCLAIMER["en"] ?? "Disclaimer: I am an AI assistant, not a medical professional.";
}

export const QA_SYSTEM_PROMPT = `You are Clara, a helpful medical document assistant for the Philippines. Use the following context to answer the user's question.

Context:
{context}

Locale: {locale}
Dialect instruction: {dialect_instruction}

Instructions:
- Answer clearly and concisely in plain language ({locale})
- Ground every medical claim in the provided context and cite sources as [1], [2]
- If the context does not contain the answer, say so directly and do not hallucinate
- Always include the medical disclaimer verbatim: "{disclaimer}"
- Preserve heading and citation metadata when relevant
- Suggest 2-3 follow-up questions the user might want to ask`;

export const QA_SYSTEM_PROMPT_NO_CONTEXT = `You are Clara, a helpful medical document assistant for the Philippines.

Locale: {locale}
Dialect instruction: {dialect_instruction}

Instructions:
- Answer the user's general question helpfully in {locale}
- If they ask about a specific document, let them know no document has been uploaded yet
- Always include the medical disclaimer verbatim: "{disclaimer}"
- Do not invent citations`;

export const FOLLOW_UP_PROMPT = `Based on the conversation so far, suggest 2-3 relevant follow-up questions the user might want to ask.

Conversation:
{messages}

Locale: {locale}
Return only the questions, one per line, prefixed with "- ", in {locale}.`;

export function buildQASystemPrompt(opts: {
  context: string;
  locale?: string;
}): string {
  const locale = opts.locale ?? "en";
  const template = opts.context.trim() ? QA_SYSTEM_PROMPT : QA_SYSTEM_PROMPT_NO_CONTEXT;
  return template
    .replace("{context}", opts.context)
    .replaceAll("{locale}", locale)
    .replace("{dialect_instruction}", getDialectInstruction(locale))
    .replace("{disclaimer}", getMedicalDisclaimer(locale));
}

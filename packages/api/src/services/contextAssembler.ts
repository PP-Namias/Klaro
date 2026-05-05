import type { JSONValue } from "@klaro/validators";

/**
 * Assemble document + analysis + recent messages into a single context string
 * used to prompt LLM for chat responses.
 */
export function assembleDocumentContext(
  analysis: {
    extractedFields?: Record<string, JSONValue> | null;
    plainLanguageSummary?: string | null;
  },
  recentMessages?: Array<{ role: string; content: string; dialect?: string }>,
): string {
  const parts: string[] = [];

  if (analysis.extractedFields && Object.keys(analysis.extractedFields).length > 0) {
    const fields = Object.entries(analysis.extractedFields)
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join("; ");
    parts.push(`Patient results: ${fields}.`);
  }

  if (analysis.plainLanguageSummary) {
    parts.push(`Analysis summary: ${analysis.plainLanguageSummary}`);
  }

  if (recentMessages && recentMessages.length > 0) {
    const convo = recentMessages
      .map((m) => `${m.role}: ${m.content}`)
      .join(" \n");
    parts.push(`Recent conversation: ${convo}`);
  }

  return parts.join(" \n\n");
}

export default assembleDocumentContext;

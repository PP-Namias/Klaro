/**
 * Assemble document + analysis + recent messages into a single context string
 * used to prompt LLM for chat responses.
 *
 * PHI Protection: All patient identifiers are scrubbed before context assembly
 * to prevent leakage to external LLM APIs.
 */
import { scrubPhi } from "./phiScrubber";

/**
 * PHI-sensitive fields that should be redacted from context
 */
const PHI_FIELDS = new Set([
  "patientName",
  "patient_name",
  "name",
  "dateOfBirth",
  "date_of_birth",
  "dob",
  "ssn",
  "socialSecurity",
  "mrn",
  "medicalRecordNumber",
  "phone",
  "phoneNumber",
  "address",
  "email",
  "insuranceId",
  "insurance_id",
]);

/**
 * Scrub PHI fields from extracted data before including in context
 */
function scrubExtractedFields(
  fields: Record<string, unknown>,
): Record<string, unknown> {
  const scrubbed: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(fields)) {
    if (PHI_FIELDS.has(key)) {
      // Redact PHI fields entirely
      scrubbed[key] = "[REDACTED]";
    } else if (typeof value === "string") {
      // Scrub any embedded PHI in string values
      const result = scrubPhi(value);
      scrubbed[key] = result.scrubbedText;
    } else if (Array.isArray(value)) {
      // Scrub PHI in array elements
      scrubbed[key] = value.map((item) => {
        if (typeof item === "string") {
          return scrubPhi(item).scrubbedText;
        }
        return item;
      });
    } else {
      scrubbed[key] = value;
    }
  }

  return scrubbed;
}

/**
 * Scrub PHI from chat messages before including in context
 */
function scrubChatMessages(
  messages: { role: string; content: string; dialect?: string }[],
): { role: string; content: string; dialect?: string }[] {
  return messages.map((msg) => ({
    ...msg,
    content: scrubPhi(msg.content).scrubbedText,
  }));
}

export function assembleDocumentContext(
  analysis: {
    extractedFields?: Record<string, unknown> | null;
    plainLanguageSummary?: string | null;
  },
  recentMessages?: { role: string; content: string; dialect?: string }[],
): string {
  const parts: string[] = [];

  if (
    analysis.extractedFields &&
    Object.keys(analysis.extractedFields).length > 0
  ) {
    // Scrub PHI from extracted fields before building context
    const scrubbedFields = scrubExtractedFields(
      analysis.extractedFields,
    );
    const fields = Object.entries(scrubbedFields)
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join("; ");
    parts.push(`Patient results: ${fields}.`);
  }

  if (analysis.plainLanguageSummary) {
    // Scrub PHI from summary
    const scrubbedSummary = scrubPhi(analysis.plainLanguageSummary);
    parts.push(`Analysis summary: ${scrubbedSummary.scrubbedText}`);
  }

  if (recentMessages && recentMessages.length > 0) {
    // Scrub PHI from chat messages
    const scrubbedMessages = scrubChatMessages(recentMessages);
    const convo = scrubbedMessages
      .map((m) => `${m.role}: ${m.content}`)
      .join(" \n");
    parts.push(`Recent conversation: ${convo}`);
  }

  return parts.join(" \n\n");
}

export default assembleDocumentContext;

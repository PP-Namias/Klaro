import { scrubPhi } from "./phiScrubber";

export type ClaraMessageType = "user" | "clara" | "system";

export interface ClaraMessage {
  id: string;
  type: ClaraMessageType;
  content: string;
  documentId?: string;
  language?: string;
  timestamp: Date;
}

export interface ClaraContext {
  documentId: string;
  patientData?: Record<string, unknown>;
  language?: string;
}

export interface ClaraResponse {
  message: ClaraMessage;
  confidence: number;
  sources?: string[];
}

export function createClaraMessage(
  type: ClaraMessageType,
  content: string,
  documentId?: string,
  language?: string,
): ClaraMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    content,
    documentId,
    language,
    timestamp: new Date(),
  };
}

/**
 * Build system prompt for Clara with PHI protection.
 * Patient data is scrubbed before inclusion to prevent leakage to LLM APIs.
 */
export function buildClaraSystemPrompt(context: ClaraContext): string {
  const langInstruction =
    context.language && context.language !== "en"
      ? `Respond in ${context.language}.`
      : "";

  let patientDataSection = "";
  if (context.patientData) {
    // Scrub PHI from patient data before including in prompt
    const { scrubbedData, matches } = scrubExtractedDataForClara(
      context.patientData,
    );

    if (matches.length > 0) {
      console.log(
        JSON.stringify({
          type: "phi_scrubbed",
          context: "clara_system_prompt",
          phiCount: matches.length,
          timestamp: new Date().toISOString(),
        }),
      );
    }

    patientDataSection = `\nPatient data:\n${JSON.stringify(scrubbedData, null, 2)}`;
  }

  return `You are Clara, a friendly AI health assistant for Klaro.
Your role is to help patients understand their medical documents and health data.
Be concise, clear, and empathetic.
Never provide medical diagnosis or treatment advice.
Always recommend consulting a healthcare professional for medical decisions.

${langInstruction}
${patientDataSection}

When answering questions about the patient data:
- Explain medical terms in simple language
- Highlight important values that may need attention
- Suggest follow-up questions the patient might want to ask their doctor
- Be reassuring but honest about what the data shows`;
}

/**
 * Scrub PHI from patient data object for Clara's context
 */
function scrubExtractedDataForClara(data: Record<string, unknown>): {
  scrubbedData: Record<string, unknown>;
  matches: Array<{ type: string; value: string }>;
} {
  const matches: Array<{ type: string; value: string }> = [];
  const scrubbed: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") {
      const result = scrubPhi(value);
      if (result.matchCount > 0) {
        matches.push(
          ...result.matches.map((m) => ({ type: m.type, value: m.value })),
        );
      }
      scrubbed[key] = result.scrubbedText;
    } else if (Array.isArray(value)) {
      scrubbed[key] = value.map((item) => {
        if (typeof item === "string") {
          const result = scrubPhi(item);
          if (result.matchCount > 0) {
            matches.push(
              ...result.matches.map((m) => ({ type: m.type, value: m.value })),
            );
          }
          return result.scrubbedText;
        }
        return item;
      });
    } else {
      scrubbed[key] = value;
    }
  }

  return { scrubbedData: scrubbed, matches };
}

export function shouldRespondToMessage(message: string): boolean {
  const trimmed = message.trim().toLowerCase();

  if (trimmed.length < 2) return false;
  if (
    /^(hi|hello|hey|good morning|good afternoon|good evening)$/i.test(trimmed)
  )
    return true;
  if (/\?/.test(trimmed)) return true;

  const healthKeywords = [
    "diagnosis",
    "medication",
    "medicine",
    "drug",
    "result",
    "lab",
    "blood",
    "pressure",
    "sugar",
    "cholesterol",
    "allergy",
    "allergic",
    "symptom",
    "pain",
    "fever",
    "cough",
    "cold",
    "prescription",
    "doctor",
    "hospital",
    "health",
    "medical",
    "document",
    "report",
    "test",
    "dose",
    "dosage",
    "side effect",
  ];

  return healthKeywords.some((kw) => trimmed.includes(kw));
}

export function formatClaraResponse(
  response: string,
  confidence: number,
): ClaraResponse {
  return {
    message: createClaraMessage("clara", response),
    confidence,
  };
}

export function buildPatientDataSummary(data: Record<string, unknown>): string {
  const parts: string[] = [];

  if (data.patientName) {
    parts.push(`Patient: ${data.patientName}`);
  }
  if (data.dateOfBirth) {
    parts.push(`DOB: ${data.dateOfBirth}`);
  }
  if (Array.isArray(data.diagnosis) && data.diagnosis.length > 0) {
    parts.push(`Diagnoses: ${(data.diagnosis as string[]).join(", ")}`);
  }
  if (Array.isArray(data.medications) && data.medications.length > 0) {
    const meds = data.medications as Array<{ name: string; dosage: string }>;
    parts.push(
      `Medications: ${meds.map((m) => `${m.name} ${m.dosage}`).join(", ")}`,
    );
  }

  return parts.join(" | ");
}

export function validateClaraMessage(content: string): string[] {
  const errors: string[] = [];

  if (!content || content.trim().length === 0) {
    errors.push("Message cannot be empty");
  }

  if (content.length > 2000) {
    errors.push("Message too long (max 2000 characters)");
  }

  if (/[<>{}]/.test(content)) {
    errors.push("Message contains invalid characters");
  }

  return errors;
}

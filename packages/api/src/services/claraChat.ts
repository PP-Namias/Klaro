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

export function buildClaraSystemPrompt(context: ClaraContext): string {
  const langInstruction = context.language && context.language !== "en"
    ? `Respond in ${context.language}.`
    : "";

  const patientData = context.patientData
    ? `\nPatient data:\n${JSON.stringify(context.patientData, null, 2)}`
    : "";

  return `You are Clara, a friendly AI health assistant for Klaro.
Your role is to help patients understand their medical documents and health data.
Be concise, clear, and empathetic.
Never provide medical diagnosis or treatment advice.
Always recommend consulting a healthcare professional for medical decisions.

${langInstruction}
${patientData}

When answering questions about the patient data:
- Explain medical terms in simple language
- Highlight important values that may need attention
- Suggest follow-up questions the patient might want to ask their doctor
- Be reassuring but honest about what the data shows`;
}

export function shouldRespondToMessage(
  message: string,
): boolean {
  const trimmed = message.trim().toLowerCase();

  if (trimmed.length < 2) return false;
  if (/^(hi|hello|hey|good morning|good afternoon|good evening)$/i.test(trimmed)) return true;
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

export function buildPatientDataSummary(
  data: Record<string, unknown>,
): string {
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

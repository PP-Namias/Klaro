export type SafetyLevel = "safe" | "caution" | "blocked";

export interface SafetyResult {
  level: SafetyLevel;
  reason?: string;
  modifiedContent?: string;
}

const BLOCKED_PATTERNS = [
  /prescribe\s+(me\s+)?(a\s+)?medication/i,
  /give\s+me\s+(a\s+)?prescription/i,
  /what\s+(medication|drug|medicine)\s+should\s+i\s+take/i,
  /diagnose\s+me/i,
  /what\s+is\s+my\s+diagnosis/i,
  /should\s+i\s+stop\s+taking/i,
  /replace\s+my\s+medication/i,
];

const CAUTION_PATTERNS = [
  /how\s+(bad|serious|dangerous)\s+is/i,
  /will\s+i\s+(die|pass\s+away)/i,
  /is\s+this\s+(fatal|terminal|cancer)/i,
  /should\s+i\s+(worry|be\s+scared)/i,
];

const SAFETY_DISCLAIMER =
  "This information is for educational purposes only. Please consult your healthcare provider for medical advice.";

export function filterContent(content: string): SafetyResult {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(content)) {
      return {
        level: "blocked",
        reason:
          "This question requires professional medical advice. Please consult your doctor.",
      };
    }
  }

  for (const pattern of CAUTION_PATTERNS) {
    if (pattern.test(content)) {
      return {
        level: "caution",
        reason:
          "I understand your concern. Let me explain what I can share, but please consult your doctor for personalized advice.",
      };
    }
  }

  return { level: "safe" };
}

export function getChatSafetyLevel(content: string): SafetyLevel {
  return filterContent(content).level;
}

export function buildSafetyDisclaimer(): string {
  return SAFETY_DISCLAIMER;
}

export function shouldSuggestBooking(severity: string): boolean {
  return severity === "high" || severity === "critical";
}

export function buildBookingSuggestion(): string {
  return "Based on your results, I recommend consulting with a doctor. Would you like me to help you find nearby clinics or book an appointment?";
}

export function logSafetyEvent(
  analysisId: string,
  content: string,
  result: SafetyResult,
): void {
  console.log(
    JSON.stringify({
      type: "chat_safety",
      analysisId,
      contentLength: content.length,
      level: result.level,
      reason: result.reason,
      timestamp: new Date().toISOString(),
    }),
  );
}

export function validateMessageLength(content: string): string[] {
  const errors: string[] = [];

  if (content.length > 2000) {
    errors.push("Message is too long (maximum 2000 characters)");
  }

  if (content.trim().length === 0) {
    errors.push("Message cannot be empty");
  }

  return errors;
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}

export function isMedicalAdviceRequest(content: string): boolean {
  const patterns = [
    /what\s+(medication|drug|medicine)/i,
    /should\s+i\s+(take|stop|start)/i,
    /how\s+much\s+(medication|drug|medicine)/i,
    /dosage/i,
    /prescription/i,
  ];

  return patterns.some((p) => p.test(content));
}

export function isHealthInformationQuery(content: string): boolean {
  const patterns = [
    /what\s+is/i,
    /explain/i,
    /tell\s+me\s+about/i,
    /what\s+does\s+this\s+mean/i,
    /help\s+me\s+understand/i,
    /what\s+are\s+the\s+symptoms/i,
  ];

  return patterns.some((p) => p.test(content));
}

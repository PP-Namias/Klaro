/**
 * Medical Context Guardrails
 *
 * Prevents AI from providing diagnostic or treatment advice.
 * Filters outputs to ensure compliance with medical AI regulations.
 *
 * Based on FDA guidelines for AI/ML-based Software as Medical Device (SaMD)
 * and HIPAA requirements for health information assistance.
 */

// ============================================================================
// Types
// ============================================================================

export type GuardrailLevel = "safe" | "caution" | "blocked" | "filtered";

export interface GuardrailResult {
  level: GuardrailLevel;
  reason?: string;
  originalContent?: string;
  filteredContent?: string;
  modifications: string[];
}

export interface GuardrailConfig {
  /** Enable strict mode (blocks more patterns) */
  strictMode: boolean;
  /** Add disclaimers to all responses */
  enforceDisclaimers: boolean;
  /** Maximum confidence threshold for medical statements */
  maxConfidenceThreshold: number;
  /** Enable output filtering */
  enableOutputFiltering: boolean;
}

const DEFAULT_CONFIG: GuardrailConfig = {
  strictMode: process.env.MEDICAL_GUARDRAIL_STRICT === "true",
  enforceDisclaimers: true,
  maxConfidenceThreshold: 0.8,
  enableOutputFiltering: true,
};

// ============================================================================
// Input Detection Patterns
// ============================================================================

/**
 * Patterns that indicate the user is requesting medical advice
 */
const DIAGNOSIS_REQUEST_PATTERNS = [
  // Direct diagnosis requests
  /what\s+(is|are)\s+my\s+(diagnosis|diagnoses)/i,
  /diagnose\s+(me|this)/i,
  /do\s+i\s+have\s+(cancer|diabetes|heart\s+disease|hypertension)/i,
  /am\s+i\s+(sick|ill|dying|healthy)/i,
  /is\s+this\s+(serious|dangerous|life-threatening|fatal)/i,

  // Treatment advice requests
  /what\s+(medication|drug|medicine)\s+should\s+i\s+take/i,
  /should\s+i\s+(take|stop|start|change)\s+(my\s+)?(medication|drug|medicine|treatment)/i,
  /how\s+much\s+(medication|drug|medicine)\s+should\s+i/i,
  /what\s+dosage/i,
  /can\s+i\s+(stop|skip|reduce)\s+(my\s+)?(medication|drug|medicine)/i,
  /should\s+i\s+(be\s+worried|be\s+scared|panic)/i,

  // Prognosis requests
  /how\s+long\s+do\s+i\s+have/i,
  /will\s+i\s+(die|pass\s+away|survive|live)/i,
  /what\s+is\s+my\s+prognosis/i,
  /is\s+there\s+a\s+cure/i,

  // Self-treatment requests
  /what\s+can\s+i\s+do\s+at\s+home/i,
  /home\s+remedy/i,
  /should\s+i\s+go\s+to\s+the\s+er/i,
  /is\s+this\s+an?\s+emergency/i,
];

/**
 * Patterns that indicate educational information requests (allowed)
 */
const EDUCATIONAL_QUERY_PATTERNS = [
  /what\s+is\s+(hypertension|diabetes|cholesterol|anemia)/i,
  /explain\s+(this|these|the)\s+(result|test|value)/i,
  /what\s+does\s+(this|these|the)\s+(result|test|value)\s+mean/i,
  /tell\s+me\s+about\s+(this|these)/i,
  /help\s+me\s+understand/i,
  /what\s+are\s+(the\s+)?normal\s+values/i,
  /what\s+is\s+a\s+normal/i,
];

// ============================================================================
// Output Filtering Patterns
// ============================================================================

/**
 * Patterns in AI output that indicate diagnostic statements (must be filtered)
 */
const DIAGNOSTIC_OUTPUT_PATTERNS = [
  /you\s+have\s+(a\s+)?(cancer|tumor|infection|disease|disorder)/i,
  /your\s+diagnosis\s+is/i,
  /based\s+on\s+your\s+results?,?\s+you\s+(have|are|likely)/i,
  /this\s+(indicates|suggests|confirms|shows)\s+that\s+you\s+have/i,
  /you\s+(are\s+suffering|have\s+been\s+diagnosed)/i,
  /the\s+test\s+results?\s+show\s+that\s+you/i,
  /you\s+need\s+(to\s+start|immediate|urgent)\s+(treatment|medication)/i,
  /this\s+is\s+(a\s+sign\s+of|indicative\s+of|consistent\s+with)/i,
];

/**
 * Patterns in AI output that provide treatment advice (must be filtered)
 */
const TREATMENT_OUTPUT_PATTERNS = [
  /you\s+should\s+(take|start|stop|increase|decrease)\s+(this|the|a)/i,
  /take\s+\d+\s+(mg|mcg|ml|tablets?|capsules?)/i,
  /dosage:\s*\d+/i,
  /i\s+(recommend|suggest|prescribe)\s+(you\s+)?(to\s+)?(take|start|use)/i,
  /this\s+medication\s+will\s+(cure|treat|fix)/i,
  /you\s+must\s+(take|use|apply)/i,
];

// ============================================================================
// Disclaimers
// ============================================================================

const MEDICAL_DISCLAIMERS = {
  en: "This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.",
  fil: "Ang impormasyong ito ay para lamang sa pang-edukasyong layunin at hindi kapalit ng propesyonal na payong medikal, pagsusuri, o paggamot. Laging kumonsulta sa inyong doktor para sa anumang katanungan tungkol sa inyong kalusugan.",
  ceb: "Kini nga impormasyon para lang sa edukasyon ug dili kapuli sa propesyonal nga medikal nga tambag, diagnosis, o pagtambal. Sulayi kanunay ang inyong doktor alangan sa bisan unsang pangutana bahin sa inyong kahimsog.",
  ilo: "Daytoy nga impormasyon para iti edukasyon wen a kasumpay iti propesyonal a medikal a saranay, diagnosis, wen a panangpateg. Kita iti doktor para iti anyo a panggep iti panagsaludsog iti kasasaad.",
};

// ============================================================================
// Core Guardrail Functions
// ============================================================================

/**
 * Check if user input is requesting medical advice
 */
export function checkInputGuardrails(
  input: string,
  config: GuardrailConfig = DEFAULT_CONFIG,
): GuardrailResult {
  const modifications: string[] = [];

  // Check for blocked patterns (diagnosis/treatment requests)
  for (const pattern of DIAGNOSIS_REQUEST_PATTERNS) {
    if (pattern.test(input)) {
      return {
        level: "blocked",
        reason: "This request asks for medical diagnosis or treatment advice, which I cannot provide. Please consult a healthcare professional.",
        originalContent: input,
        modifications: ["diagnosis_request_blocked"],
      };
    }
  }

  // Check for educational queries (allowed)
  for (const pattern of EDUCATIONAL_QUERY_PATTERNS) {
    if (pattern.test(input)) {
      modifications.push("educational_query_detected");
      return {
        level: "safe",
        originalContent: input,
        modifications,
      };
    }
  }

  // Strict mode: block more patterns
  if (config.strictMode) {
    const strictPatterns = [
      /how\s+bad\s+is\s+this/i,
      /should\s+i\s+worry/i,
      /what\s+does\s+this\s+mean\s+for\s+me/i,
    ];

    for (const pattern of strictPatterns) {
      if (pattern.test(input)) {
        return {
          level: "caution",
          reason: "This question may require personalized medical advice. Please consult your doctor for specific guidance.",
          originalContent: input,
          modifications: ["strict_mode_caution"],
        };
      }
    }
  }

  return {
    level: "safe",
    originalContent: input,
    modifications,
  };
}

/**
 * Filter AI output to remove diagnostic/treatment statements
 */
export function filterOutput(
  output: string,
  config: GuardrailConfig = DEFAULT_CONFIG,
): GuardrailResult {
  if (!config.enableOutputFiltering) {
    return {
      level: "safe",
      originalContent: output,
      filteredContent: output,
      modifications: [],
    };
  }

  const modifications: string[] = [];
  let filtered = output;

  // Check for diagnostic statements
  for (const pattern of DIAGNOSTIC_OUTPUT_PATTERNS) {
    if (pattern.test(filtered)) {
      modifications.push("diagnostic_statement_filtered");
      // Replace the problematic phrase with a safe alternative
      filtered = filtered.replace(
        pattern,
        "Based on the information provided, it would be best to discuss these results with your doctor.",
      );
    }
  }

  // Check for treatment advice
  for (const pattern of TREATMENT_OUTPUT_PATTERNS) {
    if (pattern.test(filtered)) {
      modifications.push("treatment_advice_filtered");
      filtered = filtered.replace(
        pattern,
        "For specific treatment recommendations, please consult your healthcare provider.",
      );
    }
  }

  // Add disclaimer if enforcement is enabled
  if (config.enforceDisclaimers && modifications.length === 0) {
    // Only add disclaimer to substantive responses
    if (filtered.length > 100) {
      filtered = `${filtered}\n\n---\n*${MEDICAL_DISCLAIMERS.en}*`;
      modifications.push("disclaimer_added");
    }
  }

  const level: GuardrailLevel =
    modifications.includes("diagnostic_statement_filtered") ||
    modifications.includes("treatment_advice_filtered")
      ? "filtered"
      : "safe";

  return {
    level,
    originalContent: output,
    filteredContent: filtered,
    modifications,
  };
}

/**
 * Build a safe response when guardrails block the request
 */
export function buildBlockedResponse(
  originalQuery: string,
  language: string = "en",
): string {
  const disclaimer =
    MEDICAL_DISCLAIMERS[language as keyof typeof MEDICAL_DISCLAIMERS] ||
    MEDICAL_DISCLAIMERS.en;

  return `I understand you're looking for medical guidance. However, I can only provide general health information and help you understand your test results.

For personalized medical advice, diagnosis, or treatment recommendations, please consult your healthcare provider.

${disclaimer}`;
}

/**
 * Build a safe response for educational queries
 */
export function buildEducationalResponse(
  query: string,
  language: string = "en",
): string {
  const disclaimer =
    MEDICAL_DISCLAIMERS[language as keyof typeof MEDICAL_DISCLAIMERS] ||
    MEDICAL_DISCLAIMERS.en;

  return `I can help explain this medical concept. Here's what I can share:\n\n[Response would be generated here based on the query]\n\n---\n*${disclaimer}*`;
}

/**
 * Validate that a response doesn't contain diagnostic statements
 */
export function validateResponse(response: string): {
  isValid: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  for (const pattern of DIAGNOSTIC_OUTPUT_PATTERNS) {
    if (pattern.test(response)) {
      violations.push(`Diagnostic statement detected: ${pattern.source}`);
    }
  }

  for (const pattern of TREATMENT_OUTPUT_PATTERNS) {
    if (pattern.test(response)) {
      violations.push(`Treatment advice detected: ${pattern.source}`);
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}

/**
 * Get all available disclaimers
 */
export function getDisclaimers(): typeof MEDICAL_DISCLAIMERS {
  return { ...MEDICAL_DISCLAIMERS };
}

/**
 * Get disclaimer for specific language
 */
export function getDisclaimer(language: string): string {
  return (
    MEDICAL_DISCLAIMERS[language as keyof typeof MEDICAL_DISCLAIMERS] ||
    MEDICAL_DISCLAIMERS.en
  );
}

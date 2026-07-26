/**
 * PHI (Protected Health Information) Scrubber
 *
 * Detects and redacts PII/PHI from text before sending to external LLM APIs.
 * Uses regex-based NER for medical-specific identifiers.
 *
 * HIPAA PHI categories covered:
 * - Names (patient, doctor)
 * - Dates of birth
 * - Social Security Numbers (SSN)
 * - Medical Record Numbers (MRN)
 * - Phone numbers
 * - Addresses
 * - Email addresses
 * - Insurance/ID numbers
 * - Facial photographs (handled at file level)
 */

export interface PhiMatch {
  type: PhiType;
  value: string;
  start: number;
  end: number;
}

export type PhiType =
  | "name"
  | "date_of_birth"
  | "ssn"
  | "mrn"
  | "phone"
  | "address"
  | "email"
  | "insurance_id"
  | "age"
  | "license_id"
  | "passport";

export interface ScrubResult {
  scrubbedText: string;
  originalText: string;
  matches: PhiMatch[];
  matchCount: number;
}

export interface ScrubberConfig {
  /** Replacement token for redacted values (default: [REDACTED] with type) */
  replacementToken?: string;
  /** Whether to preserve first/last character for partial masking */
  partialMask?: boolean;
  /** Custom name list for improved name detection */
  knownNames?: string[];
}

const DEFAULT_REPLACEMENT = "[REDACTED]";

type ScrubbableData = Record<string, unknown> & {
  patientName?: unknown;
  diagnosis?: unknown;
};

// ============================================================================
// PHI Detection Patterns
// ============================================================================

/**
 * SSN: XXX-XX-XXXX or XXXXXXXXX
 * Filipino PhilHealth: XXX-XXXXXXX-X (12 digits with dashes)
 */
/**
 * Philippine PRC License: 7 digits
 */
const PRC_PATTERN = /\bPRC\s*LICENSE[\s:-]*#?\s*\d{7}\b/gi;

/**
 * Philippine Passport: PXXXXXXXM (letter prefix, 7 digits, letter suffix)
 */
const PASSPORT_PATTERN = /\bP\d{7}[A-Za-z]\b/g;

const SSN_PATTERN = /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g;

/**
 * Medical Record Numbers: MRN, MEDICAL RECORD, or pattern like MRN-XXXXX
 */
const MRN_PATTERNS: RegExp[] = [
  /\bMRN[\s:-]*#?\s*\d{4,12}\b/gi,
  /\bMEDICAL\s*RECORD[\s:-]*#?\s*\d{4,12}\b/gi,
  /\bMED\s*RECORD[\s:-]*#?\s*\d{4,12}\b/gi,
];

/**
 * Phone numbers: various Philippine and international formats
 * +63XXXXXXXXXX, 09XX-XXX-XXXX, (02) XXXX-XXXX
 */
const PHONE_PATTERNS: RegExp[] = [
  /\+63[\s.-]?\d{2,3}[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
  /\b09\d{2}[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
  /\(0\d{1,3}\)[\s.-]?\d{3,4}[\s.-]?\d{4}\b/g,
  /\b0\d{1,3}[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
];

/**
 * Email addresses
 */
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

/**
 * Dates of birth: MM/DD/YYYY, DD-MM-YYYY, Month DD, YYYY, YYYY-MM-DD
 * Filtered by context clues (DOB, birth, born, date of birth)
 */
const DOB_CONTEXT_PATTERNS: RegExp[] = [
  /\b(?:DOB|D\.O\.B\.|DATE\s*OF\s*BIRTH|BIRTHDATE|BORN|BIRTH\s*DATE)[:\s]*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})\b/gi,
  /\b(?:DOB|D\.O\.B\.|DATE\s*OF\s*BIRTH|BIRTHDATE|BORN|BIRTH\s*DATE)[:\s]*(\w+\s+\d{1,2},?\s+\d{4})\b/gi,
  /\b(?:DOB|D\.O\.B\.|DATE\s*OF\s*BIRTH|BIRTHDATE|BORN|BIRTH\s*DATE)[:\s]*(\d{4}-\d{2}-\d{2})\b/gi,
];

/**
 * Standalone dates that look like birth years (19XX, 20XX context)
 */
const BIRTH_YEAR_PATTERN =
  /\b(0[1-9]|1[0-2])[\/.-](0[1-9]|[12]\d|3[01])[\/.-](19|20)\d{2}\b/g;

/**
 * Addresses: Philippine address patterns
 * St., Street, Brgy., Barangay, City, Province, ZIP
 */
const ADDRESS_PATTERNS: RegExp[] = [
  /\b\d+\s+[A-Za-z\s.]+?(?:St\.|Street|Ave\.|Avenue|Blvd\.|Boulevard|Rd\.|Road|Dr\.|Drive)(?=\s|$|[.,;!?])/gi,
  /\b(?:BRGY\.|BARANGAY)\s+[A-Za-z\s]+/gi,
  /\b[A-Za-z\s]+,\s*(?:CITY|PROVINCE)\s+OF\s+[A-Za-z\s]+/gi,
];

/**
 * Insurance ID patterns: PhilHealth, HMO, insurance numbers
 */
const INSURANCE_PATTERNS: RegExp[] = [
  /\bPHILHEALTH[\s:-]*#?\s*\d{2}[-]?\d{7}[-]?\d/gi,
  /\bHMO[\s:-]*#?\s*\d{6,12}\b/gi,
  /\bINSURANCE[\s:-]*#?\s*\d{6,12}\b/gi,
];

// ============================================================================
// Name Detection (Context-Aware)
// ============================================================================

/**
 * Context-aware name detection using common medical document labels
 */
const NAME_CONTEXT_PATTERNS: RegExp[] = [
  /\b(?:PATIENT|PAT\.|PATIENT\s*NAME|NAME)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/gi,
  /\b(?:DOCTOR|DR\.|PHYSICIAN|ATTENDING)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/gi,
  /\b(?:LABORATORY|CLINIC|HOSPITAL)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/gi,
  /\b(?:PATIENT\s+IS|PATIENT\s+NAMED)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/gi,
];

// ============================================================================
// Core Scrubbing Functions
// ============================================================================

/**
 * Scrub all PHI from text before sending to external APIs
 */
export function scrubPhi(
  text: string,
  config: ScrubberConfig = {},
): ScrubResult {
  const { replacementToken = DEFAULT_REPLACEMENT } = config;
  const matches: PhiMatch[] = [];
  let scrubbed = text;

  // 1. SSN / PhilHealth
  scrubbed = redactPattern(
    scrubbed,
    SSN_PATTERN,
    "ssn",
    replacementToken,
    matches,
  );

  // 1a. PRC License
  scrubbed = redactPattern(
    scrubbed,
    PRC_PATTERN,
    "license_id",
    replacementToken,
    matches,
  );

  // 1b. Passport
  scrubbed = redactPattern(
    scrubbed,
    PASSPORT_PATTERN,
    "passport",
    replacementToken,
    matches,
  );

  // 2. MRN
  for (const pattern of MRN_PATTERNS) {
    scrubbed = redactPattern(
      scrubbed,
      pattern,
      "mrn",
      replacementToken,
      matches,
    );
  }

  // 3. Insurance IDs
  for (const pattern of INSURANCE_PATTERNS) {
    scrubbed = redactPattern(
      scrubbed,
      pattern,
      "insurance_id",
      replacementToken,
      matches,
    );
  }

  // 4. Email
  scrubbed = redactPattern(
    scrubbed,
    EMAIL_PATTERN,
    "email",
    replacementToken,
    matches,
  );

  // 5. Phone numbers
  for (const pattern of PHONE_PATTERNS) {
    scrubbed = redactPattern(
      scrubbed,
      pattern,
      "phone",
      replacementToken,
      matches,
    );
  }

  // 6. DOB (context-aware)
  for (const pattern of DOB_CONTEXT_PATTERNS) {
    scrubbed = redactPattern(
      scrubbed,
      pattern,
      "date_of_birth",
      replacementToken,
      matches,
    );
  }

  // 7. Birth dates (MM/DD/YYYY without context)
  scrubbed = redactPattern(
    scrubbed,
    BIRTH_YEAR_PATTERN,
    "date_of_birth",
    replacementToken,
    matches,
  );

  // 8. Addresses
  for (const pattern of ADDRESS_PATTERNS) {
    scrubbed = redactPattern(
      scrubbed,
      pattern,
      "address",
      replacementToken,
      matches,
    );
  }

  // 9. Names (last, to avoid over-matching)
  for (const pattern of NAME_CONTEXT_PATTERNS) {
    scrubbed = redactPattern(
      scrubbed,
      pattern,
      "name",
      replacementToken,
      matches,
    );
  }

  // 10. Custom known names
  if (config.knownNames && config.knownNames.length > 0) {
    for (const name of config.knownNames) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const namePattern = new RegExp(`\\b${escaped}\\b`, "gi");
      scrubbed = redactPattern(
        scrubbed,
        namePattern,
        "name",
        replacementToken,
        matches,
      );
    }
  }

  return {
    scrubbedText: scrubbed,
    originalText: text,
    matches,
    matchCount: matches.length,
  };
}

/**
 * Scrub PHI from extracted medical data (structured object)
 */
export function scrubExtractedData<T extends ScrubbableData>(
  data: T,
  config: ScrubberConfig = {},
): { scrubbedData: T; matches: PhiMatch[] } {
  const allMatches: PhiMatch[] = [];
  const scrubbed = { ...data } as ScrubbableData;

  // Scrub patient name
  if (typeof scrubbed.patientName === "string" && scrubbed.patientName) {
    const nameConfig = {
      ...config,
      knownNames: [...(config.knownNames || []), scrubbed.patientName],
    };
    const result = scrubPhi(scrubbed.patientName, nameConfig);
    scrubbed.patientName = result.scrubbedText;
    allMatches.push(...result.matches);
  }

  // Scrub diagnosis strings
  if (Array.isArray(scrubbed.diagnosis)) {
    scrubbed.diagnosis = scrubbed.diagnosis.map((d: unknown) => {
      if (typeof d === "string") {
        const result = scrubPhi(d, config);
        allMatches.push(...result.matches);
        return result.scrubbedText;
      }
      return d;
    });
  }

  return { scrubbedData: scrubbed as T, matches: allMatches };
}

/**
 * Check if text contains any PHI (without redacting)
 */
export function containsPhi(text: string): boolean {
  const result = scrubPhi(text);
  return result.matchCount > 0;
}

/**
 * Get a summary of PHI types found in text (for audit logging)
 */
export function detectPhiTypes(text: string): PhiType[] {
  const result = scrubPhi(text);
  const types = new Set<PhiType>();
  for (const match of result.matches) {
    types.add(match.type);
  }
  return Array.from(types);
}

// ============================================================================
// Helper Functions
// ============================================================================

function redactPattern(
  text: string,
  pattern: RegExp,
  phiType: PhiType,
  replacement: string,
  matches: PhiMatch[],
): string {
  // Reset regex lastIndex
  const flags = pattern.flags;
  const globalPattern = new RegExp(
    pattern.source,
    flags.includes("g") ? flags : flags + "g",
  );

  let result = text;
  let match: RegExpExecArray | null;

  interface RedactionMatch {
    match: RegExpExecArray;
    fullMatch: string;
    index: number;
  }

  // Collect all matches first
  const foundMatches: RedactionMatch[] = [];

  while ((match = globalPattern.exec(text)) !== null) {
    // For patterns with capturing groups, prefer the captured group
    const captured = match[1] || match[0];
    const startIdx = match.index + match[0].indexOf(captured);
    foundMatches.push({
      match,
      fullMatch: captured.trim(),
      index: startIdx,
    });
  }

  // Apply redactions in reverse order to preserve indices
  for (let i = foundMatches.length - 1; i >= 0; i--) {
    const fm = foundMatches[i]!;
    const { fullMatch, index } = fm;
    const endIdx = index + fullMatch.length;

    matches.push({
      type: phiType,
      value: fullMatch,
      start: index,
      end: endIdx,
    });

    // Replace in the string
    const before = result.slice(0, index);
    const after = result.slice(endIdx);
    result = before + replacement + after;
  }

  return result;
}

/**
 * Scrub text for the document extraction pipeline
 * This is the main integration point for BE-03
 */
export function scrubForExternalApi(
  text: string,
  context?: {
    patientName?: string;
    knownNames?: string[];
  },
): ScrubResult {
  const config: ScrubberConfig = {
    replacementToken: "[PHI_REDACTED]",
    knownNames: context?.knownNames,
  };

  // If we know the patient name, add it for better detection
  if (context?.patientName) {
    config.knownNames = [...(config.knownNames || []), context.patientName];
  }

  return scrubPhi(text, config);
}

/**
 * Build a redacted version of extracted data for LLM context
 * Keeps medical data intact but removes patient identifiers
 */
export function buildScrubbedContext(
  extractedFields: Record<string, unknown>,
  plainLanguageSummary?: string,
): {
  scrubbedFields: Record<string, unknown>;
  scrubbedSummary: string;
  phiCount: number;
} {
  const { scrubbedData, matches: fieldMatches } =
    scrubExtractedData(extractedFields);

  let scrubbedSummary = plainLanguageSummary || "";
  let summaryMatches: PhiMatch[] = [];
  if (plainLanguageSummary) {
    const summaryResult = scrubPhi(plainLanguageSummary);
    scrubbedSummary = summaryResult.scrubbedText;
    summaryMatches = summaryResult.matches;
  }

  return {
    scrubbedFields: scrubbedData,
    scrubbedSummary,
    phiCount: fieldMatches.length + summaryMatches.length,
  };
}

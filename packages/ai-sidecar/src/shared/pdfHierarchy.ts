/**
 * Hierarchy-aware PDF structure detection for medical documents.
 * Detects headings, tables and lab sections and preserves metadata for RAG grounding.
 */

export type MedicalSectionType =
  | "lab_result"
  | "prescription"
  | "discharge_summary"
  | "consultation"
  | "imaging"
  | "other_doc"
  | "generic";

export interface DetectedHeading {
  heading: string;
  level: number;
  index: number;
}

export interface Section {
  heading: string;
  headingLevel: number;
  sectionType: MedicalSectionType;
  content: string;
  startOffset: number;
  endOffset: number;
}

const HEADING_PATTERNS: { re: RegExp; level: number }[] = [
  { re: /^(PATIENT|NAME|DOB|AGE|SEX|MRN|ADDRESS|CONTACT)\s*:/im, level: 1 },
  { re: /^(CHIEF COMPLAINT|HISTORY OF PRESENT ILLNESS|PAST MEDICAL HISTORY|REVIEW OF SYSTEMS)\s*:?/im, level: 1 },
  { re: /^(LABORATORY RESULTS?|LAB RESULTS?|CBC|COMPLETE BLOOD COUNT|CHEMISTRY|URINALYSIS|LIPID PROFILE|BLOOD CHEMISTRY)\s*:?/im, level: 1 },
  { re: /^(IMPRESSION|FINDINGS|CONCLUSION|DIAGNOSIS|ASSESSMENT)\s*:?/im, level: 1 },
  { re: /^(PRESCRIPTION|MEDICATIONS?|Rx|DISCHARGE MEDICATIONS?)\s*:?/im, level: 1 },
  { re: /^(DISCHARGE SUMMARY|ADMISSION|DISCHARGE CONDITION|FOLLOW[-\s]?UP)\s*:?/im, level: 1 },
  { re: /^(RADIOLOGY|IMAGING|X[-\s]?RAY|CT SCAN|MRI|ULTRASOUND)\s*:?/im, level: 1 },
  { re: /^(VITAL SIGNS|PHYSICAL EXAMINATION|OBJECTIVE|SUBJECTIVE|PLAN)\s*:?/im, level: 2 },
  { re: /^[A-Z][A-Z \-/]{4,40}:?\s*$/m, level: 3 },
];

const TABLE_ROW_RE = /([A-Za-z0-9 /()\-]+?\s{2,}[0-9.\-]+\s*[A-Za-z/%]*\s*[0-9.\-]*)/;
const LAB_TEST_RE = /(WBC|RBC|Hgb|Hct|MCV|MCH|Platelet|Glucose|Creatinine|BUN|ALT|AST|Cholesterol|Triglycerides|HDL|LDL|Sodium|Potassium|Urinalysis)[\s:]+[0-9.,]+/i;

export function detectSectionType(text: string): MedicalSectionType {
  const t = text.toLowerCase();
  if (/lab(oratory)? result|cbc|complete blood count|urinalysis|lipid profile|blood chemistry/.test(t)) return "lab_result";
  if (/prescription|medication|rx\b|dosage/.test(t)) return "prescription";
  if (/discharge summary|admission.*discharge/.test(t)) return "discharge_summary";
  if (/consultation|chief complaint|history of present illness/.test(t)) return "consultation";
  if (/radiology|imaging|x-?ray|ct scan|mri|ultrasound|findings|impression/.test(t)) return "imaging";
  if (/medical certificate|referral|clearance/.test(t)) return "other_doc";
  return "generic";
}

export function detectHeadings(text: string): DetectedHeading[] {
  const headings: DetectedHeading[] = [];
  const lines = text.split("\n");
  let offset = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      offset += line.length + 1;
      continue;
    }
    for (const { re, level } of HEADING_PATTERNS) {
      if (re.test(trimmed)) {
        headings.push({ heading: trimmed.replace(/:$/, "").trim(), level, index: offset });
        break;
      }
    }
    offset += line.length + 1;
  }
  return headings;
}

export function hasTabularContent(text: string): boolean {
  return TABLE_ROW_RE.test(text) || LAB_TEST_RE.test(text);
}

export function parseHierarchy(text: string): Section[] {
  const headings = detectHeadings(text);
  if (headings.length === 0) {
    return [
      {
        heading: "Document",
        headingLevel: 0,
        sectionType: detectSectionType(text),
        content: text,
        startOffset: 0,
        endOffset: text.length,
      },
    ];
  }

  const sections: Section[] = [];
  for (let i = 0; i < headings.length; i++) {
    const h = headings[i]!;
    const next = headings[i + 1];
    const start = h.index;
    const end = next ? next.index : text.length;
    const slice = text.slice(start, end).trim();
    // heading line + rest
    const content = slice.split("\n").slice(1).join("\n").trim() || slice;
    sections.push({
      heading: h.heading,
      headingLevel: h.level,
      sectionType: detectSectionType(slice),
      content,
      startOffset: start,
      endOffset: end,
    });
  }
  return sections;
}

/**
 * Enrich a page with hierarchy sections and table flags.
 */
export function enrichPage(pageText: string, pageNumber: number): {
  sections: Section[];
  hasTable: boolean;
  sectionType: MedicalSectionType;
} {
  return {
    sections: parseHierarchy(pageText),
    hasTable: hasTabularContent(pageText),
    sectionType: detectSectionType(pageText),
  };
}

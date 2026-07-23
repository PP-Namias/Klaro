/**
 * Contradictory Data Detection Service
 *
 * AI-05: Implement contradictory medical data detection.
 *
 * Detects conflicts between:
 * 1. Multiple extractions from the same document
 * 2. Inconsistent patient information
 * 3. Conflicting diagnoses and medications
 * 4. Temporal contradictions
 */

// ============================================================================
// Types
// ============================================================================

export type ContradictionSeverity = "info" | "warning" | "error" | "critical";

export interface Contradiction {
  /** Unique identifier for this contradiction */
  id: string;
  /** Type of contradiction detected */
  type: string;
  /** Severity level */
  severity: ContradictionSeverity;
  /** Human-readable description */
  description: string;
  /** The conflicting values */
  conflictingValues: Array<{
    value: string;
    source?: string;
    field?: string;
  }>;
  /** Suggested resolution */
  resolution?: string;
}

export interface ContradictionResult {
  /** Total contradictions found */
  totalContradictions: number;
  /** By severity */
  bySeverity: Record<ContradictionSeverity, number>;
  /** List of all contradictions */
  contradictions: Contradiction[];
  /** Whether the document requires manual review */
  requiresReview: boolean;
  /** Overall consistency score (0 = completely inconsistent, 1 = fully consistent) */
  consistencyScore: number;
  /** Summary message */
  summary: string;
}

export interface MedicalDocument {
  /** Document ID */
  id: string;
  /** Patient name from document */
  patientName?: string;
  /** Document date */
  date?: string;
  /** Document type */
  documentType?: string;
  /** Extracted tests */
  tests: Array<{
    name: string;
    value: string;
    unit?: string;
    referenceRange?: string;
    flagged?: boolean;
  }>;
  /** Extracted diagnoses */
  diagnosis: string[];
  /** Extracted medications */
  medications: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
  }>;
  /** Extraction confidence */
  confidence?: number;
  /** OCR text */
  ocrText?: string;
}

// ============================================================================
// Detection Functions
// ============================================================================

/**
 * Generate a unique ID for contradictions
 */
function generateContradictionId(): string {
  return `CONTR-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Detect patient name inconsistencies
 */
function detectPatientNameConflicts(
  documents: MedicalDocument[],
): Contradiction[] {
  const contradictions: Contradiction[] = [];

  // Group by similar patient names (fuzzy matching)
  const nameMap = new Map<string, MedicalDocument[]>();
  for (const doc of documents) {
    if (!doc.patientName) continue;
    const normalizedName = doc.patientName.toLowerCase().trim();
    const existing = nameMap.get(normalizedName) || [];
    existing.push(doc);
    nameMap.set(normalizedName, existing);
  }

  // Check for very similar names that might be the same person
  const names = Array.from(nameMap.keys());
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const similarity = calculateStringSimilarity(names[i], names[j]);
      if (similarity > 0.8 && similarity < 1) {
        // Similar but not identical - potential conflict
        const docs1 = nameMap.get(names[i]) || [];
        const docs2 = nameMap.get(names[j]) || [];
        contradictions.push({
          id: generateContradictionId(),
          type: "patient_name_variant",
          severity: "warning",
          description: `Similar patient names detected: "${docs1[0].patientName}" and "${docs2[0].patientName}"`,
          conflictingValues: [
            { value: docs1[0].patientName!, source: docs1[0].id, field: "patientName" },
            { value: docs2[0].patientName!, source: docs2[0].id, field: "patientName" },
          ],
          resolution: "Verify if these documents belong to the same patient",
        });
      }
    }
  }

  return contradictions;
}

/**
 * Detect date inconsistencies
 */
function detectDateConflicts(
  documents: MedicalDocument[],
): Contradiction[] {
  const contradictions: Contradiction[] = [];

  // Check for dates that are too far apart for related documents
  const dates = documents
    .filter((d) => d.date)
    .map((d) => ({ date: new Date(d.date!), doc: d }))
    .filter((d) => !isNaN(d.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // Check for future dates
  const now = new Date();
  for (const { date, doc } of dates) {
    if (date > now) {
      contradictions.push({
        id: generateContradictionId(),
        type: "future_date",
        severity: "error",
        description: `Document date ${doc.date} is in the future`,
        conflictingValues: [
          { value: doc.date!, source: doc.id, field: "date" },
        ],
        resolution: "Verify the document date is correct",
      });
    }

    // Check for dates more than 1 year in the past
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    if (date < oneYearAgo) {
      contradictions.push({
        id: generateContradictionId(),
        type: "old_date",
        severity: "info",
        description: `Document date ${doc.date} is more than 1 year old`,
        conflictingValues: [
          { value: doc.date!, source: doc.id, field: "date" },
        ],
        resolution: "Consider if this document is still relevant",
      });
    }
  }

  return contradictions;
}

/**
 * Detect conflicting test results across documents
 */
function detectTestConflicts(
  documents: MedicalDocument[],
): Contradiction[] {
  const contradictions: Contradiction[] = [];

  // Group tests by name across documents
  const testMap = new Map<string, Array<{ value: string; source: string }>>();

  for (const doc of documents) {
    for (const test of doc.tests) {
      const key = test.name.toLowerCase();
      const existing = testMap.get(key) || [];
      existing.push({ value: test.value, source: doc.id });
      testMap.set(key, existing);
    }
  }

  // Check for conflicting values
  for (const [testName, entries] of testMap) {
    if (entries.length < 2) continue;

    // Get unique values
    const uniqueValues = [...new Set(entries.map((e) => e.value))];
    if (uniqueValues.length <= 1) continue;

    // Check if values are significantly different
    const numericValues = entries
      .map((e) => ({ value: parseFloat(e.value), source: e.source }))
      .filter((e) => !isNaN(e.value));

    if (numericValues.length >= 2) {
      const values = numericValues.map((e) => e.value);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min;
      const avg = values.reduce((a, b) => a + b, 0) / values.length;

      // Flag if range is more than 50% of average
      if (avg > 0 && range / avg > 0.5) {
        contradictions.push({
          id: generateContradictionId(),
          type: "conflicting_test_values",
          severity: "warning",
          description: `Conflicting values for test "${testName}": range ${min}-${max}`,
          conflictingValues: entries.map((e) => ({
            value: e.value,
            source: e.source,
            field: testName,
          })),
          resolution: "Verify test values are from different dates or check for errors",
        });
      }
    }
  }

  return contradictions;
}

/**
 * Detect conflicting diagnoses
 */
function detectDiagnosisConflicts(
  documents: MedicalDocument[],
): Contradiction[] {
  const contradictions: Contradiction[] = [];

  // Check for contradictory diagnoses
  const contradictoryPairs = [
    ["diabetes", "no diabetes"],
    ["hypertension", "normal blood pressure"],
    ["positive", "negative"],
    ["elevated", "normal"],
    ["abnormal", "normal"],
  ];

  const allDiagnoses = documents.flatMap((d) =>
    d.diagnosis.map((diag) => ({ diagnosis: diag, source: d.id })),
  );

  for (const [term1, term2] of contradictoryPairs) {
    const matches1 = allDiagnoses.filter((d) =>
      d.diagnosis.toLowerCase().includes(term1),
    );
    const matches2 = allDiagnoses.filter((d) =>
      d.diagnosis.toLowerCase().includes(term2),
    );

    if (matches1.length > 0 && matches2.length > 0) {
      contradictions.push({
        id: generateContradictionId(),
        type: "contradictory_diagnosis",
        severity: "error",
        description: `Contradictory diagnoses: "${term1}" vs "${term2}"`,
        conflictingValues: [
          ...matches1.map((m) => ({ value: m.diagnosis, source: m.source })),
          ...matches2.map((m) => ({ value: m.diagnosis, source: m.source })),
        ],
        resolution: "Verify diagnoses are from different time periods or resolve conflict",
      });
    }
  }

  return contradictions;
}

/**
 * Detect medication conflicts
 */
function detectMedicationConflicts(
  documents: MedicalDocument[],
): Contradiction[] {
  const contradictions: Contradiction[] = [];

  // Group medications by name
  const medMap = new Map<string, Array<{ dosage?: string; frequency?: string; source: string }>>();

  for (const doc of documents) {
    for (const med of doc.medications) {
      const key = med.name.toLowerCase();
      const existing = medMap.get(key) || [];
      existing.push({
        dosage: med.dosage,
        frequency: med.frequency,
        source: doc.id,
      });
      medMap.set(key, existing);
    }
  }

  // Check for conflicting dosages
  for (const [medName, entries] of medMap) {
    if (entries.length < 2) continue;

    const dosages = entries
      .map((e) => ({ dosage: e.dosage, source: e.source }))
      .filter((e) => e.dosage);

    if (dosages.length >= 2) {
      const uniqueDosages = [...new Set(dosages.map((d) => d.dosage))];
      if (uniqueDosages.length > 1) {
        contradictions.push({
          id: generateContradictionId(),
          type: "conflicting_medication_dosage",
          severity: "warning",
          description: `Conflicting dosages for "${medName}": ${uniqueDosages.join(", ")}`,
          conflictingValues: dosages.map((d) => ({
            value: d.dosage!,
            source: d.source,
            field: medName,
          })),
          resolution: "Verify if dosage was changed over time",
        });
      }
    }
  }

  return contradictions;
}

/**
 * Calculate string similarity (Levenshtein-based)
 */
function calculateStringSimilarity(a: string, b: string): number {
  const len1 = a.length;
  const len2 = b.length;
  const maxLen = Math.max(len1, len2);

  if (maxLen === 0) return 1;

  // Simple character-based similarity
  const set1 = new Set(a.split(""));
  const set2 = new Set(b.split(""));
  const intersection = [...set1].filter((c) => set2.has(c));
  const union = new Set([...set1, ...set2]);

  return intersection.length / union.size;
}

// ============================================================================
// Main Detection Function
// ============================================================================

/**
 * Detect all contradictions in a set of medical documents
 */
export function detectContradictions(
  documents: MedicalDocument[],
): ContradictionResult {
  const allContradictions: Contradiction[] = [];

  // Run all detection algorithms
  allContradictions.push(...detectPatientNameConflicts(documents));
  allContradictions.push(...detectDateConflicts(documents));
  allContradictions.push(...detectTestConflicts(documents));
  allContradictions.push(...detectDiagnosisConflicts(documents));
  allContradictions.push(...detectMedicationConflicts(documents));

  // Deduplicate
  const uniqueContradictions = deduplicateContradictions(allContradictions);

  // Count by severity
  const bySeverity: Record<ContradictionSeverity, number> = {
    info: 0,
    warning: 0,
    error: 0,
    critical: 0,
  };
  for (const c of uniqueContradictions) {
    bySeverity[c.severity]++;
  }

  // Calculate consistency score
  const totalPenalty = uniqueContradictions.reduce((sum, c) => {
    switch (c.severity) {
      case "critical":
        return sum + 0.4;
      case "error":
        return sum + 0.2;
      case "warning":
        return sum + 0.1;
      case "info":
        return sum + 0.05;
      default:
        return sum;
    }
  }, 0);
  const consistencyScore = Math.max(0, 1 - totalPenalty);

  // Determine if review is required
  const hasErrors = bySeverity.error > 0 || bySeverity.critical > 0;
  const hasMultipleWarnings = bySeverity.warning >= 2;
  const requiresReview = hasErrors || hasMultipleWarnings || consistencyScore < 0.7;

  // Generate summary
  let summary: string;
  if (uniqueContradictions.length === 0) {
    summary = "No contradictions detected. Data is consistent.";
  } else if (requiresReview) {
    summary = `${uniqueContradictions.length} contradiction(s) found. Manual review recommended.`;
  } else {
    summary = `${uniqueContradictions.length} minor inconsistency(ies) detected.`;
  }

  return {
    totalContradictions: uniqueContradictions.length,
    bySeverity,
    contradictions: uniqueContradictions,
    requiresReview,
    consistencyScore,
    summary,
  };
}

/**
 * Deduplicate contradictions based on type and values
 */
function deduplicateContradictions(
  contradictions: Contradiction[],
): Contradiction[] {
  const seen = new Set<string>();
  return contradictions.filter((c) => {
    const key = `${c.type}-${c.conflictingValues.map((v) => v.value).join(",")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Format contradiction for display
 */
export function formatContradiction(contradiction: Contradiction): string {
  const parts = [
    `[${contradiction.severity.toUpperCase()}] ${contradiction.description}`,
    `Conflicting values: ${contradiction.conflictingValues.map((v) => v.value).join(" vs ")}`,
  ];
  if (contradiction.resolution) {
    parts.push(`Resolution: ${contradiction.resolution}`);
  }
  return parts.join("\n");
}

/**
 * Get severity color for UI
 */
export function getContradictionSeverityColor(
  severity: ContradictionSeverity,
): string {
  switch (severity) {
    case "info":
      return "blue";
    case "warning":
      return "yellow";
    case "error":
      return "red";
    case "critical":
      return "red";
    default:
      return "gray";
  }
}

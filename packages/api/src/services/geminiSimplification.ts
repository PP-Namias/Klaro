import type { MedicalExtractionData } from "./geminiExtraction";

export interface SimplificationResult {
  summary: string;
  dialect: string;
  readingLevel: string;
  success: boolean;
  error?: string;
}

const DIALECT_MAP: Record<string, string> = {
  en: "English",
  fil: "Filipino",
  ceb: "Bisaya",
  ilo: "Ilocano",
};

function getDialectLabel(code: string): string {
  return DIALECT_MAP[code] || "English";
}

export function buildSimplificationPrompt(
  data: MedicalExtractionData,
  language: string = "en",
): string {
  const dialect = getDialectLabel(language);
  const langInstruction = language !== "en"
    ? `Respond in ${dialect}. Use simple words that a grade 5 student would understand.`
    : "Use simple words that a grade 5 student would understand. No medical jargon.";

  const testsSection = data.tests.length > 0
    ? `\nLab Results:\n${data.tests.map((t) =>
        `- ${t.name}: ${t.value || "N/A"} ${t.unit || ""}${t.flagged ? " (FLAGGED - outside normal range)" : ""}${t.referenceRange ? ` [normal: ${t.referenceRange}]` : ""}`
      ).join("\n")}`
    : "";

  const diagnosisSection = data.diagnosis.length > 0
    ? `\nDiagnoses: ${data.diagnosis.join(", ")}`
    : "";

  const medicationsSection = data.medications.length > 0
    ? `\nMedications:\n${data.medications.map((m) =>
        `- ${m.name}${m.dosage ? ` ${m.dosage}` : ""}${m.frequency ? `, ${m.frequency}` : ""}`
      ).join("\n")}`
    : "";

  return `You are a helpful medical assistant explaining lab results to a patient.

${langInstruction}

Explain these medical findings in plain language:

Patient: ${data.patientName || "Unknown"}${testsSection}${diagnosisSection}${medicationsSection}

Your response must be in plain language:
1. Start with a one-sentence summary
2. List any abnormal results and explain what they mean using everyday examples
3. Give practical advice on what to do next
4. Keep each section short - no more than 3 sentences

Return your response as JSON:
{
  "summary": "One sentence plain-language summary",
  "readingLevel": "grade5"
}`;
}

export function parseSimplificationResponse(response: string): { summary: string; readingLevel: string } | null {
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (typeof parsed.summary === "string" && parsed.summary.length > 0) {
      return {
        summary: parsed.summary,
        readingLevel: parsed.readingLevel || "grade5",
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function simplifyWithGemini(
  data: MedicalExtractionData,
  language: string = "en",
): Promise<SimplificationResult> {
  const prompt = buildSimplificationPrompt(data, language);
  const dialect = getDialectLabel(language);

  try {
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
    if (!geminiApiKey) {
      return buildFallbackSimplification(data, dialect);
    }

    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }],
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      return buildFallbackSimplification(data, dialect);
    }

    const result = await response.json() as any;
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const parsed = parseSimplificationResponse(text);
    if (parsed) {
      return {
        summary: parsed.summary,
        dialect,
        readingLevel: parsed.readingLevel,
        success: true,
      };
    }

    return buildFallbackSimplification(data, dialect);
  } catch {
    return buildFallbackSimplification(data, dialect);
  }
}

function buildFallbackSimplification(
  data: MedicalExtractionData,
  dialect: string,
): SimplificationResult {
  const parts: string[] = [];

  const flaggedTests = data.tests.filter((t) => t.flagged);

  if (flaggedTests.length > 0) {
    const flaggedNames = flaggedTests.map((t) => t.name).join(", ");
    parts.push(`Some of your results need attention: ${flaggedNames}. Please share these results with your doctor.`);
  }

  if (data.tests.length > 0 && flaggedTests.length === 0) {
    parts.push("Your test results appear to be within normal ranges based on the information provided.");
  }

  if (data.diagnosis.length > 0) {
    parts.push(`Diagnosis: ${data.diagnosis.join(", ")}.`);
  }

  if (data.medications.length > 0) {
    const medList = data.medications.map((m) =>
      `${m.name}${m.dosage ? ` (${m.dosage})` : ""}`
    ).join(", ");
    parts.push(`Medications: ${medList}.`);
  }

  if (parts.length === 0) {
    parts.push("Your medical document has been scanned. Please consult your healthcare provider for a full explanation.");
  }

  return {
    summary: parts.join(" "),
    dialect,
    readingLevel: "grade5",
    success: true,
  };
}

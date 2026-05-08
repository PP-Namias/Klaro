import type { AIScanAnalysis } from "@klaro/validators/scan-analysis";
import type { ExtractedTest } from "@klaro/validators/extraction";
import { callLLMAPI } from "./llm";

/**
 * Scan Analysis Service
 *
 * Orchestrates AI-powered analysis of medical scan results:
 * 1. Validates extracted test data
 * 2. Constructs context-aware system and user prompts
 * 3. Calls LLM with proper error handling
 * 4. Validates and returns structured JSON response
 * 5. Provides fallback behavior when LLM unavailable
 */

export interface ScanAnalysisInput {
  extractedTests: ExtractedTest[];
  patientAge?: number;
  patientSex?: "male" | "female" | "other";
  facilityName?: string;
}

export interface ScanAnalysisResult {
  success: boolean;
  analysis?: AIScanAnalysis;
  error?: string;
  source?: "llm" | "fallback";
  timestamp: string;
}

/**
 * Build system prompt for scan analysis
 * Instructs the AI on how to process medical test results
 */
function buildSystemPrompt(): string {
  return `You are a clinical assistant for a consumer-facing health app. Your job is to interpret lab/extracted test results and produce JSON output.

You must return ONLY valid JSON with these exact keys:
- summary: plain-language summary (≤120 words) describing main findings and tone
- urgency: one of "LOW", "MODERATE", or "HIGH" (use HIGH for acute risk)
- recommendations: array of 1–3 action items (≤20 words each), prioritized

Guidelines:
1. SUMMARY: Explain results in plain language, avoid medical jargon
2. URGENCY: Assess risk level based on flagged results and patient context
3. RECOMMENDATIONS: Include suggested specialties and action timeline

Rules:
- Be clear and reassuring when results are normal
- Be direct about risks if results are abnormal
- Suggest immediate emergency care only when critical
- Keep tone patient-friendly and supportive
- Return ONLY JSON, no extra text or commentary`;
}

/**
 * Build user prompt with test data and patient context
 */
function buildUserPrompt(input: ScanAnalysisInput): string {
  const patientContext = buildPatientContext(input);
  const testResults = formatTestResults(input.extractedTests);

  return `${
    patientContext ? `Patient Context:\n${patientContext}\n\n` : ""
  }Test Results:\n${testResults}

Please analyze these results and return ONLY the JSON response.`;
}

/**
 * Format patient context from age and sex
 */
function buildPatientContext(input: ScanAnalysisInput): string {
  const parts: string[] = [];

  if (input.patientAge !== undefined) {
    parts.push(`Age: ${input.patientAge} years old`);
  }

  if (input.patientSex) {
    const sexMap = {
      male: "Male",
      female: "Female",
      other: "Other",
    };
    parts.push(`Sex: ${sexMap[input.patientSex]}`);
  }

  if (input.facilityName) {
    parts.push(`Facility: ${input.facilityName}`);
  }

  return parts.join(", ");
}

/**
 * Format test results for LLM consumption
 */
function formatTestResults(tests: ExtractedTest[]): string {
  return tests
    .map((test) => {
      const flagStatus = test.flagged ? " [FLAGGED]" : "";
      const unit = test.unit ? ` ${test.unit}` : "";
      return `- ${test.name}: ${test.value || "N/A"}${unit}${flagStatus}`;
    })
    .join("\n");
}

/**
 * Validate analysis structure
 */
function validateAnalysis(data: unknown): data is AIScanAnalysis {
  if (!data || typeof data !== "object") return false;

  const obj = data as Record<string, unknown>;

  // Check summary
  if (typeof obj.summary !== "string" || obj.summary.length > 500) {
    return false;
  }

  // Check urgency
  if (!["LOW", "MODERATE", "HIGH"].includes(obj.urgency as string)) {
    return false;
  }

  // Check recommendations
  if (!Array.isArray(obj.recommendations)) return false;
  if (obj.recommendations.length === 0 || obj.recommendations.length > 3) {
    return false;
  }
  if (
    !obj.recommendations.every(
      (r) => typeof r === "string" && r.length <= 500,
    )
  ) {
    return false;
  }

  return true;
}

/**
 * Extract JSON from LLM response (handles extra text)
 */
function extractJSON(response: string): string {
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : response;
}

/**
 * Generate fallback analysis when LLM is unavailable
 */
function generateFallbackAnalysis(input: ScanAnalysisInput): AIScanAnalysis {
  const flaggedTests = input.extractedTests.filter((t) => t.flagged);
  const hasAbnormalResults = flaggedTests.length > 0;

  // Determine urgency from flagged tests
  let urgency: "LOW" | "MODERATE" | "HIGH";
  if (flaggedTests.length === 0) {
    urgency = "LOW";
  } else if (flaggedTests.length >= 2) {
    urgency = "HIGH";
  } else {
    urgency = "MODERATE";
  }

  // Build summary
  let summary: string;
  if (hasAbnormalResults) {
    summary = `Your test results show ${flaggedTests.length} abnormal value(s): ${flaggedTests.map((t) => t.name).join(", ")}. This requires medical review. Please contact your healthcare provider to discuss these findings and next steps.`;
  } else {
    summary =
      "Your test results appear to be within normal ranges. Continue monitoring your health and follow any recommendations from your healthcare provider.";
  }

  // Build recommendations
  const recommendations: string[] = [];
  if (urgency === "HIGH") {
    recommendations.push(
      "Schedule appointment with healthcare provider within 24-48 hours",
    );
    recommendations.push("Bring all test results and medical records");
  } else if (urgency === "MODERATE") {
    recommendations.push("Schedule follow-up appointment with your provider");
    recommendations.push("Review results and discuss any concerns");
  } else {
    recommendations.push("Continue routine health monitoring");
    recommendations.push(
      "Schedule regular check-ups per your provider's recommendations",
    );
  }

  if (recommendations.length < 3) {
    recommendations.push("Keep a copy of these results for your records");
  }

  return {
    summary: summary.slice(0, 500),
    urgency,
    recommendations: recommendations.slice(0, 3),
  };
}

/**
 * Main analysis function
 * Orchestrates the entire scan analysis process
 */
export async function analyzeScan(
  input: ScanAnalysisInput,
): Promise<ScanAnalysisResult> {
  const timestamp = new Date().toISOString();

  try {
    // Validate input
    if (!input.extractedTests || input.extractedTests.length === 0) {
      return {
        success: false,
        error: "No test results provided for analysis",
        timestamp,
      };
    }

    // Build prompts
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(input);

    // Call LLM
    let llmResponse: string;
    let source: "llm" | "fallback" = "llm";

    try {
      llmResponse = await callLLMAPI(userPrompt, systemPrompt);
    } catch (error) {
      console.warn(
        "LLM call failed, using fallback analysis:",
        error instanceof Error ? error.message : "Unknown error",
      );
      source = "fallback";
      const fallbackAnalysis = generateFallbackAnalysis(input);
      return {
        success: true,
        analysis: fallbackAnalysis,
        source,
        timestamp,
      };
    }

    // If LLM returns empty string (API not configured), use fallback
    if (!llmResponse || llmResponse.trim() === "") {
      console.info("LLM not configured, using fallback analysis");
      source = "fallback";
      const fallbackAnalysis = generateFallbackAnalysis(input);
      return {
        success: true,
        analysis: fallbackAnalysis,
        source,
        timestamp,
      };
    }

    // Extract and parse JSON
    const jsonStr = extractJSON(llmResponse);
    let analysisData: unknown;

    try {
      analysisData = JSON.parse(jsonStr);
    } catch {
      console.warn("Failed to parse LLM response, using fallback");
      source = "fallback";
      const fallbackAnalysis = generateFallbackAnalysis(input);
      return {
        success: true,
        analysis: fallbackAnalysis,
        source,
        timestamp,
      };
    }

    // Validate analysis structure
    if (!validateAnalysis(analysisData)) {
      console.warn("LLM response structure invalid, using fallback");
      source = "fallback";
      const fallbackAnalysis = generateFallbackAnalysis(input);
      return {
        success: true,
        analysis: fallbackAnalysis,
        source,
        timestamp,
      };
    }

    return {
      success: true,
      analysis: analysisData,
      source,
      timestamp,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error during analysis";
    console.error("Scan analysis error:", errorMessage);

    return {
      success: false,
      error: errorMessage,
      timestamp,
    };
  }
}

/**
 * Analyze multiple test batches (for future use)
 */
export async function analyzeScanBatch(
  inputs: ScanAnalysisInput[],
): Promise<ScanAnalysisResult[]> {
  return Promise.all(inputs.map((input) => analyzeScan(input)));
}

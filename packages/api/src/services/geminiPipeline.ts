import type {
  GeminiExtractionResult,
  MedicalExtractionData,
} from "./geminiExtraction";
import type { SimplificationResult } from "./geminiSimplification";
import type { HallucinationResult } from "./hallucinationDetection";
import { logLlmApiCall, logPhiScrubbing } from "./auditLogger";
import { extractTestsFromText } from "./extraction";
import {
  calculateExtractionConfidence,
  isLowConfidence,
  normalizeExtractionData,
} from "./geminiExtraction";
import { simplifyWithGemini } from "./geminiSimplification";
import { detectHallucinations } from "./hallucinationDetection";
import { detectPhiTypes, scrubForExternalApi } from "./phiScrubber";

export type ExtractionPath =
  | "vision"
  | "ocr_extraction"
  | "rule_based"
  | "fallback";

export interface FallbackChainResult {
  extractedData: MedicalExtractionData;
  path: ExtractionPath;
  confidence: number;
  simplification: SimplificationResult;
  processingTimeMs: number;
  warnings: string[];
  hallucinationResult?: HallucinationResult;
}

export async function executeFallbackChain(
  imageBase64: string,
  ocrText: string,
  language = "en",
): Promise<FallbackChainResult> {
  const startTime = Date.now();
  const warnings: string[] = [];

  const path1 = await tryVisionExtraction(imageBase64, language);
  if (path1.success && path1.data && !isLowConfidence(path1.confidence ?? 0)) {
    const simplification = await simplifyWithGemini(path1.data, language);
    const hallucinationResult = detectHallucinations(
      ocrText,
      {
        tests: path1.data.tests,
        diagnosis: path1.data.diagnosis,
        medications: path1.data.medications,
      },
      path1.confidence ?? 0.9,
    );

    if (hallucinationResult.requiresReview) {
      warnings.push("hallucination:review_required");
    }

    return {
      extractedData: path1.data,
      path: "vision",
      confidence: hallucinationResult.adjustedConfidence,
      simplification,
      processingTimeMs: Date.now() - startTime,
      warnings,
      hallucinationResult,
    };
  }
  if (path1.success) warnings.push("vision:low_confidence");

  const path2 = await tryOcrExtraction(ocrText, language);
  if (path2.success && path2.data && !isLowConfidence(path2.confidence ?? 0)) {
    const simplification = await simplifyWithGemini(path2.data, language);
    const hallucinationResult = detectHallucinations(
      ocrText,
      {
        tests: path2.data.tests,
        diagnosis: path2.data.diagnosis,
        medications: path2.data.medications,
      },
      path2.confidence ?? 0.85,
    );

    if (hallucinationResult.requiresReview) {
      warnings.push("hallucination:review_required");
    }

    return {
      extractedData: path2.data,
      path: "ocr_extraction",
      confidence: hallucinationResult.adjustedConfidence,
      simplification,
      processingTimeMs: Date.now() - startTime,
      warnings,
      hallucinationResult,
    };
  }
  if (path2.success) warnings.push("ocr_extraction:low_confidence");
  else warnings.push("ocr_extraction:failed");

  const path3 = extractWithRules(ocrText);
  const simplification = await simplifyWithGemini(path3, language);
  const hallucinationResult = detectHallucinations(
    ocrText,
    {
      tests: path3.tests,
      diagnosis: path3.diagnosis,
      medications: path3.medications,
    },
    0.5,
  );

  if (hallucinationResult.requiresReview) {
    warnings.push("hallucination:review_required");
  }

  warnings.push("rule_based:used");

  return {
    extractedData: path3,
    path: "rule_based",
    confidence: hallucinationResult.adjustedConfidence,
    simplification,
    processingTimeMs: Date.now() - startTime,
    warnings,
    hallucinationResult,
  };
}

async function tryVisionExtraction(
  imageBase64: string,
  _language: string,
): Promise<GeminiExtractionResult> {
  try {
    const { callGeminiVision } = await import("./geminiVision");
    const result = await callGeminiVision(imageBase64);

    if (
      result.structuredData &&
      Object.keys(result.structuredData).length > 0
    ) {
      const normalized = normalizeExtractionData(result.structuredData);
      return {
        success: true,
        data: normalized,
        confidence: result.confidence,
        model: result.model,
        rawResponse: result.text,
      };
    }

    return { success: false, error: "No structured data from vision" };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Vision extraction failed",
    };
  }
}

async function tryOcrExtraction(
  ocrText: string,
  language: string,
): Promise<GeminiExtractionResult> {
  if (!ocrText || ocrText.trim().length < 20) {
    return { success: false, error: "OCR text too short for extraction" };
  }

  // PHI Scrubbing: Redact patient identifiers before sending to external LLM API
  const scrubResult = scrubForExternalApi(ocrText);
  const phiTypes = detectPhiTypes(ocrText);

  if (scrubResult.matchCount > 0) {
    console.log(
      JSON.stringify({
        type: "phi_scrubbed",
        context: "ocr_extraction",
        phiCount: scrubResult.matchCount,
        phiTypes,
        timestamp: new Date().toISOString(),
      }),
    );

    // Audit log for PHI scrubbing
    logPhiScrubbing({
      originalPhiCount: scrubResult.matchCount,
      scrubbedPhiCount: scrubResult.matchCount,
      phiTypes,
    }).catch(() => {});
  }

  try {
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
    if (!geminiApiKey) {
      return { success: false, error: "No Gemini API key" };
    }

    const { buildExtractionPrompt, parseGeminiResponse } = await import(
      "./geminiExtraction"
    );
    // Use scrubbed text for the extraction prompt sent to external API
    const prompt = buildExtractionPrompt(scrubResult.scrubbedText, language);
    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        // Key travels as a header: a query string would be captured by proxy
        // and access logs.
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey,
        },
        signal: AbortSignal.timeout(30_000),
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
        }),
      },
    );

    if (!response.ok) {
      // Audit log for failed API call
      logLlmApiCall({
        phiScrubbed: true,
        phiCount: scrubResult.matchCount,
        externalProvider: "gemini",
        success: false,
      }).catch(() => {});

      return { success: false, error: `Gemini API error: ${response.status}` };
    }

    const result = await response.json();
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!text) {
      return { success: false, error: "Empty Gemini response" };
    }

    const parsed = parseGeminiResponse(text);
    if (!parsed) {
      return { success: false, error: "Failed to parse Gemini JSON response" };
    }

    const normalized = normalizeExtractionData(parsed);
    const confidence = calculateExtractionConfidence(normalized);

    // Audit log for successful API call
    logLlmApiCall({
      phiScrubbed: true,
      phiCount: scrubResult.matchCount,
      externalProvider: "gemini",
      success: true,
    }).catch(() => {});

    return {
      success: true,
      data: normalized,
      confidence,
      model,
      rawResponse: text,
    };
  } catch (error) {
    // Audit log for failed API call
    logLlmApiCall({
      phiScrubbed: true,
      phiCount: scrubResult.matchCount,
      externalProvider: "gemini",
      success: false,
    }).catch(() => {});

    return {
      success: false,
      error: error instanceof Error ? error.message : "OCR extraction failed",
    };
  }
}

function extractWithRules(ocrText: string): MedicalExtractionData {
  const tests = extractTestsFromText(ocrText);

  return {
    tests: tests.map((t) => ({
      name: t.name,
      value: t.value,
      unit: t.unit,
      referenceRange: t.referenceRange,
      flagged: t.flagged === true,
    })),
    diagnosis: [],
    medications: [],
  };
}

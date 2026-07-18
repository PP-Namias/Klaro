import type { MedicalExtractionData, GeminiExtractionResult, ExtractedTest } from "./geminiExtraction";
import { calculateExtractionConfidence, normalizeExtractionData, isLowConfidence } from "./geminiExtraction";
import type { SimplificationResult } from "./geminiSimplification";
import { simplifyWithGemini, buildSimplificationPrompt } from "./geminiSimplification";
import { extractTestsFromText } from "./extraction";

export type ExtractionPath = "vision" | "ocr_extraction" | "rule_based" | "fallback";

export interface FallbackChainResult {
  extractedData: MedicalExtractionData;
  path: ExtractionPath;
  confidence: number;
  simplification: SimplificationResult;
  processingTimeMs: number;
  warnings: string[];
}

export async function executeFallbackChain(
  imageBase64: string,
  ocrText: string,
  language: string = "en",
): Promise<FallbackChainResult> {
  const startTime = Date.now();
  const warnings: string[] = [];

  const path1 = await tryVisionExtraction(imageBase64, language);
  if (path1.success && path1.data && !isLowConfidence(path1.confidence ?? 0)) {
    const simplification = await simplifyWithGemini(path1.data, language);
    return {
      extractedData: path1.data,
      path: "vision",
      confidence: path1.confidence ?? 0.9,
      simplification,
      processingTimeMs: Date.now() - startTime,
      warnings,
    };
  }
  if (path1.success) warnings.push("vision:low_confidence");

  const path2 = await tryOcrExtraction(ocrText, language);
  if (path2.success && path2.data && !isLowConfidence(path2.confidence ?? 0)) {
    const simplification = await simplifyWithGemini(path2.data, language);
    return {
      extractedData: path2.data,
      path: "ocr_extraction",
      confidence: path2.confidence ?? 0.85,
      simplification,
      processingTimeMs: Date.now() - startTime,
      warnings,
    };
  }
  if (path2.success) warnings.push("ocr_extraction:low_confidence");
  else warnings.push("ocr_extraction:failed");

  const path3 = extractWithRules(ocrText);
  const simplification = await simplifyWithGemini(path3, language);

  warnings.push("rule_based:used");

  return {
    extractedData: path3,
    path: "rule_based",
    confidence: 0.5,
    simplification,
    processingTimeMs: Date.now() - startTime,
    warnings,
  };
}

async function tryVisionExtraction(
  imageBase64: string,
  language: string,
): Promise<GeminiExtractionResult> {
  try {
    const { callGeminiVision } = await import("./geminiVision");
    const result = await callGeminiVision(imageBase64);

    if (result.structuredData && Object.keys(result.structuredData).length > 0) {
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
      error: error instanceof Error ? error.message : "Vision extraction failed",
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

  try {
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
    if (!geminiApiKey) {
      return { success: false, error: "No Gemini API key" };
    }

    const { buildExtractionPrompt, parseGeminiResponse } = await import("./geminiExtraction");
    const prompt = buildExtractionPrompt(ocrText, language);
    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(30_000),
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
        }),
      },
    );

    if (!response.ok) {
      return { success: false, error: `Gemini API error: ${response.status}` };
    }

    const result = await response.json() as any;
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

    return {
      success: true,
      data: normalized,
      confidence,
      model,
      rawResponse: text,
    };
  } catch (error) {
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

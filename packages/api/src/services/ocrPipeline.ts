import { getPipelineConfig } from "../config/pipeline";

export interface OcrPageResult {
  pageNumber: number;
  text: string;
  confidence: number;
  source: "local" | "cloud";
  warnings: string[];
}

export interface OcrPipelineResult {
  success: boolean;
  accepted: boolean;
  text: string;
  confidence: number;
  pages: OcrPageResult[];
  source: "local" | "cloud";
  warnings: string[];
  rejectionReason?: string;
  rejectionAdvice?: string;
  processingTimeMs: number;
}

export async function runOcrOnImage(
  imageBase64: string,
  pageNumber = 1,
): Promise<OcrPageResult> {
  const { performOcr } = await import("./ocr");
  const warnings: string[] = [];
  const buffer = Buffer.from(imageBase64, "base64");

  try {
    const result = await performOcr(buffer);
    return {
      pageNumber,
      text: result.text,
      confidence: result.confidence,
      source: result.source,
      warnings,
    };
  } catch (error) {
    warnings.push(
      `Page ${pageNumber} OCR failed: ${error instanceof Error ? error.message : "unknown error"}`,
    );
    return {
      pageNumber,
      text: "",
      confidence: 0,
      source: "local",
      warnings,
    };
  }
}

function computeWeightedConfidence(pages: OcrPageResult[]): number {
  const totalLength = pages.reduce((sum, p) => sum + p.text.length, 0);
  if (totalLength === 0) {
    return pages.reduce((sum, p) => sum + p.confidence, 0) / pages.length;
  }
  const weighted = pages.reduce((sum, p) => {
    return sum + p.confidence * (p.text.length / totalLength);
  }, 0);
  return Math.round(weighted * 100) / 100;
}

export async function runOcr(imageBase64: string): Promise<OcrPipelineResult> {
  const startTime = Date.now();
  const page = await runOcrOnImage(imageBase64);
  const confidence = computeWeightedConfidence([page]);

  return {
    success: page.text.length > 0,
    accepted: false,
    text: page.text,
    confidence,
    pages: [page],
    source: page.source,
    warnings: page.warnings,
    processingTimeMs: Date.now() - startTime,
  };
}

export async function runOcrWithRetry(
  imageBase64: string,
): Promise<OcrPipelineResult> {
  const startTime = Date.now();
  const config = getPipelineConfig();
  const { ocr } = config;
  const warnings: string[] = [];

  const firstPass = await runOcrOnImage(imageBase64);
  let bestResult = firstPass;

  if (firstPass.confidence >= ocr.confidenceThreshold) {
    const confidence = computeWeightedConfidence([bestResult]);
    return {
      success: true,
      accepted: true,
      text: bestResult.text,
      confidence,
      pages: [bestResult],
      source: bestResult.source,
      warnings,
      processingTimeMs: Date.now() - startTime,
    };
  }

  for (let attempt = 1; attempt <= ocr.maxRetries; attempt++) {
    warnings.push(
      `Retry ${attempt}/${ocr.maxRetries}: confidence ${bestResult.confidence.toFixed(2)} below threshold ${ocr.confidenceThreshold}`,
    );

    try {
      const { preprocessImage, getDefaultPreprocessingOptions } = await import(
        "./imagePreprocessor"
      );
      const preprocessed = await preprocessImage(imageBase64, {
        ...getDefaultPreprocessingOptions(),
        binarize: attempt >= 2,
        contrast: 1.2 + attempt * 0.2,
      });

      const retryResult = await runOcrOnImage(preprocessed.base64);

      if (retryResult.confidence > bestResult.confidence) {
        bestResult = retryResult;
      }

      if (retryResult.confidence >= ocr.confidenceThreshold) {
        const confidence = computeWeightedConfidence([bestResult]);
        return {
          success: true,
          accepted: true,
          text: bestResult.text,
          confidence,
          pages: [bestResult],
          source: bestResult.source,
          warnings,
          processingTimeMs: Date.now() - startTime,
        };
      }
    } catch (error) {
      warnings.push(
        `Retry ${attempt} failed: ${error instanceof Error ? error.message : "unknown"}`,
      );
    }
  }

  const confidence = computeWeightedConfidence([bestResult]);
  return {
    success: bestResult.text.length > 0,
    accepted: false,
    text: bestResult.text,
    confidence,
    pages: [bestResult],
    source: bestResult.source,
    warnings,
    rejectionReason: "low_confidence",
    rejectionAdvice:
      "The document appears too blurry or unclear. Please take a photo in good lighting with the document flat on a table. Ensure all text is readable before capturing.",
    processingTimeMs: Date.now() - startTime,
  };
}

export function buildRejectionResponse(
  result: OcrPipelineResult,
  language = "English",
) {
  const validLanguages = ["English", "Filipino", "Bisaya", "Ilocano"] as const;
  const lang = validLanguages.includes(
    language as (typeof validLanguages)[number],
  )
    ? (language as (typeof validLanguages)[number])
    : "English";

  return {
    requestId: `rejected-${Date.now()}`,
    status: "error" as const,
    source: "fallback" as const,
    language: lang,
    confidence: result.confidence,
    extractedData: {},
    warnings: result.warnings,
    error:
      result.rejectionAdvice ||
      "Document could not be processed. Please try again with a clearer image.",
    timestamp: new Date().toISOString(),
  };
}

import { getPipelineConfig, validatePipelineConfig } from "../config/pipeline";

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

export async function runOcrWithRetry(
  imageBase64: string,
): Promise<OcrPipelineResult> {
  const startTime = Date.now();
  const config = getPipelineConfig();
  const { ocr } = config;
  // Surface misconfiguration instead of silently degrading.
  const warnings: string[] = [...validatePipelineConfig()];

  // Preprocess the first pass too. Previously only retries were preprocessed,
  // so the cheapest win (grayscale + denoise) never applied to the first read.
  let firstPassInput = imageBase64;
  if (ocr.enablePreprocessing) {
    try {
      const { preprocessImage, getDefaultPreprocessingOptions } = await import(
        "./imagePreprocessor"
      );
      const preprocessed = await preprocessImage(
        imageBase64,
        getDefaultPreprocessingOptions(),
      );
      firstPassInput = preprocessed.base64;
    } catch (error) {
      warnings.push(
        `First-pass preprocessing failed: ${error instanceof Error ? error.message : "unknown"}`,
      );
    }
  }

  const firstPass = await runOcrOnImage(firstPassInput);
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
      let preprocessedBase64 = imageBase64;

      if (ocr.enablePreprocessing) {
        try {
          const { preprocessWithSharp, getSharpDefaultOptions } = await import(
            "./sharpPreprocessor"
          );
          const sharpOpts = {
            ...getSharpDefaultOptions(),
            binarize: attempt >= 2,
            contrast: 1.2 + attempt * 0.2,
          };
          const sharpResult = await preprocessWithSharp(
            imageBase64,
            sharpOpts,
          );
          if (!sharpResult.applied.includes("sharp-not-available")) {
            preprocessedBase64 = sharpResult.base64;
            warnings.push(
              `sharp preprocessing: ${sharpResult.applied.join(",")} boost+${Math.round(sharpResult.confidenceBoost * 100)}%`,
            );
          } else {
            const { preprocessImage, getDefaultPreprocessingOptions } =
              await import("./imagePreprocessor");
            const fallback = await preprocessImage(imageBase64, {
              ...getDefaultPreprocessingOptions(),
              binarize: attempt >= 2,
              contrast: 1.2 + attempt * 0.2,
            });
            preprocessedBase64 = fallback.base64;
            warnings.push(`canvas fallback: ${fallback.applied.join(",")}`);
          }
        } catch {
          const { preprocessImage, getDefaultPreprocessingOptions } =
            await import("./imagePreprocessor");
          const fallback = await preprocessImage(imageBase64, {
            ...getDefaultPreprocessingOptions(),
            binarize: attempt >= 2,
            contrast: 1.2 + attempt * 0.2,
          });
          preprocessedBase64 = fallback.base64;
        }
      }

      const retryResult = await runOcrOnImage(preprocessedBase64);

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

  // Local OCR never reached the threshold. Escalate to Google Cloud Vision when
  // it is enabled and configured; a Vision outage degrades to the local
  // rejection below rather than failing the request.
  if (ocr.enableCloudFallback) {
    try {
      const { cloudOcrWithRetry, getCloudOcrApiKey } = await import(
        "./cloudOcr"
      );

      if (getCloudOcrApiKey()) {
        warnings.push(
          `Local confidence ${bestResult.confidence.toFixed(2)} below threshold ${ocr.confidenceThreshold}; escalating to cloud OCR`,
        );

        const cloud = await cloudOcrWithRetry(imageBase64);
        const cloudPage: OcrPageResult = {
          pageNumber: 1,
          text: cloud.text,
          confidence: cloud.confidence,
          source: "cloud",
          warnings: [],
        };

        if (cloud.confidence >= ocr.confidenceThreshold) {
          return {
            success: true,
            accepted: true,
            text: cloudPage.text,
            confidence: computeWeightedConfidence([cloudPage]),
            pages: [cloudPage],
            source: "cloud",
            warnings,
            processingTimeMs: Date.now() - startTime,
          };
        }

        warnings.push(
          `Cloud OCR confidence ${cloud.confidence.toFixed(2)} also below threshold`,
        );

        if (cloud.confidence > bestResult.confidence) {
          bestResult = cloudPage;
        }
      } else {
        warnings.push("Cloud OCR fallback enabled but no API key configured");
      }
    } catch (error) {
      warnings.push(
        `Cloud OCR fallback failed: ${error instanceof Error ? error.message : "unknown"}`,
      );
    }
  }

  const confidence = computeWeightedConfidence([bestResult]);
  const accepted = confidence >= ocr.confidenceThreshold && bestResult.text.length > 0;
  if (accepted) {
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
      "The document appears too blurry or unclear. Please take a photo in good lighting with the document flat on a table. Ensure all text is readable before capturing. If the document is handwritten, ensure good lighting.",
    processingTimeMs: Date.now() - startTime,
  };
}

/**
 * OCR every rasterized page of a document and combine them into one result.
 *
 * Each page runs through the full retry/preprocess/cloud-fallback pipeline. The
 * document is accepted when at least one page was accepted, so a single blurry
 * page does not discard an otherwise readable report.
 */
export async function runOcrOnPages(
  pages: { pageNumber: number; base64: string }[],
): Promise<OcrPipelineResult> {
  const startTime = Date.now();

  if (pages.length === 0) {
    return {
      success: false,
      accepted: false,
      text: "",
      confidence: 0,
      pages: [],
      source: "local",
      warnings: ["No pages to process"],
      rejectionReason: "empty_document",
      rejectionAdvice:
        "The document contained no readable pages. Please upload a different file.",
      processingTimeMs: Date.now() - startTime,
    };
  }

  const results: OcrPipelineResult[] = [];
  for (const page of pages) {
    results.push(await runOcrWithRetry(page.base64));
  }

  const pageResults: OcrPageResult[] = results.map((result, index) => ({
    pageNumber: pages[index]?.pageNumber ?? index + 1,
    text: result.text,
    confidence: result.confidence,
    source: result.source,
    warnings: result.warnings,
  }));

  const accepted = results.some((result) => result.accepted);
  const warnings = results.flatMap((result, index) =>
    result.warnings.map((w) => `Page ${pageResults[index]?.pageNumber}: ${w}`),
  );

  const rejected = results.find((result) => !result.accepted);

  return {
    success: pageResults.some((page) => page.text.length > 0),
    accepted,
    text: pageResults
      .map((page) => page.text)
      .filter((text) => text.length > 0)
      .join("\n\n"),
    confidence: computeWeightedConfidence(pageResults),
    pages: pageResults,
    source: pageResults[0]?.source ?? "local",
    warnings,
    ...(accepted
      ? {}
      : {
          rejectionReason: rejected?.rejectionReason ?? "low_confidence",
          rejectionAdvice: rejected?.rejectionAdvice,
        }),
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

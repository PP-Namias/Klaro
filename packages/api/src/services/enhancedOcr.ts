import type { OcrResult, OcrOptions } from "./ocr";

export interface ImagePreprocessOptions {
  grayscale?: boolean;
  contrast?: number;
  brightness?: number;
  denoise?: boolean;
  deskew?: boolean;
  binarize?: boolean;
  binarizeThreshold?: number;
}

export interface EnhancedOcrOptions extends OcrOptions {
  preprocess?: ImagePreprocessOptions;
  retryCount?: number;
  retryDelay?: number;
}

export function getPreprocessDefaults(): ImagePreprocessOptions {
  return {
    grayscale: true,
    contrast: 1.2,
    brightness: 1.0,
    denoise: true,
    deskew: false,
    binarize: true,
    binarizeThreshold: 128,
  };
}

export function validatePreprocessOptions(
  options: ImagePreprocessOptions,
): string[] {
  const errors: string[] = [];

  if (options.contrast !== undefined && (options.contrast < 0.1 || options.contrast > 5.0)) {
    errors.push("contrast must be between 0.1 and 5.0");
  }

  if (options.brightness !== undefined && (options.brightness < 0.1 || options.brightness > 5.0)) {
    errors.push("brightness must be between 0.1 and 5.0");
  }

  if (options.binarizeThreshold !== undefined && (options.binarizeThreshold < 0 || options.binarizeThreshold > 255)) {
    errors.push("binarizeThreshold must be between 0 and 255");
  }

  return errors;
}

export function mergePreprocessOptions(
  base: ImagePreprocessOptions,
  override: ImagePreprocessOptions,
): ImagePreprocessOptions {
  return { ...base, ...override };
}

export function estimateProcessingTime(
  fileSizeBytes: number,
  preprocess: ImagePreprocessOptions,
): number {
  const baseTimeMs = 2000;
  const sizeFactor = fileSizeBytes / (1024 * 1024);
  let factor = baseTimeMs * (1 + sizeFactor);

  if (preprocess.denoise) factor *= 1.3;
  if (preprocess.deskew) factor *= 1.2;
  if (preprocess.binarize) factor *= 1.1;

  return Math.round(factor);
}

export function shouldPreprocess(
  options: ImagePreprocessOptions,
): boolean {
  return (
    options.grayscale === true ||
    (options.contrast !== undefined && options.contrast !== 1.0) ||
    (options.brightness !== undefined && options.brightness !== 1.0) ||
    options.denoise === true ||
    options.deskew === true ||
    options.binarize === true
  );
}

export function buildPreprocessDescription(
  options: ImagePreprocessOptions,
): string {
  const steps: string[] = [];

  if (options.grayscale) steps.push("grayscale conversion");
  if (options.contrast !== undefined && options.contrast !== 1.0) {
    steps.push(`contrast adjustment (${options.contrast}x)`);
  }
  if (options.brightness !== undefined && options.brightness !== 1.0) {
    steps.push(`brightness adjustment (${options.brightness}x)`);
  }
  if (options.denoise) steps.push("noise reduction");
  if (options.deskew) steps.push("deskew correction");
  if (options.binarize) steps.push("binarization");

  return steps.length > 0 ? steps.join(", ") : "no preprocessing";
}

export function calculateOcrConfidence(
  results: Array<{ confidence: number }>,
): number {
  if (results.length === 0) return 0;
  const total = results.reduce((sum, r) => sum + r.confidence, 0);
  return total / results.length;
}

export function formatOcrOutput(
  text: string,
  confidence: number,
  language: string,
): string {
  return `[${language}] (confidence: ${(confidence * 100).toFixed(1)}%)\n${text}`;
}

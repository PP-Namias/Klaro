import sharp from "sharp";

export interface OcrBlock {
  text: string;
  confidence: number;
  bbox?: { x0: number; y0: number; x1: number; y1: number };
}

export interface OcrResult {
  text: string;
  confidence: number;
  blocks: OcrBlock[];
  source: "ocr" | "embedded";
  warning?: string;
}

export interface OcrOptions {
  enabled?: boolean;
  confidenceThreshold?: number;
}

export function getOcrOptions(): Required<OcrOptions> {
  return {
    enabled: process.env.OCR_ENABLED !== "false",
    confidenceThreshold: parseFloat(
      process.env.OCR_CONFIDENCE_THRESHOLD ?? "0.7",
    ),
  };
}

export function shouldRunOcr(extractedText: string): boolean {
  const opts = getOcrOptions();
  if (!opts.enabled) return false;
  const textLength = extractedText.replace(/\s+/g, "").length;
  return textLength < 100;
}

async function preprocessImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer).grayscale().normalise().sharpen().toBuffer();
}

export async function runOcr(imageBuffer: Buffer): Promise<OcrResult> {
  const preprocessed = await preprocessImage(imageBuffer);

  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");

  let data;
  try {
    ({ data } = await worker.recognize(preprocessed));
  } finally {
    // Terminate on every path; a throw from recognize() used to leak the
    // worker and its child process for the lifetime of the service.
    await worker.terminate();
  }

  const blocks: OcrBlock[] = (data.blocks ?? []).map((block) => ({
    text: block.text,
    confidence: block.confidence / 100,
    bbox: block.bbox
      ? {
          x0: block.bbox.x0,
          y0: block.bbox.y0,
          x1: block.bbox.x1,
          y1: block.bbox.y1,
        }
      : undefined,
  }));

  const overallConfidence = data.confidence / 100;

  const result: OcrResult = {
    text: data.text,
    confidence: overallConfidence,
    blocks,
    source: "ocr",
  };

  if (overallConfidence < getOcrOptions().confidenceThreshold) {
    result.warning = `OCR confidence ${(overallConfidence * 100).toFixed(0)}% is below threshold`;
  }

  return result;
}

export async function processDocument(
  buffer: Buffer,
  embeddedText?: string,
): Promise<OcrResult> {
  if (embeddedText && !shouldRunOcr(embeddedText)) {
    return {
      text: embeddedText,
      confidence: 1,
      blocks: [],
      source: "embedded",
    };
  }

  const result = await runOcr(buffer);
  return result;
}

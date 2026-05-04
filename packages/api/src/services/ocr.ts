export type OcrSource = "local" | "cloud";

export type OcrBlock = {
  text: string;
  confidence?: number;
};

export type OcrResult = {
  text: string;
  confidence: number;
  blocks: OcrBlock[];
  source: OcrSource;
};

const defaultBlockConfidence = 0.7;

const clampConfidence = (value: number) =>
  Math.min(1, Math.max(0, value));

export const computeConfidence = (blocks: OcrBlock[]) => {
  if (blocks.length === 0) {
    return 0;
  }

  const total = blocks.reduce((sum, block) => {
    const score =
      typeof block.confidence === "number"
        ? clampConfidence(block.confidence)
        : defaultBlockConfidence;
    return sum + score;
  }, 0);

  return clampConfidence(total / blocks.length);
};

export const buildOcrResult = (input: {
  text: string;
  blocks?: OcrBlock[];
  source?: OcrSource;
}) => {
  const blocks = input.blocks ?? [];
  return {
    text: input.text.trim(),
    blocks,
    confidence: computeConfidence(blocks),
    source: input.source ?? "local",
  } satisfies OcrResult;
};

export const shouldUseCloudFallback = (confidence: number, threshold = 0.7) =>
  clampConfidence(confidence) < threshold;

export const performOcr = async (imageUrlOrBuffer: string | Buffer): Promise<OcrResult> => {
  // We use require to avoid TS missing declaration errors if tesseract.js types are missing
  const Tesseract = require("tesseract.js");
  
  const worker = await Tesseract.createWorker("eng+tgl");
  
  const { data } = await worker.recognize(imageUrlOrBuffer);
  await worker.terminate();

  const blocks: OcrBlock[] = data.lines.map((line: any) => ({
    text: line.text,
    // Tesseract confidence is 0-100, we want 0-1
    confidence: line.confidence / 100,
  }));

  return buildOcrResult({
    text: data.text,
    blocks,
    source: "local",
  });
};

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

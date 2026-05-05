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

export type OcrAudit = {
  threshold: number;
  usedCloudFallback: boolean;
  local?: OcrResult;
  cloud?: OcrResult;
  selected: OcrResult;
  source: OcrSource;
  confidenceDelta: number;
};

export type OcrFallbackOptions = {
  threshold?: number;
  localOcr?: (input: string | Buffer) => Promise<OcrResult | null>;
  cloudOcr?: (input: string | Buffer) => Promise<OcrResult | null>;
};

const defaultBlockConfidence = 0.7;
const defaultOcrConfidenceThreshold = 0.7;

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
  confidence?: number;
}) => {
  const blocks = input.blocks ?? [];
  const confidence =
    typeof input.confidence === "number"
      ? clampConfidence(input.confidence)
      : computeConfidence(blocks);

  return {
    text: input.text.trim(),
    blocks,
    confidence,
    source: input.source ?? "local",
  } satisfies OcrResult;
};

export const shouldUseCloudFallback = (confidence: number, threshold = 0.7) =>
  clampConfidence(confidence) < threshold;

export const getOcrConfidenceThreshold = () => {
  const rawThreshold = process.env.OCR_CONFIDENCE_THRESHOLD;

  if (!rawThreshold) {
    return defaultOcrConfidenceThreshold;
  }

  const parsedThreshold = Number(rawThreshold);

  if (!Number.isFinite(parsedThreshold)) {
    return defaultOcrConfidenceThreshold;
  }

  return clampConfidence(parsedThreshold);
};

export const buildOcrAudit = (input: {
  local?: OcrResult;
  cloud?: OcrResult;
  selected: OcrResult;
  threshold: number;
  usedCloudFallback: boolean;
}): OcrAudit => ({
  threshold: clampConfidence(input.threshold),
  usedCloudFallback: input.usedCloudFallback,
  local: input.local,
  cloud: input.cloud,
  selected: input.selected,
  source: input.selected.source,
  confidenceDelta:
    input.local && input.cloud
      ? Number((input.cloud.confidence - input.local.confidence).toFixed(2))
      : 0,
});

export const performOcr = async (imageUrlOrBuffer: string | Buffer): Promise<OcrResult> => {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");

  try {
    const { data } = (await worker.recognize(imageUrlOrBuffer)) as {
      data: {
        text: string;
        lines?: Array<{
          text?: string;
          confidence?: number;
        }>;
      };
    };

    const blocks: OcrBlock[] = (data.lines ?? [])
      .map((line) => ({
        text: line.text?.trim() ?? "",
        confidence:
          typeof line.confidence === "number"
            ? line.confidence / 100
            : undefined,
      }))
      .filter((block) => block.text.length > 0);

    return buildOcrResult({
      text: data.text,
      blocks,
      source: "local",
    });
  } finally {
    await worker.terminate();
  }
};

export const performOcrWithFallback = async (
  imageUrlOrBuffer: string | Buffer,
  options: OcrFallbackOptions = {},
): Promise<{
  result: OcrResult;
  audit: OcrAudit;
}> => {
  const threshold = options.threshold ?? getOcrConfidenceThreshold();
  const localOcr = options.localOcr ?? performOcr;
  const cloudOcr = options.cloudOcr;

  let localResult: OcrResult | null = null;

  try {
    localResult = await localOcr(imageUrlOrBuffer);
  } catch {
    localResult = null;
  }

  if (!localResult) {
    const cloudOnlyResult = cloudOcr ? await cloudOcr(imageUrlOrBuffer) : null;

    if (!cloudOnlyResult) {
      throw new Error("OCR failed for both local and cloud providers");
    }

    const audit = buildOcrAudit({
      cloud: cloudOnlyResult,
      selected: cloudOnlyResult,
      threshold,
      usedCloudFallback: true,
    });

    return { result: cloudOnlyResult, audit };
  }

  if (!shouldUseCloudFallback(localResult.confidence, threshold) || !cloudOcr) {
    const audit = buildOcrAudit({
      local: localResult,
      selected: localResult,
      threshold,
      usedCloudFallback: false,
    });

    return { result: localResult, audit };
  }

  const cloudResult = await cloudOcr(imageUrlOrBuffer);

  if (!cloudResult) {
    const audit = buildOcrAudit({
      local: localResult,
      selected: localResult,
      threshold,
      usedCloudFallback: false,
    });

    return { result: localResult, audit };
  }

  const audit = buildOcrAudit({
    local: localResult,
    cloud: cloudResult,
    selected: cloudResult,
    threshold,
    usedCloudFallback: true,
  });

  return { result: cloudResult, audit };
};

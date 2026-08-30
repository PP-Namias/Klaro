export type OcrSource = "local" | "cloud";

export interface OcrBlock {
  text: string;
  confidence?: number;
}

export interface OcrResult {
  text: string;
  confidence: number;
  blocks: OcrBlock[];
  source: OcrSource;
}

export interface OcrAudit {
  threshold: number;
  usedCloudFallback: boolean;
  local?: OcrResult;
  cloud?: OcrResult;
  selected: OcrResult;
  source: OcrSource;
  confidenceDelta: number;
}

export interface OcrFallbackOptions {
  threshold?: number;
  localOcr?: (input: string | Buffer) => Promise<OcrResult | null>;
  cloudOcr?: (input: string | Buffer) => Promise<OcrResult | null>;
}

const defaultBlockConfidence = 0.7;
const defaultOcrConfidenceThreshold = 0.7;

const clampConfidence = (value: number) => Math.min(1, Math.max(0, value));

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

/**
 * Base URL of the OCR service. Tesseract is run out-of-process by the
 * scan backend rather than in the Next.js server: tesseract.js forks a
 * worker by resolving a path from its own module location, and the
 * standalone build rewrites that to a /ROOT/ placeholder that does not
 * exist, so the request hangs forever instead of failing.
 */
const getOcrServiceUrl = () =>
  process.env.OCR_SERVICE_URL ??
  process.env.GEMINI_SCAN_API_URL ??
  "http://localhost:3001";

const OCR_TIMEOUT_MS = 120_000;

export const performOcr = async (
  imageUrlOrBuffer: string | Buffer,
): Promise<OcrResult> => {
  const imageBase64 = Buffer.isBuffer(imageUrlOrBuffer)
    ? imageUrlOrBuffer.toString("base64")
    : imageUrlOrBuffer;

  const response = await fetch(`${getOcrServiceUrl()}/api/ocr`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(OCR_TIMEOUT_MS),
    body: JSON.stringify({ imageBase64 }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `OCR service responded ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`,
    );
  }

  const payload = (await response.json()) as {
    text?: string;
    confidence?: number;
    blocks?: { text?: string; confidence?: number }[];
  };

  const blocks: OcrBlock[] = (payload.blocks ?? [])
    .map((block) => ({
      text: block.text?.trim() ?? "",
      confidence:
        typeof block.confidence === "number" ? block.confidence : undefined,
    }))
    .filter((block) => block.text.length > 0);

  return buildOcrResult({
    text: payload.text ?? "",
    blocks,
    confidence: payload.confidence,
    source: "local",
  });
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

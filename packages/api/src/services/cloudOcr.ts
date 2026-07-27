export interface CloudOcrOptions {
  apiKey?: string;
  maxRetries?: number;
  timeout?: number;
}

export interface CloudOcrResult {
  text: string;
  confidence: number;
  blocks: { text: string; confidence: number }[];
  language?: string;
}

export interface CloudOcrError {
  code: string;
  message: string;
  retryable: boolean;
}

export function getCloudOcrApiKey(): string | null {
  return process.env.GOOGLE_VISION_API_KEY || null;
}

export function buildVisionApiUrl(apiKey: string): string {
  return `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
}

export function buildVisionRequest(
  imageBase64: string,
  _mimeType = "image/png",
): object {
  return {
    requests: [
      {
        image: {
          content: imageBase64,
        },
        features: [
          {
            type: "TEXT_DETECTION",
            maxResults: 1,
          },
        ],
        imageContext: {
          languageHints: ["en", "fil"],
        },
      },
    ],
  };
}

export function parseVisionResponse(response: any): CloudOcrResult {
  const annotation = response?.responses?.[0]?.fullTextAnnotation;

  if (!annotation) {
    return {
      text: "",
      confidence: 0,
      blocks: [],
    };
  }

  const blocks: { text: string; confidence: number }[] = [];

  if (annotation.pages) {
    for (const page of annotation.pages) {
      if (page.blocks) {
        for (const block of page.blocks) {
          const blockText =
            block.paragraphs
              ?.map((p: any) =>
                p.words
                  ?.map((w: any) => w.symbols?.map((s: any) => s.text).join(""))
                  .join(" "),
              )
              .join(" ") || "";

          const confidence = block.confidence || 0;

          if (blockText.trim()) {
            blocks.push({ text: blockText.trim(), confidence });
          }
        }
      }
    }
  }

  return {
    text: annotation.text || "",
    confidence: annotation.confidence || 0,
    blocks,
  };
}

export function isRetryableError(error: any): boolean {
  if (error?.code === 429) return true;
  if (error?.code === 500) return true;
  if (error?.code === 503) return true;
  if (error?.message?.includes("timeout")) return true;
  if (error?.message?.includes("ECONNRESET")) return true;
  return false;
}

export function calculateRetryDelay(attempt: number, baseDelay = 1000): number {
  const maxDelay = 30000;
  const delay = baseDelay * Math.pow(2, attempt);
  return Math.min(delay, maxDelay);
}

export async function callGoogleVision(
  imageBase64: string,
  options: CloudOcrOptions = {},
): Promise<CloudOcrResult> {
  const apiKey = options.apiKey || getCloudOcrApiKey();
  if (!apiKey) {
    throw new Error("Google Vision API key not configured");
  }

  const maxRetries = options.maxRetries ?? 3;
  const timeout = options.timeout ?? 30000;

  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(buildVisionApiUrl(apiKey), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildVisionRequest(imageBase64)),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw Object.assign(
          new Error(errorBody?.error?.message || "Unknown error"),
          {
            code: response.status,
            retryable: response.status === 429 || response.status >= 500,
          },
        );
      }

      const data = await response.json();
      return parseVisionResponse(data);
    } catch (error: any) {
      lastError = error;

      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error;
      }

      const delay = calculateRetryDelay(attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export async function cloudOcrWithRetry(
  imageBase64: string,
  options: CloudOcrOptions = {},
): Promise<CloudOcrResult> {
  return callGoogleVision(imageBase64, options);
}

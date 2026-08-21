export interface GeminiVisionOptions {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  timeout?: number;
  maxRetries?: number;
}

export interface GeminiVisionResult {
  text: string;
  structuredData?: Record<string, unknown>;
  confidence: number;
  model: string;
  usage?: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
}

export function getGeminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY || null;
}

export function buildGeminiApiUrl(apiKey: string, model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
}

export function buildGeminiVisionPrompt(documentType?: string): string {
  const typeInstruction = documentType ? `This is a ${documentType}. ` : "";

  return `${typeInstruction}Extract all medical data from this image and return as JSON with these fields:
- patientName: string
- dateOfBirth: string (YYYY-MM-DD)
- gender: string
- address: string
- phoneNumber: string
- email: string
- emergencyContact: { name: string, relationship: string, phone: string }
- insuranceProvider: string
- policyNumber: string
- diagnosis: string[]
- medications: { name: string, dosage: string, frequency: string }[]
- allergies: string[]
- labResults: { testName: string, value: string, unit: string, referenceRange: string }[]
- vitalSigns: { type: string, value: string, unit: string }[]
- medicalHistory: string[]
- notes: string

If a field is not found, use null. Return ONLY valid JSON, no other text.`;
}

export function buildGeminiVisionRequest(
  imageBase64: string,
  prompt: string,
  options: GeminiVisionOptions = {},
): object {
  return {
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: imageBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: options.temperature ?? 0.1,
      maxOutputTokens: options.maxOutputTokens ?? 4096,
      responseMimeType: "application/json",
    },
  };
}

export function parseGeminiVisionResponse(response: any): GeminiVisionResult {
  const candidate = response?.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text || "";

  let structuredData: Record<string, unknown> | undefined;
  try {
    structuredData = JSON.parse(text);
  } catch {
    structuredData = undefined;
  }

  return {
    text,
    structuredData,
    confidence: structuredData ? 0.9 : 0.5,
    model: response?.modelVersion || "unknown",
    usage: response?.usageMetadata
      ? {
          promptTokens: response.usageMetadata.promptTokenCount || 0,
          candidatesTokens: response.usageMetadata.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata.totalTokenCount || 0,
        }
      : undefined,
  };
}

export function isGeminiRetryableError(error: any): boolean {
  if (error?.code === 429) return true;
  if (error?.code === 500) return true;
  if (error?.code === 503) return true;
  if (error?.message?.includes("UNAVAILABLE")) return true;
  if (error?.message?.includes("RESOURCE_EXHAUSTED")) return true;
  return false;
}

export async function callGeminiVision(
  imageBase64: string,
  options: GeminiVisionOptions = {},
): Promise<GeminiVisionResult> {
  const apiKey = options.apiKey || getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key not configured");
  }

  const model = options.model || "gemini-3.6-flash";
  const maxRetries = options.maxRetries ?? 3;
  const timeout = options.timeout ?? 60000;

  const prompt = buildGeminiVisionPrompt();
  const requestBody = buildGeminiVisionRequest(imageBase64, prompt, options);

  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(buildGeminiApiUrl(apiKey, model), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
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
      return parseGeminiVisionResponse(data);
    } catch (error: any) {
      lastError = error;

      if (!isGeminiRetryableError(error) || attempt === maxRetries) {
        throw error;
      }

      const delay = 1000 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

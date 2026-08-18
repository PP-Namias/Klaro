import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "@langchain/openai";

type ModelConstructor = new (fields: Record<string, unknown>) => BaseChatModel;

/**
 * Single source of truth for the chat model spec (format: "provider/model").
 * Resolution order: explicit override > CHAT_MODEL > LLM_PROVIDER > "openai/gpt-4o-mini".
 * Bare provider names (e.g. "gemini") are valid and resolve to a default model.
 * Empty strings are treated as unset.
 */
export function resolveModelSpec(override?: string): string {
  /* eslint-disable @typescript-eslint/prefer-nullish-coalescing -- empty strings mean "unset" here */
  return (
    override ||
    process.env.CHAT_MODEL ||
    process.env.LLM_PROVIDER ||
    "openai/gpt-4o-mini"
  );
  /* eslint-enable @typescript-eslint/prefer-nullish-coalescing */
}

export async function loadChatModel(
  spec: string,
  temperature = 0.2,
): Promise<BaseChatModel> {
  const fallbackSpec = process.env.CHAT_MODEL_FALLBACK;

  try {
    return await initSingleModel(spec, temperature);
  } catch (primaryErr) {
    if (fallbackSpec && isRateLimitError(primaryErr)) {
      console.warn(
        `[ai-sidecar] Primary model "${spec}" rate-limited, falling back to "${fallbackSpec}"`,
      );
      try {
        return await initSingleModel(fallbackSpec, temperature);
      } catch (fallbackErr) {
        console.error(
          `[ai-sidecar] Fallback model "${fallbackSpec}" also failed`,
        );
        throw fallbackErr;
      }
    }
    throw primaryErr;
  }
}

const PROVIDER_ALIASES: Record<string, string> = {
  gemini: "google-genai",
  gpt: "openai",
  claude: "anthropic",
  llama: "ollama",
  openai: "openai",
  anthropic: "anthropic",
  "google-genai": "google-genai",
  groq: "groq",
  ollama: "ollama",
  bedrock: "bedrock",
  together: "together",
  fireworks: "fireworks",
};

const DEFAULT_MODELS: Record<string, string> = {
  "google-genai": "gemini-2.0-flash",
  ollama: "llama3",
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-haiku-20241022",
};

async function initSingleModel(
  spec: string,
  temperature: number,
): Promise<BaseChatModel> {
  const idx = spec.indexOf("/");
  const rawProvider = idx === -1 ? undefined : spec.slice(0, idx);
  const model = idx === -1 ? undefined : spec.slice(idx + 1);

  let provider: string | undefined;
  let resolvedModel: string;

  if (rawProvider) {
    provider = PROVIDER_ALIASES[rawProvider] ?? rawProvider;
    resolvedModel = model ?? DEFAULT_MODELS[provider] ?? "gpt-4o-mini";
  } else if (PROVIDER_ALIASES[spec]) {
    provider = PROVIDER_ALIASES[spec];
    resolvedModel = DEFAULT_MODELS[provider] ?? "gpt-4o-mini";
  } else {
    provider = "openai";
    resolvedModel = spec;
  }

  const ctor = await resolveModelCtor(provider);
  if (ctor) {
    return new ctor(buildArgs(provider, resolvedModel, temperature));
  }

  console.warn(
    `[ai-sidecar] Provider "${provider}" not available, falling back to OpenAI`,
  );
  return new ChatOpenAI({
    model: resolvedModel,
    temperature,
    apiKey: process.env.OPENAI_API_KEY || process.env.LLM_API_KEY,
  });
}

function buildArgs(
  provider: string | undefined,
  model: string,
  temperature: number,
): Record<string, unknown> {
  const timeout = parseInt(process.env.MODEL_TIMEOUT ?? "25000", 10);
  const maxRetries = parseInt(process.env.MODEL_MAX_RETRIES ?? "3", 10);
  const base: Record<string, unknown> = {
    model,
    temperature,
    timeout,
    maxRetries,
  };
  switch (provider) {
    case "openai":
      return { ...base, apiKey: process.env.OPENAI_API_KEY };
    case "anthropic":
      return { ...base, apiKey: process.env.ANTHROPIC_API_KEY };
    case "google-genai":
      return {
        ...base,
        model: model || "gemini-2.0-flash",
        apiKey:
          process.env.GOOGLE_API_KEY ||
          process.env.GOOGLE_GENAI_API_KEY ||
          process.env.GEMINI_API_KEY ||
          process.env.LLM_API_KEY,
      };
    case "groq":
      return { ...base, apiKey: process.env.GROQ_API_KEY };
    case "ollama":
      return {
        ...base,
        model: model || "llama3",
        baseUrl: process.env.OLLAMA_BASE_URL,
      };
    case "together":
      return { ...base, apiKey: process.env.TOGETHER_API_KEY };
    case "fireworks":
      return { ...base, apiKey: process.env.FIREWORKS_API_KEY };
    case "bedrock":
      return { ...base, region: process.env.AWS_BEDROCK_REGION };
    default:
      return base;
  }
}

async function resolveModelCtor(
  provider: string | undefined,
): Promise<ModelConstructor | null> {
  switch (provider) {
    case "openai":
      return ChatOpenAI;
    case "anthropic":
      return tryImport("@langchain/anthropic", "ChatAnthropic");
    case "google-genai":
      return tryImport("@langchain/google-genai", "ChatGoogleGenerativeAI");
    case "groq":
      return tryImport("@langchain/groq", "ChatGroq");
    case "ollama":
      return tryImport("@langchain/community/chat_models/ollama", "ChatOllama");
    case "bedrock":
      return tryImport(
        "@langchain/community/chat_models/bedrock",
        "BedrockChat",
      );
    case "together":
      return tryImport(
        "@langchain/community/chat_models/togetherai",
        "ChatTogetherAI",
      );
    case "fireworks":
      return tryImport(
        "@langchain/community/chat_models/fireworks",
        "ChatFireworks",
      );
    default:
      return null;
  }
}

async function tryImport(
  modulePath: string,
  exportName: string,
): Promise<ModelConstructor | null> {
  try {
    const mod = (await import(modulePath)) as Record<string, unknown>;
    const ctor = mod[exportName];
    if (typeof ctor === "function") {
      return ctor as unknown as ModelConstructor;
    }
    return null;
  } catch {
    console.warn(
      `[ai-sidecar] Module "${modulePath}" not available — install it to use this provider`,
    );
    return null;
  }
}

export function isRateLimitError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes("429") ||
      msg.includes("rate limit") ||
      msg.includes("rate_limit") ||
      msg.includes("too many requests")
    );
  }
  return false;
}

import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';

type ModelConstructor = new (fields: Record<string, unknown>) => BaseChatModel;

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

async function initSingleModel(
  spec: string,
  temperature: number,
): Promise<BaseChatModel> {
  const idx = spec.indexOf('/');
  const provider = idx === -1 ? undefined : spec.slice(0, idx);
  const model = idx === -1 ? spec : spec.slice(idx + 1);

  const ctor = await resolveModelCtor(provider);
  if (ctor) {
    return new ctor(buildArgs(provider, model, temperature));
  }

  console.warn(
    `[ai-sidecar] Provider "${provider ?? 'none'}" not available, falling back to OpenAI`,
  );
  return new ChatOpenAI({
    model: spec,
    temperature,
    apiKey: process.env.OPENAI_API_KEY,
  });
}

function buildArgs(
  provider: string | undefined,
  model: string,
  temperature: number,
): Record<string, unknown> {
  const base: Record<string, unknown> = { model, temperature };
  switch (provider) {
    case 'openai':
      return { ...base, apiKey: process.env.OPENAI_API_KEY };
    case 'anthropic':
      return { ...base, apiKey: process.env.ANTHROPIC_API_KEY };
    case 'google-genai':
      return {
        ...base,
        model: model || 'gemini-2.0-flash',
        apiKey: process.env.GOOGLE_GENAI_API_KEY,
      };
    case 'groq':
      return { ...base, apiKey: process.env.GROQ_API_KEY };
    case 'ollama':
      return {
        ...base,
        model: model || 'llama3',
        baseUrl: process.env.OLLAMA_BASE_URL,
      };
    case 'together':
      return { ...base, apiKey: process.env.TOGETHER_API_KEY };
    case 'fireworks':
      return { ...base, apiKey: process.env.FIREWORKS_API_KEY };
    case 'bedrock':
      return { ...base, region: process.env.AWS_BEDROCK_REGION };
    default:
      return base;
  }
}

async function resolveModelCtor(
  provider: string | undefined,
): Promise<ModelConstructor | null> {
  switch (provider) {
    case 'openai':
      return ChatOpenAI;
    case 'anthropic':
      return tryImport('@langchain/anthropic', 'ChatAnthropic');
    case 'google-genai':
      return tryImport('@langchain/google-genai', 'ChatGoogleGenerativeAI');
    case 'groq':
      return tryImport('@langchain/groq', 'ChatGroq');
    case 'ollama':
      return tryImport(
        '@langchain/community/chat_models/ollama',
        'ChatOllama',
      );
    case 'bedrock':
      return tryImport(
        '@langchain/community/chat_models/bedrock',
        'BedrockChat',
      );
    case 'together':
      return tryImport(
        '@langchain/community/chat_models/togetherai',
        'ChatTogetherAI',
      );
    case 'fireworks':
      return tryImport(
        '@langchain/community/chat_models/fireworks',
        'ChatFireworks',
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
    const mod = await (Function('return import("' + modulePath + '")') as () => Promise<Record<string, unknown>>)();
    const ctor = mod[exportName];
    if (typeof ctor === 'function') {
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

function isRateLimitError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes('429') ||
      msg.includes('rate limit') ||
      msg.includes('rate_limit') ||
      msg.includes('too many requests')
    );
  }
  return false;
}

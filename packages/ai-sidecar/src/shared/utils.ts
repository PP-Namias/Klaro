import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOllama } from '@langchain/ollama';
import { ChatGroq } from '@langchain/groq';

export type ModelProvider =
  | 'openai'
  | 'anthropic'
  | 'google-genai'
  | 'ollama'
  | 'groq'
  | 'deepseek'
  | 'together'
  | 'fireworks'
  | 'mistralai'
  | 'bedrock'
  | 'cerebras'
  | 'xai';

const SUPPORTED_PROVIDERS: ModelProvider[] = [
  'openai',
  'anthropic',
  'google-genai',
  'ollama',
  'groq',
  'deepseek',
  'together',
  'fireworks',
  'mistralai',
  'bedrock',
  'cerebras',
  'xai',
];

interface ModelSpec {
  provider?: ModelProvider;
  model: string;
}

function parseModelSpec(spec: string): ModelSpec {
  const idx = spec.indexOf('/');
  if (idx === -1) {
    return { model: spec };
  }
  const candidate = spec.slice(0, idx) as ModelProvider;
  const model = spec.slice(idx + 1);
  if (SUPPORTED_PROVIDERS.includes(candidate)) {
    return { provider: candidate, model };
  }
  return { model: spec };
}

async function initSingleModel(
  spec: string,
  temperature: number,
): Promise<BaseChatModel> {
  const { provider, model } = parseModelSpec(spec);

  switch (provider) {
    case 'openai':
      return new ChatOpenAI({
        model,
        temperature,
        apiKey: process.env.OPENAI_API_KEY,
      });

    case 'anthropic':
      return new ChatAnthropic({
        model,
        temperature,
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

    case 'google-genai':
      return new ChatGoogleGenerativeAI({
        model: model || 'gemini-2.0-flash',
        temperature,
        apiKey: process.env.GOOGLE_GENAI_API_KEY,
      });

    case 'ollama':
      return new ChatOllama({
        model: model || 'llama3',
        temperature,
        baseUrl: process.env.OLLAMA_BASE_URL,
      });

    case 'groq':
      return new ChatGroq({
        model,
        temperature,
        apiKey: process.env.GROQ_API_KEY,
      });

    default:
      if (provider) {
        console.warn(
          `[ai-sidecar] Provider "${provider}" not directly supported, falling back to OpenAI`,
        );
      }
      return new ChatOpenAI({
        model: spec,
        temperature,
        apiKey: process.env.OPENAI_API_KEY,
      });
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

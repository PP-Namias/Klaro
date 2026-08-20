import type { Document } from "@langchain/core/documents";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { BaseMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";

import type { RetrievalConfiguration } from "./configuration.js";
import { makeRetriever } from "../shared/retrieval.js";
import {
  isRateLimitError,
  loadChatModel,
  resolveModelSpec,
} from "../shared/utils.js";
import {
  buildQASystemPrompt,
  FOLLOW_UP_PROMPT,
} from "./prompts.js";
import { getMockAnswer } from "../shared/mockFallback.js";

export function formatDocsAsString(docs: Document[]): string {
  if (!docs || docs.length === 0) return "";

  return docs
    .map((doc, i) => {
      const citation = doc.metadata?.citation ?? `[${i + 1}]`;
      const heading = doc.metadata?.heading ? ` Heading: ${doc.metadata.heading}` : "";
      const source = doc.metadata?.sourceFile ?? doc.metadata?.sourcePage ?? "unknown";
      return `${citation} ${doc.pageContent}\nSource: ${source}${heading}`;
    })
    .join("\n\n");
}

export function formatMessagesToHistory(messages: BaseMessage[]): string {
  return messages
    .map((m) => {
      const text = extractTextFromContent(m.content);
      if (m instanceof HumanMessage) return `User: ${text}`;
      if (m instanceof AIMessage) return `Assistant: ${text}`;
      return `${m.constructor.name}: ${text}`;
    })
    .join("\n");
}

function extractTextFromContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (typeof block === "string") return block;
        if (
          typeof block === "object" &&
          block !== null &&
          "text" in block &&
          typeof (block as { text: unknown }).text === "string"
        ) {
          return (block as { text: string }).text;
        }
        return "";
      })
      .filter((part) => part.length > 0)
      .join(" ");
  }
  return "";
}

function hasImageContent(content: unknown): boolean {
  return (
    Array.isArray(content) &&
    content.some(
      (block) =>
        typeof block === "object" &&
        block !== null &&
        "image_url" in block,
    )
  );
}

export async function retrieveDocs(
  question: string,
  config?: RunnableConfig,
): Promise<Document[]> {
  const { getRetrieverTimeout } = await import("../shared/latency.js");
  const timeoutMs = getRetrieverTimeout();
  try {
    const retriever = await makeRetriever(config);
    const docs = await Promise.race([
      retriever.invoke(question),
      new Promise<Document[]>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Retriever invoke timed out after ${timeoutMs}ms`)),
          timeoutMs,
        ),
      ),
    ]);
    return docs;
  } catch (err) {
    console.warn(
      "[ai-sidecar] Retriever unavailable, returning empty docs:",
      (err as Error).message?.substring(0, 120),
    );
    return [];
  }
}

export async function generateAnswer(
  question: string,
  docs: Document[],
  messages: BaseMessage[],
  config?: RunnableConfig,
): Promise<string> {
  const c = config?.configurable as Partial<RetrievalConfiguration> & { locale?: string; dialect?: string } | undefined;
  const modelName = resolveModelSpec(c?.model);
  const locale = c?.locale ?? c?.dialect ?? process.env.DEFAULT_LOCALE ?? "en";
  const temperature =
    c?.temperature ?? parseFloat(process.env.LLM_TEMPERATURE ?? "0.3");
  const fallbackModelSpec = process.env.CHAT_MODEL_FALLBACK;
  const mockMode = process.env.ENABLE_MOCK_MODE === "true";

  if (mockMode) {
    return generateMockAnswer(question, docs, locale);
  }

  // Hybrid cache: check before LLM call (deterministic key: prompt+context+locale+tenant+model)
  const contextStrForCache = formatDocsAsString(docs);
  const cacheInputs = {
    prompt: question,
    context: contextStrForCache,
    locale,
    tenantId: (c as Record<string, unknown>)?.tenantId as string | undefined,
    model: modelName,
  };

  const { getCachedAnswer, setCachedAnswer } = await import("../shared/cache/hybridCache.js");
  const cached = await getCachedAnswer(cacheInputs);
  if (cached) return cached.answer;

  const promptMessages = buildPromptMessages(question, docs, messages, locale);

  try {
    const model = await loadChatModel(modelName, temperature);
    const response = await invokeWithRetry(model, promptMessages, config);
    const answer = response.content.toString();
    await setCachedAnswer(cacheInputs, answer);
    return answer;
  } catch (err) {
    if (
      fallbackModelSpec &&
      (isRateLimitError(err) ||
        (err instanceof Error && err.message.includes("timed out")))
    ) {
      console.warn(
        `[ai-sidecar] Primary model "${modelName}" failed (${(err as Error).message}), trying fallback "${fallbackModelSpec}"`,
      );
      try {
        if (fallbackModelSpec === "mock") {
          console.warn(
            "[ai-sidecar] Primary model failed, using mock fallback answer",
          );
          return generateMockAnswer(question, docs, locale);
        }
        const fallbackModel = await loadChatModel(
          fallbackModelSpec,
          temperature,
        );
        const fallbackResponse = await invokeWithRetry(
          fallbackModel,
          promptMessages,
          config,
        );
        return fallbackResponse.content.toString();
      } catch (fallbackErr) {
        console.error(
          `[ai-sidecar] Fallback model "${fallbackModelSpec}" also failed`,
        );
        throw fallbackErr;
      }
    }
    if (
      err instanceof Error &&
      (err.message.includes("timed out") || err.message.includes("429"))
    ) {
      console.warn("[ai-sidecar] LLM unavailable, returning mock answer");
      return generateMockAnswer(question, docs, locale);
    }
    throw err;
  }
}

function generateMockAnswer(question: string, docs: Document[], locale = "en"): string {
  return getMockAnswer(question, docs, locale);
}

export async function generateFollowUpQuestions(
  messages: BaseMessage[],
  config?: RunnableConfig,
): Promise<string[]> {
  const c = config?.configurable as Partial<RetrievalConfiguration> & { locale?: string } | undefined;
  const includeFollowUps = c?.includeFollowUps ?? true;

  if (!includeFollowUps) return [];

  if (process.env.ENABLE_MOCK_MODE === "true") {
    return [
      "Tell me more about this topic",
      "What are the related concepts?",
      "Can you provide examples?",
    ];
  }

  try {
    const locale = c?.locale ?? process.env.DEFAULT_LOCALE ?? "en";
    const model = await loadChatModel(resolveModelSpec(c?.model), 0.7);
    const historyStr = formatMessagesToHistory(messages);
    const prompt = FOLLOW_UP_PROMPT.replace("{messages}", historyStr).replaceAll("{locale}", locale);

    const parser = new StringOutputParser();
    const chain = model.pipe(parser);

    const timeoutMs = parseInt(process.env.FOLLOW_UP_TIMEOUT ?? "45000", 10);
    const raw = await Promise.race([
      chain.invoke(prompt, config),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Follow-up generation timed out after ${timeoutMs}ms`)),
          timeoutMs,
        ),
      ),
    ]);

    return raw
      .split("\n")
      .filter((line) => line.trim().startsWith("- "))
      .map((line) => line.trim().replace(/^- /, ""))
      .filter(Boolean);
  } catch (err) {
    console.warn(
      "[ai-sidecar] Follow-up question generation failed, returning empty list:",
      (err as Error).message?.substring(0, 120),
    );
    return [];
  }
}

export function buildPromptMessages(
  question: string,
  docs: Document[],
  messages: BaseMessage[],
  locale = "en",
): BaseMessage[] {
  const contextStr = formatDocsAsString(docs);
  const priorMessages =
    messages.length > 0 && messages.at(-1) instanceof HumanMessage
      ? messages.slice(0, -1)
      : messages;
  const historyStr = formatMessagesToHistory(priorMessages);

  // Gemini requires single SystemMessage folding history + medical context + dialect
  const systemPrompt = buildQASystemPrompt({ context: contextStr, locale });

  const result: BaseMessage[] = [
    new SystemMessage(
      historyStr.trim()
        ? `${systemPrompt}\n\nPrevious conversation:\n${historyStr}`
        : systemPrompt,
    ),
  ];

  const lastMessage = messages.length > 0 ? messages.at(-1) : undefined;
  const isVisionMessage =
    lastMessage instanceof HumanMessage &&
    hasImageContent(lastMessage.content);

  result.push(
    isVisionMessage
      ? new HumanMessage({ content: lastMessage.content })
      : new HumanMessage(question),
  );
  return result;
}

async function invokeWithTimeout(
  model: BaseChatModel,
  messages: BaseMessage[],
  config?: RunnableConfig,
): Promise<AIMessage> {
  const { getModelTimeout, compressPrompt } = await import("../shared/latency.js");
  const timeoutMs = getModelTimeout();
  // Prompt compression for latency: truncate overly long system prompts
  const compressed = messages.map((m) => {
    const text = typeof m.content === "string" ? m.content : "";
    if (text.length > 12000) {
      const compressedText = compressPrompt(text);
      const Ctor = m.constructor as new (content: string) => BaseMessage;
      return new Ctor(compressedText);
    }
    return m;
  });

  const result = await Promise.race([
    model.invoke(compressed, config),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Model invoke timed out after ${timeoutMs}ms`)),
        timeoutMs,
      ),
    ),
  ]);
  return result;
}

async function invokeWithRetry(
  model: BaseChatModel,
  messages: BaseMessage[],
  config?: RunnableConfig,
  maxRetries = 2,
): Promise<AIMessage> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await invokeWithTimeout(model, messages, config);
    } catch (err) {
      if (isRateLimitError(err) && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(
          `[ai-sidecar] Rate limited (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms`,
        );
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries exceeded");
}

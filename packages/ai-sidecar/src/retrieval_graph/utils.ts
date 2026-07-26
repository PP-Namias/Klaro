import type { Document } from "@langchain/core/documents";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type {
  BaseMessage} from "@langchain/core/messages";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import type { RunnableConfig } from "@langchain/core/runnables";

import { makeRetriever } from "../shared/retrieval.js";
import { isRateLimitError, loadChatModel } from "../shared/utils.js";
import type { RetrievalConfiguration } from "./configuration.js";
import {
  FOLLOW_UP_PROMPT,
  QA_SYSTEM_PROMPT,
  QA_SYSTEM_PROMPT_NO_CONTEXT,
} from "./prompts.js";

export function formatDocsAsString(docs: Document[]): string {
  if (!docs || docs.length === 0) return "";

  return docs
    .map(
      (doc, i) =>
        `[${i + 1}] ${doc.pageContent}\nSource: ${doc.metadata?.sourceFile ?? "unknown"}`,
    )
    .join("\n\n");
}

export function formatMessagesToHistory(messages: BaseMessage[]): string {
  return messages
    .map((m) => {
      if (m instanceof HumanMessage) return `User: ${m.content}`;
      if (m instanceof AIMessage) return `Assistant: ${m.content}`;
      return `${m.constructor.name}: ${m.content}`;
    })
    .join("\n");
}

export async function retrieveDocs(
  question: string,
  config?: RunnableConfig,
): Promise<Document[]> {
  try {
    const retriever = await makeRetriever(config);
    const docs = await Promise.race([
      retriever.invoke(question),
      new Promise<Document[]>((_, reject) =>
        setTimeout(
          () => reject(new Error("Retriever invoke timed out after 8s")),
          8000,
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
  const c = config?.configurable as Partial<RetrievalConfiguration> | undefined;
  const modelName = c?.model ?? process.env.LLM_PROVIDER ?? "openai";
  const temperature = c?.temperature ?? 0.3;
  const fallbackModelSpec = process.env.CHAT_MODEL_FALLBACK;
  const mockMode = process.env.ENABLE_MOCK_MODE === "true";

  if (mockMode) {
    return generateMockAnswer(question, docs);
  }

  const promptMessages = buildPromptMessages(question, docs, messages);

  try {
    const model = await loadChatModel(modelName, temperature);
    const response = await invokeWithRetry(model, promptMessages, config);
    return response.content.toString();
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
        if (
          typeof fallbackModelSpec === "string" &&
          fallbackModelSpec === "mock"
        ) {
          return generateMockAnswer(question, docs);
        }
        throw fallbackErr;
      }
    }
    if (
      err instanceof Error &&
      (err.message.includes("timed out") || err.message.includes("429"))
    ) {
      console.warn("[ai-sidecar] LLM unavailable, returning mock answer");
      return generateMockAnswer(question, docs);
    }
    throw err;
  }
}

function generateMockAnswer(question: string, docs: Document[]): string {
  const firstDoc = docs.length > 0 ? docs[0] : undefined;
  const context = firstDoc
    ? firstDoc.pageContent.substring(0, 100)
    : "No documents retrieved";
  return `This is a simulated response for: "${question}". Based on available information (${context}...), I would provide a helpful answer here. For full AI-powered responses, please configure a valid API key.`;
}

export async function generateFollowUpQuestions(
  messages: BaseMessage[],
  config?: RunnableConfig,
): Promise<string[]> {
  const c = config?.configurable as Partial<RetrievalConfiguration> | undefined;
  const includeFollowUps = c?.includeFollowUps ?? true;

  if (!includeFollowUps) return [];

  if (process.env.ENABLE_MOCK_MODE === "true") {
    return [
      "Tell me more about this topic",
      "What are the related concepts?",
      "Can you provide examples?",
    ];
  }

  const model = await loadChatModel("openai", 0.7);
  const historyStr = formatMessagesToHistory(messages);
  const prompt = FOLLOW_UP_PROMPT.replace("{messages}", historyStr);

  const parser = new StringOutputParser();
  const chain = model.pipe(parser);

  const raw = await chain.invoke(prompt, config);

  return raw
    .split("\n")
    .filter((line) => line.trim().startsWith("- "))
    .map((line) => line.trim().replace(/^- /, ""))
    .filter(Boolean);
}

function buildPromptMessages(
  question: string,
  docs: Document[],
  messages: BaseMessage[],
): BaseMessage[] {
  const contextStr = formatDocsAsString(docs);
  const historyStr = formatMessagesToHistory(messages);

  const systemPrompt = contextStr.trim()
    ? QA_SYSTEM_PROMPT.replace("{context}", contextStr)
    : QA_SYSTEM_PROMPT_NO_CONTEXT;

  const result: BaseMessage[] = [new SystemMessage(systemPrompt)];

  if (historyStr.trim()) {
    result.push(new SystemMessage(`Previous conversation:\n${historyStr}`));
  }

  result.push(new HumanMessage(question));
  return result;
}

async function invokeWithTimeout(
  model: BaseChatModel,
  messages: BaseMessage[],
  config?: RunnableConfig,
): Promise<AIMessage> {
  const timeoutMs = parseInt(process.env.MODEL_TIMEOUT ?? "25000", 10);

  const result = await Promise.race([
    model.invoke(messages, config),
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

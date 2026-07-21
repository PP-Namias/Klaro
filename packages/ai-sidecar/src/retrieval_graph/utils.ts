import { Document } from '@langchain/core/documents';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  BaseMessage,
  HumanMessage,
  AIMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { RunnableConfig } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';

import { loadChatModel } from '../shared/utils.js';
import { isRateLimitError } from '../shared/utils.js';
import { makeRetriever } from '../shared/retrieval.js';
import {
  QA_SYSTEM_PROMPT,
  QA_SYSTEM_PROMPT_NO_CONTEXT,
  FOLLOW_UP_PROMPT,
} from './prompts.js';
import { RetrievalConfiguration } from './configuration.js';

export function formatDocsAsString(docs: Document[]): string {
  if (!docs || docs.length === 0) return '';

  return docs
    .map(
      (doc, i) =>
        `[${i + 1}] ${doc.pageContent}\nSource: ${doc.metadata?.sourceFile ?? 'unknown'}`,
    )
    .join('\n\n');
}

export function formatMessagesToHistory(
  messages: BaseMessage[],
): string {
  return messages
    .map((m) => {
      if (m instanceof HumanMessage) return `User: ${m.content}`;
      if (m instanceof AIMessage) return `Assistant: ${m.content}`;
      return `${m.constructor.name}: ${m.content}`;
    })
    .join('\n');
}

export async function retrieveDocs(
  question: string,
  config?: RunnableConfig,
): Promise<Document[]> {
  try {
    const retriever = await makeRetriever(config);
    return await retriever.invoke(question);
  } catch (err) {
    console.warn('[ai-sidecar] Retriever unavailable, returning empty docs:', (err as Error).message);
    return [];
  }
}

export async function generateAnswer(
  question: string,
  docs: Document[],
  messages: BaseMessage[],
  config?: RunnableConfig,
): Promise<string> {
  const c = config?.configurable as
    | Partial<RetrievalConfiguration>
    | undefined;
  const modelName = c?.model ?? process.env.LLM_PROVIDER ?? 'openai';
  const temperature = c?.temperature ?? 0.3;

  const model = await loadChatModel(modelName, temperature);

  const contextStr = formatDocsAsString(docs);
  const historyStr = formatMessagesToHistory(messages);

  const systemPrompt =
    contextStr.trim()
      ? QA_SYSTEM_PROMPT.replace('{context}', contextStr)
      : QA_SYSTEM_PROMPT_NO_CONTEXT;

  const systemMessage = new SystemMessage(systemPrompt);

  const promptMessages: BaseMessage[] = [systemMessage];

  if (historyStr.trim()) {
    promptMessages.push(
      new SystemMessage(`Previous conversation:\n${historyStr}`),
    );
  }

  promptMessages.push(new HumanMessage(question));

  const response = await invokeWithRetry(model, promptMessages, config);
  return response.content.toString();
}

async function invokeWithRetry(
  model: BaseChatModel,
  messages: BaseMessage[],
  config?: RunnableConfig,
  maxRetries = 3,
): Promise<AIMessage> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await model.invoke(messages, config);
    } catch (err) {
      if (isRateLimitError(err) && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`[ai-sidecar] Rate limited (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
}

export async function generateFollowUpQuestions(
  messages: BaseMessage[],
  config?: RunnableConfig,
): Promise<string[]> {
  const c = config?.configurable as
    | Partial<RetrievalConfiguration>
    | undefined;
  const includeFollowUps = c?.includeFollowUps ?? true;

  if (!includeFollowUps) return [];

  const model = await loadChatModel('openai', 0.7);
  const historyStr = formatMessagesToHistory(messages);
  const prompt = FOLLOW_UP_PROMPT.replace('{messages}', historyStr);

  const parser = new StringOutputParser();
  const chain = model.pipe(parser);

  const raw = await chain.invoke(prompt, config);

  return raw
    .split('\n')
    .filter((line) => line.trim().startsWith('- '))
    .map((line) => line.trim().replace(/^- /, ''))
    .filter(Boolean);
}

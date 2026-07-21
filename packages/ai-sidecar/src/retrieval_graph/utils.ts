import { Document } from '@langchain/core/documents';
import {
  BaseMessage,
  HumanMessage,
  AIMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { RunnableConfig } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';

import { loadChatModel } from '../shared/utils.js';
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
  const retriever = await makeRetriever(config);
  return retriever.invoke(question);
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

  const response = await model.invoke(promptMessages, config);
  return response.content.toString();
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

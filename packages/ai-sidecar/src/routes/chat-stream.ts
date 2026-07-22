import { Router, type Request, type Response } from 'express';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { graph as retrievalGraph } from '../retrieval_graph/graph.js';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatStreamQuery {
  question?: string;
  messages?: string;
}

const router = Router();

function sendSSE(res: Response, data: Record<string, unknown>): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

router.get('/stream', async (req: Request, res: Response) => {
  const { question, messages: rawMessages } = req.query as ChatStreamQuery;

  if (!question) {
    res.status(400).json({ error: 'question query parameter is required' });
    return;
  }

  let parsedMessages: ChatMessage[] = [];
  if (rawMessages) {
    try {
      parsedMessages = JSON.parse(rawMessages) as ChatMessage[];
    } catch {
      res.status(400).json({ error: 'Invalid messages JSON' });
      return;
    }
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  res.flushHeaders();

  try {
    const langchainMessages = parsedMessages.map((msg) => {
      if (msg.role === 'user') return new HumanMessage(msg.content);
      return new AIMessage(msg.content);
    });

    sendSSE(res, { event: 'status', message: 'Starting retrieval...' });

    let finalAnswer = '';
    let followUpQuestions: string[] = [];

    const events = retrievalGraph.streamEvents(
      { question, messages: langchainMessages },
      { version: 'v2' },
    );

    for await (const event of events) {
      if (event.event === 'on_chat_model_stream') {
        const chunk = event.data?.chunk as { content?: string } | undefined;
        if (chunk?.content) {
          const text = typeof chunk.content === 'string' ? chunk.content : '';
          if (text) {
            finalAnswer += text;
            sendSSE(res, { event: 'token', token: text });
          }
        }
      } else if (
        event.event === 'on_chain_end' &&
        (event.name === 'generate' || event.name === 'emptyAnswer')
      ) {
        const output = event.data?.output as
          | { answer?: string }
          | undefined;
        if (output?.answer) {
          if (!finalAnswer) {
            sendSSE(res, { event: 'token', token: output.answer });
          }
          finalAnswer = output.answer;
        }
        sendSSE(res, { event: 'status', message: 'Generation complete' });
      } else if (event.event === 'on_chain_end' && event.name === 'followUp') {
        const output = event.data?.output as
          | { followUpQuestions?: string[] }
          | undefined;
        if (output?.followUpQuestions) {
          followUpQuestions = output.followUpQuestions;
        }
      }
    }

    sendSSE(res, {
      event: 'complete',
      answer: finalAnswer,
      followUpQuestions,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const isQuota =
      message.includes('429') ||
      message.toLowerCase().includes('quota') ||
      message.toLowerCase().includes('rate limit');

    if (isQuota) {
      sendSSE(res, { error: 'Quota or rate limit exceeded', code: 429 });
    } else {
      sendSSE(res, { error: message, code: 500 });
    }
  } finally {
    res.end();
  }
});

export default router;

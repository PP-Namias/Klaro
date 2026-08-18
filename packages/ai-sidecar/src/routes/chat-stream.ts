import type { Request, Response } from "express";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { Router } from "express";

import { graph as retrievalGraph } from "../retrieval_graph/graph.js";
import { extractAnswerText, extractChunkText } from "../shared/streaming.js";

interface ChatMessage {
  role: "user" | "assistant";
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

async function streamResponse(
  res: Response,
  question: string,
  parsedMessages: ChatMessage[],
): Promise<void> {
  const langchainMessages = parsedMessages.map((msg) => {
    if (msg.role === "user") return new HumanMessage(msg.content);
    return new AIMessage(msg.content);
  });

  sendSSE(res, { event: "status", message: "Starting retrieval..." });

  let finalAnswer = "";
  let followUpQuestions: string[] = [];

  const events = retrievalGraph.streamEvents(
    { question, messages: langchainMessages },
    { version: "v2" },
  );

  for await (const event of events) {
    if (event.event === "on_chat_model_stream") {
      const chunk = event.data?.chunk as
        | Parameters<typeof extractChunkText>[0]
        | undefined;
      const text = extractChunkText(chunk);
      if (text) {
        finalAnswer += text;
        sendSSE(res, { event: "token", token: text });
      }
    } else if (
      event.event === "on_chain_end" &&
      (event.name === "generate" || event.name === "emptyAnswer")
    ) {
      const answer = extractAnswerText(event.data?.output);
      if (answer) {
        if (!finalAnswer) {
          sendSSE(res, { event: "token", token: answer });
        }
        finalAnswer = answer;
      }
      sendSSE(res, { event: "status", message: "Generation complete" });
    } else if (event.event === "on_chain_end" && event.name === "followUp") {
      const output = event.data?.output as
        | { followUpQuestions?: string[] }
        | undefined;
      if (output?.followUpQuestions) {
        followUpQuestions = output.followUpQuestions;
      }
    }
  }

  sendSSE(res, {
    event: "complete",
    answer: finalAnswer,
    followUpQuestions,
  });
}

function parseMessages(rawMessages: string | undefined): ChatMessage[] {
  if (!rawMessages) return [];
  const parsed = JSON.parse(rawMessages) as ChatMessage[];
  if (!Array.isArray(parsed)) {
    throw new Error("messages must be an array");
  }
  return parsed.map((msg) => ({
    role: msg.role === "user" ? "user" : "assistant",
    content: String(msg.content ?? ""),
  }));
}

async function runStream(
  req: Request,
  res: Response,
  question: string,
  parsedMessages: ChatMessage[],
): Promise<void> {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  res.flushHeaders();

  try {
    await streamResponse(res, question, parsedMessages);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const isQuota =
      message.includes("429") ||
      message.toLowerCase().includes("quota") ||
      message.toLowerCase().includes("rate limit");

    if (isQuota) {
      sendSSE(res, { error: "Quota or rate limit exceeded", code: 429 });
    } else {
      sendSSE(res, { error: message, code: 500 });
    }
  } finally {
    res.end();
  }
}

router.get("/stream", async (req: Request, res: Response) => {
  const { question, messages: rawMessages } = req.query as ChatStreamQuery;

  if (!question) {
    res.status(400).json({ error: "question query parameter is required" });
    return;
  }

  let parsedMessages: ChatMessage[] = [];
  if (rawMessages) {
    try {
      parsedMessages = parseMessages(rawMessages);
    } catch {
      res.status(400).json({ error: "Invalid messages JSON" });
      return;
    }
  }

  await runStream(req, res, question, parsedMessages);
});

router.post("/stream", async (req: Request, res: Response) => {
  const body = req.body as
    | { question?: unknown; messages?: unknown }
    | undefined;

  if (!body || typeof body.question !== "string" || !body.question) {
    res.status(400).json({ error: "question is required in the request body" });
    return;
  }

  let parsedMessages: ChatMessage[] = [];
  if (body.messages !== undefined) {
    try {
      parsedMessages = parseMessages(JSON.stringify(body.messages));
    } catch {
      res.status(400).json({ error: "Invalid messages array" });
      return;
    }
  }

  await runStream(req, res, body.question, parsedMessages);
});

export default router;

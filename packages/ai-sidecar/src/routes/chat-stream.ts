import type {
  DataContentBlock,
  MessageContentComplex,
} from "@langchain/core/messages";
import type { Request, Response } from "express";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { Router } from "express";

import type { AuthenticatedRequest, AuthUser } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimiter } from "../middleware/rate-limit.js";
import { graph as retrievalGraph } from "../retrieval_graph/graph.js";
import { createCostTracker } from "../shared/costTracking.js";
import { extractAnswerText, extractChunkText } from "../shared/streaming.js";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  image?: string;
}

interface ChatStreamQuery {
  question?: string;
  messages?: string;
}

interface ChatStreamMetadata {
  guestMode?: unknown;
  threadId?: unknown;
}

const IMAGE_DATA_URI = /^data:image\/(png|jpe?g|webp|gif);base64,/i;

const router = Router();

function sendSSE(res: Response, data: Record<string, unknown>): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

type ChatContentBlock = MessageContentComplex | DataContentBlock;

function buildUserContent(
  question: string,
  image?: string,
): ChatContentBlock[] {
  const blocks: ChatContentBlock[] = [{ type: "text", text: question }];
  if (image && IMAGE_DATA_URI.test(image)) {
    blocks.push({ type: "image_url", image_url: { url: image } });
  }
  return blocks;
}

function buildChatConfigurable(
  user: AuthUser,
  guestMode: boolean,
): Record<string, unknown> {
  return {
    tenantId: user.tenantId,
    patientId: user.patientId,
    filterKwargs: {
      ...(guestMode ? { namespace: "public_faq" } : {}),
      tenantId: user.tenantId,
    },
    ...(guestMode ? { k: 3 } : {}),
  };
}

function buildStreamOptions(
  configurable: Record<string, unknown>,
  tenantId: string,
  traceId: string,
): Parameters<typeof retrievalGraph.streamEvents>[1] {
  const options: Record<string, unknown> = {
    version: "v2",
    runName: `chat_stream_${traceId}`,
    configurable: {
      ...configurable,
      traceId,
    },
    callbacks: createCostTracker(tenantId).callbacks,
  };
  return options as unknown as Parameters<
    typeof retrievalGraph.streamEvents
  >[1];
}

async function streamResponse(
  res: Response,
  question: string,
  parsedMessages: ChatMessage[],
  image?: string,
  options?: Parameters<typeof retrievalGraph.streamEvents>[1],
): Promise<void> {
  const langchainMessages = parsedMessages.map((msg) => {
    if (msg.role === "user") {
      if (msg.image && IMAGE_DATA_URI.test(msg.image)) {
        return new HumanMessage({
          content: [
            { type: "text", text: msg.content },
            { type: "image_url", image_url: { url: msg.image } },
          ],
        });
      }
      return new HumanMessage(msg.content);
    }
    return new AIMessage(msg.content);
  });

  if (image) {
    langchainMessages.push(
      new HumanMessage({ content: buildUserContent(question, image) }),
    );
  } else {
    langchainMessages.push(new HumanMessage(question));
  }

  sendSSE(res, { event: "status", message: "Starting retrieval..." });

  let finalAnswer = "";
  let followUpQuestions: string[] = [];

  const events = retrievalGraph.streamEvents(
    { question, messages: langchainMessages },
    options ?? ({} as Parameters<typeof retrievalGraph.streamEvents>[1]),
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
    image:
      typeof msg.image === "string" && IMAGE_DATA_URI.test(msg.image)
        ? msg.image
        : undefined,
  }));
}

async function runStream(
  req: Request,
  res: Response,
  question: string,
  parsedMessages: ChatMessage[],
  image?: string,
  options?: Parameters<typeof retrievalGraph.streamEvents>[1],
): Promise<void> {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  res.flushHeaders();

  try {
    await streamResponse(res, question, parsedMessages, image, options);
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

router.get(
  "/stream",
  requireAuth,
  rateLimiter,
  async (req: AuthenticatedRequest, res: Response) => {
    const { question, messages: rawMessages } = req.query as ChatStreamQuery;

    if (!question) {
      res.status(400).json({ error: "question query parameter is required" });
      return;
    }

    const user = req.user;
    if (!user) {
      res
        .status(401)
        .json({ error: "Missing or invalid authorization header" });
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

    await runStream(
      req,
      res,
      question,
      parsedMessages,
      undefined,
      buildStreamOptions(
        buildChatConfigurable(user, false),
        user.tenantId,
        String(req.headers["x-correlation-id"] ?? "unknown"),
      ),
    );
  },
);

router.post(
  "/stream",
  requireAuth,
  rateLimiter,
  async (req: AuthenticatedRequest, res: Response) => {
    const body = req.body as
      | {
          question?: unknown;
          messages?: unknown;
          image?: unknown;
          metadata?: unknown;
        }
      | undefined;

    if (!body || typeof body.question !== "string" || !body.question) {
      res
        .status(400)
        .json({ error: "question is required in the request body" });
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

    const image =
      typeof body.image === "string" && IMAGE_DATA_URI.test(body.image)
        ? body.image
        : undefined;

    const rawMetadata = body.metadata as
      | Partial<ChatStreamMetadata>
      | undefined;
    const guestMode =
      rawMetadata && typeof rawMetadata === "object"
        ? rawMetadata.guestMode === true
        : false;

    const user = req.user;
    if (!user) {
      res
        .status(401)
        .json({ error: "Missing or invalid authorization header" });
      return;
    }

    await runStream(
      req,
      res,
      body.question,
      parsedMessages,
      image,
      buildStreamOptions(
        buildChatConfigurable(user, guestMode),
        user.tenantId,
        String(req.headers["x-correlation-id"] ?? "unknown"),
      ),
    );
  },
);

export default router;

import type { Request, Response } from "express";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { Router } from "express";

import { graph as retrievalGraph } from "../retrieval_graph/graph.js";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  question: string;
  messages?: ChatMessage[];
}

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { question, messages = [] } = req.body as ChatRequestBody;

    if (!question || typeof question !== "string") {
      res.status(400).json({ error: "question is required" });
      return;
    }

    const langchainMessages = messages.map((msg) => {
      if (msg.role === "user") return new HumanMessage(msg.content);
      return new AIMessage(msg.content);
    });

    const result = await retrievalGraph.invoke({
      question,
      messages: langchainMessages,
    });

    res.json({
      answer: result.answer,
      followUpQuestions: result.followUpQuestions ?? [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[ai-sidecar] Chat failed:", message);
    res.status(500).json({ error: message });
  }
});

export default router;

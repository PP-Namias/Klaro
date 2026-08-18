import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { afterEach, describe, expect, it, vi } from "vitest";

import { graph } from "../graph.js";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("retrieval graph", () => {
  it("runs end-to-end in mock mode with no vector store", async () => {
    vi.stubEnv("ENABLE_MOCK_MODE", "true");
    vi.stubEnv("VECTOR_STORE_PROVIDER", "none");

    const result = await graph.invoke({
      question: "What is hemoglobin?",
      messages: [new HumanMessage("What is hemoglobin?")],
    });

    expect(result.answer).toContain("simulated response");
    expect(result.followUpQuestions).toHaveLength(3);
    expect(result.messages.at(-1)).toBeInstanceOf(AIMessage);
  });

  it("returns an answer even without conversation history", async () => {
    vi.stubEnv("ENABLE_MOCK_MODE", "true");
    vi.stubEnv("VECTOR_STORE_PROVIDER", "none");

    const result = await graph.invoke({ question: "Hello" });

    expect(result.answer.length).toBeGreaterThan(0);
    expect(result.followUpQuestions).toHaveLength(3);
  });
});

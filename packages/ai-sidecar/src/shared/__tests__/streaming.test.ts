import { AIMessageChunk } from "@langchain/core/messages";
import { describe, expect, it } from "vitest";

import { extractAnswerText, extractChunkText } from "../streaming.js";

describe("extractChunkText", () => {
  it("returns text for string content", () => {
    const chunk = new AIMessageChunk({ content: "Hello world" });
    expect(extractChunkText(chunk)).toBe("Hello world");
  });

  it("concatenates text from content block arrays (Gemini style)", () => {
    const chunk = new AIMessageChunk({
      content: [
        { type: "text", text: "Hello " },
        { type: "text", text: "world" },
      ],
    });
    expect(extractChunkText(chunk)).toBe("Hello world");
  });

  it("skips non-text blocks (tool calls etc.)", () => {
    const chunk = new AIMessageChunk({
      content: [
        { type: "text", text: "Answer: " },
        {
          type: "tool_use",
          id: "call_1",
          name: "search",
          input: { query: "x" },
        },
      ],
    });
    expect(extractChunkText(chunk)).toBe("Answer: ");
  });

  it("returns empty string for undefined chunk", () => {
    expect(extractChunkText(undefined)).toBe("");
  });

  it("returns empty string for empty content", () => {
    const chunk = new AIMessageChunk({ content: "" });
    expect(extractChunkText(chunk)).toBe("");
  });
});

describe("extractAnswerText", () => {
  it("returns string output as-is", () => {
    expect(extractAnswerText("plain answer")).toBe("plain answer");
  });

  it("extracts answer from object output", () => {
    expect(extractAnswerText({ answer: "structured answer" })).toBe(
      "structured answer",
    );
  });

  it("returns undefined for unrelated shapes", () => {
    expect(extractAnswerText({ followUpQuestions: [] })).toBeUndefined();
    expect(extractAnswerText(undefined)).toBeUndefined();
    expect(extractAnswerText(42)).toBeUndefined();
  });
});

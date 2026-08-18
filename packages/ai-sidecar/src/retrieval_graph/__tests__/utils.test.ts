import type { Document } from "@langchain/core/documents";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  formatDocsAsString,
  formatMessagesToHistory,
  generateAnswer,
  generateFollowUpQuestions,
} from "../utils.js";

vi.mock("../../shared/utils.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../shared/utils.js")>();
  return {
    ...actual,
    loadChatModel: vi.fn(),
  };
});

const mockedLoadChatModel = vi.mocked(
  (await import("../../shared/utils.js")).loadChatModel,
);

afterEach(() => {
  vi.unstubAllEnvs();
  mockedLoadChatModel.mockReset();
});

describe("formatDocsAsString", () => {
  it("formats docs with source metadata", () => {
    const docs = [
      {
        pageContent: "Hemoglobin is a protein in red blood cells.",
        metadata: { sourceFile: "lab-report.pdf" },
      },
      {
        pageContent: "Normal range is 13-17 g/dL.",
        metadata: { sourceFile: "lab-report.pdf" },
      },
    ] as Document[];

    const out = formatDocsAsString(docs);
    expect(out).toContain("[1] Hemoglobin is a protein in red blood cells.");
    expect(out).toContain("Source: lab-report.pdf");
    expect(out).toContain("[2] Normal range is 13-17 g/dL.");
  });

  it("returns empty string for no docs", () => {
    expect(formatDocsAsString([])).toBe("");
  });
});

describe("formatMessagesToHistory", () => {
  it("formats Human and AI messages", () => {
    const out = formatMessagesToHistory([
      new HumanMessage("Ano ang WBC ko?"),
      new AIMessage("Ang iyong WBC ay normal."),
    ]);
    expect(out).toBe(
      "User: Ano ang WBC ko?\nAssistant: Ang iyong WBC ay normal.",
    );
  });

  it("does not produce 'Object:' garbage for AIMessage instances", () => {
    const out = formatMessagesToHistory([new AIMessage("plain answer")]);
    expect(out).toBe("Assistant: plain answer");
    expect(out).not.toContain("Object:");
  });
});

describe("generateAnswer", () => {
  it("returns a mock answer when ENABLE_MOCK_MODE is true", async () => {
    vi.stubEnv("ENABLE_MOCK_MODE", "true");
    const docs = [
      { pageContent: "Hemoglobin 13.2 g/dL", metadata: { sourceFile: "a" } },
    ] as Document[];

    const answer = await generateAnswer("What is my hemoglobin?", docs, [
      new HumanMessage("What is my hemoglobin?"),
    ]);

    expect(answer).toContain(
      'simulated response for: "What is my hemoglobin?"',
    );
    expect(answer).toContain("Hemoglobin 13.2 g/dL");
    expect(mockedLoadChatModel).not.toHaveBeenCalled();
  });
});

describe("generateFollowUpQuestions", () => {
  it("returns canned questions in mock mode", async () => {
    vi.stubEnv("ENABLE_MOCK_MODE", "true");
    const questions = await generateFollowUpQuestions([new HumanMessage("hi")]);
    expect(questions).toHaveLength(3);
    expect(mockedLoadChatModel).not.toHaveBeenCalled();
  });

  it("returns empty list when includeFollowUps is false", async () => {
    vi.stubEnv("ENABLE_MOCK_MODE", "true");
    const questions = await generateFollowUpQuestions(
      [new HumanMessage("hi")],
      { configurable: { includeFollowUps: false } },
    );
    expect(questions).toEqual([]);
  });

  it("returns [] instead of throwing when the model fails", async () => {
    vi.stubEnv("ENABLE_MOCK_MODE", "false");
    mockedLoadChatModel.mockRejectedValue(new Error("model exploded"));

    const questions = await generateFollowUpQuestions([new HumanMessage("hi")]);
    expect(questions).toEqual([]);
  });

  it("parses bullet-prefixed questions from model output", async () => {
    vi.stubEnv("ENABLE_MOCK_MODE", "false");
    mockedLoadChatModel.mockResolvedValue({
      pipe: () => ({
        invoke: async () =>
          "- What does WBC mean?\n- Should I retest?\nplain line",
      }),
    } as never);

    const questions = await generateFollowUpQuestions([
      new HumanMessage("Ano ang WBC ko?"),
    ]);
    expect(questions).toEqual(["What does WBC mean?", "Should I retest?"]);
  });
});

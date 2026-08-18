import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { afterEach, describe, expect, it, vi } from "vitest";

import { loadChatModel, resolveModelSpec } from "../utils.js";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("resolveModelSpec", () => {
  it("defaults to openai/gpt-4o-mini when nothing is configured", () => {
    vi.stubEnv("CHAT_MODEL", "");
    vi.stubEnv("LLM_PROVIDER", "");
    expect(resolveModelSpec()).toBe("openai/gpt-4o-mini");
  });

  it("prefers an explicit override", () => {
    vi.stubEnv("CHAT_MODEL", "openai/gpt-4o");
    expect(resolveModelSpec("gemini")).toBe("gemini");
  });

  it("uses CHAT_MODEL before LLM_PROVIDER", () => {
    vi.stubEnv("CHAT_MODEL", "openai/gpt-4o");
    vi.stubEnv("LLM_PROVIDER", "gemini");
    expect(resolveModelSpec()).toBe("openai/gpt-4o");
  });

  it("falls back to LLM_PROVIDER when CHAT_MODEL is unset", () => {
    vi.stubEnv("CHAT_MODEL", "");
    vi.stubEnv("LLM_PROVIDER", "gemini");
    expect(resolveModelSpec()).toBe("gemini");
  });
});

describe("loadChatModel", () => {
  it("resolves a bare 'gemini' alias to GoogleGenerativeAI", async () => {
    vi.stubEnv("GOOGLE_GENAI_API_KEY", "test-key");
    vi.stubEnv("CHAT_MODEL", "gemini");
    const model = await loadChatModel("gemini");
    expect(model).toBeInstanceOf(ChatGoogleGenerativeAI);
  });

  it("resolves a slash spec 'openai/gpt-4o' to ChatOpenAI", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const model = await loadChatModel("openai/gpt-4o");
    expect(model).toBeInstanceOf(ChatOpenAI);
  });

  it("resolves a bare model name to ChatOpenAI", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const model = await loadChatModel("gpt-4o-mini");
    expect(model).toBeInstanceOf(ChatOpenAI);
  });

  it("resolves 'google-genai' slash spec to GoogleGenerativeAI", async () => {
    vi.stubEnv("GOOGLE_GENAI_API_KEY", "test-key");
    const model = await loadChatModel("google-genai/gemini-2.0-flash");
    expect(model).toBeInstanceOf(ChatGoogleGenerativeAI);
  });

  it("falls back to ChatOpenAI for unknown providers", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const model = await loadChatModel("deepseek/deepseek-chat");
    expect(model).toBeInstanceOf(ChatOpenAI);
  });
});

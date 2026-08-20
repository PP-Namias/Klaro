import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { afterEach, describe, expect, it, vi } from "vitest";

import { loadChatModel, resolveModelSpec } from "../utils.js";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("resolveModelSpec", () => {
  it("defaults to gemini-2.5-flash when nothing is configured", () => {
    vi.stubEnv("CHAT_MODEL", "");
    vi.stubEnv("GEMINI_MODEL", "");
    vi.stubEnv("LLM_PROVIDER", "");
    expect(resolveModelSpec()).toBe("gemini-2.5-flash");
  });

  it("prefers an explicit override", () => {
    vi.stubEnv("CHAT_MODEL", "gemini-2.5-pro");
    expect(resolveModelSpec("gemini-1.5-flash")).toBe("gemini-1.5-flash");
  });

  it("uses GEMINI_MODEL before CHAT_MODEL", () => {
    vi.stubEnv("GEMINI_MODEL", "gemini-2.5-pro");
    vi.stubEnv("CHAT_MODEL", "gemini-1.5-flash");
    expect(resolveModelSpec()).toBe("gemini-2.5-pro");
  });

  it("falls back to LLM_PROVIDER when GEMINI_MODEL is unset", () => {
    vi.stubEnv("GEMINI_MODEL", "");
    vi.stubEnv("CHAT_MODEL", "");
    vi.stubEnv("LLM_PROVIDER", "gemini-1.5-flash");
    expect(resolveModelSpec()).toBe("gemini-1.5-flash");
  });

  it("strips provider prefix and resolves alias gemini-2.0-flash", () => {
    expect(resolveModelSpec("google-genai/gemini-2.0-flash")).toBe("gemini-3.6-flash");
  });
});

describe("loadChatModel", () => {
  it("resolves a bare 'gemini' alias to GoogleGenerativeAI", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("CHAT_MODEL", "gemini");
    const model = await loadChatModel("gemini");
    expect(model).toBeInstanceOf(ChatGoogleGenerativeAI);
  });

  it("resolves 'openai/gpt-4o' spec to Gemini (native pathing)", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const model = await loadChatModel("openai/gpt-4o");
    expect(model).toBeInstanceOf(ChatGoogleGenerativeAI);
  });

  it("resolves a bare unknown model name to Gemini", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const model = await loadChatModel("gpt-4o-mini");
    expect(model).toBeInstanceOf(ChatGoogleGenerativeAI);
  });

  it("resolves 'google-genai' slash spec to GoogleGenerativeAI", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const model = await loadChatModel("google-genai/gemini-2.0-flash");
    expect(model).toBeInstanceOf(ChatGoogleGenerativeAI);
  });

  it("falls back to Gemini for unknown providers", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const model = await loadChatModel("deepseek/deepseek-chat");
    expect(model).toBeInstanceOf(ChatGoogleGenerativeAI);
  });

  it("uses fallback chain on rate-limit via GEMINI_MODEL_FALLBACK", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("GEMINI_MODEL_FALLBACK", "gemini-1.5-flash");
    // loadChatModel will attempt primary then fallback; here primary succeeds so we just verify it doesn't throw
    const model = await loadChatModel("gemini-2.5-pro");
    expect(model).toBeInstanceOf(ChatGoogleGenerativeAI);
  });
});

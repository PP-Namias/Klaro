import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getDefaultLLMConfig } from "../llm";

/**
 * The LLM config was a module-level const, so it snapshotted process.env at
 * import time and read only LLM_API_KEY. The rest of the repo sets
 * GEMINI_API_KEY, so every call silently degraded to rule-based output.
 */
describe("getDefaultLLMConfig", () => {
  const original = { ...process.env };

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.LLM_API_KEY;
    delete process.env.LLM_PROVIDER;
    delete process.env.LLM_MODEL;
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it("picks up GEMINI_API_KEY, which is what the rest of the repo sets", () => {
    process.env.GEMINI_API_KEY = "gemini-key";

    expect(getDefaultLLMConfig().apiKey).toBe("gemini-key");
  });

  it("still honours LLM_API_KEY when no Gemini key is set", () => {
    process.env.LLM_API_KEY = "generic-key";

    expect(getDefaultLLMConfig().apiKey).toBe("generic-key");
  });

  it("reads the environment per call rather than at import time", () => {
    expect(getDefaultLLMConfig().apiKey).toBeUndefined();

    process.env.GEMINI_API_KEY = "set-later";

    // A module-level const would still report undefined here.
    expect(getDefaultLLMConfig().apiKey).toBe("set-later");
  });

  it("defaults to a current model per provider", () => {
    expect(getDefaultLLMConfig().model).toBe("gemini-2.0-flash");

    process.env.LLM_PROVIDER = "openai";
    expect(getDefaultLLMConfig().model).toBe("gpt-4o");

    process.env.LLM_PROVIDER = "claude";
    expect(getDefaultLLMConfig().model).toBe("claude-sonnet-4-5");
  });

  it("lets LLM_MODEL override the provider default", () => {
    process.env.LLM_MODEL = "custom-model";

    expect(getDefaultLLMConfig().model).toBe("custom-model");
  });
});

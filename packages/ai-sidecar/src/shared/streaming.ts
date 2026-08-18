import type { AIMessageChunk } from "@langchain/core/messages";

/**
 * Extract streamed text from an AIMessageChunk.
 * LangChain 0.3 chunks carry `content` as either a plain string or an array of
 * content blocks (Gemini always streams blocks, OpenAI uses them for tool
 * calls). Returns the concatenated text so token streaming works for every
 * provider.
 */
export function extractChunkText(chunk: AIMessageChunk | undefined): string {
  if (!chunk) return "";

  const content = chunk.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  return content
    .filter(
      (block): block is { type: "text"; text: string } =>
        typeof block === "object" &&
        block !== null &&
        block.type === "text" &&
        typeof block.text === "string",
    )
    .map((block) => block.text)
    .join("");
}

/**
 * Extract the answer text from a chain output object, accepting both a raw
 * string and `{ answer: string }` shapes.
 */
export function extractAnswerText(output: unknown): string | undefined {
  if (typeof output === "string") return output;
  if (output && typeof output === "object" && "answer" in output) {
    const answer = (output as { answer?: unknown }).answer;
    if (typeof answer === "string") return answer;
  }
  return undefined;
}

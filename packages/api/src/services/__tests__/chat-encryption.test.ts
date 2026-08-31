import { beforeAll, describe, expect, it } from "vitest";

import {
  decryptChatMessage,
  encryptChatMessage,
  isEncrypted,
} from "../encryption";

/**
 * Chat turns quote the patient's own document, so chat_message.content is
 * PHI-bearing and must be ciphertext at rest (RA 10173).
 */
describe("chat message encryption at rest", () => {
  beforeAll(() => {
    process.env.ENCRYPTION_MASTER_KEY =
      "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
    process.env.ENCRYPTION_KEY_VERSION = "1";
  });

  const plaintext =
    "Juan Dela Cruz, ano po ibig sabihin ng hemoglobin 11.2 g/dL?";

  it("stores content as ciphertext, not the original text", async () => {
    const stored = await encryptChatMessage(plaintext);

    expect(stored).not.toBe(plaintext);
    expect(stored).not.toContain("Juan Dela Cruz");
    expect(stored).not.toContain("hemoglobin");
    expect(isEncrypted(stored)).toBe(true);
  });

  it("round-trips back to the original plaintext", async () => {
    const stored = await encryptChatMessage(plaintext);
    await expect(decryptChatMessage(stored)).resolves.toBe(plaintext);
  });

  it("returns legacy plaintext rows unchanged", async () => {
    // Rows written before encryption was enabled must still be readable.
    await expect(decryptChatMessage("legacy plaintext row")).resolves.toBe(
      "legacy plaintext row",
    );
  });
});

import { describe, expect, it, beforeEach } from "vitest";

// Set encryption key for testing
process.env.ENCRYPTION_MASTER_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.ENCRYPTION_KEY_VERSION = "1";

import {
  encrypt,
  decrypt,
  encryptField,
  decryptField,
  encryptJson,
  decryptJson,
  isEncrypted,
  generateEncryptionKey,
  rotateEncryption,
} from "../encryption";

describe("Encryption Service", () => {
  describe("encrypt/decrypt", () => {
    it("encrypts and decrypts text correctly", async () => {
      const plaintext = "Hello, World!";
      const encrypted = await encrypt(plaintext);
      const decrypted = await decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("produces different ciphertext for same plaintext (random IV)", async () => {
      const plaintext = "Same text twice";
      const encrypted1 = await encrypt(plaintext);
      const encrypted2 = await encrypt(plaintext);

      // Different IVs should produce different ciphertext
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);

      // Both should decrypt to same plaintext
      const decrypted1 = await decrypt(encrypted1);
      const decrypted2 = await decrypt(encrypted2);
      expect(decrypted1).toBe(plaintext);
      expect(decrypted2).toBe(plaintext);
    });

    it("includes key version in encrypted data", async () => {
      const encrypted = await encrypt("test");
      expect(encrypted.keyVersion).toBe(1);
      expect(encrypted.encryptedAt).toBeDefined();
    });

    it("handles empty string", async () => {
      const encrypted = await encrypt("");
      const decrypted = await decrypt(encrypted);
      expect(decrypted).toBe("");
    });

    it("handles long text", async () => {
      const longText = "A".repeat(10000);
      const encrypted = await encrypt(longText);
      const decrypted = await decrypt(encrypted);
      expect(decrypted).toBe(longText);
    });

    it("handles special characters", async () => {
      const special = "Ñoño, café, résumé, 你好世界";
      const encrypted = await encrypt(special);
      const decrypted = await decrypt(encrypted);
      expect(decrypted).toBe(special);
    });

    it("handles medical data with PHI", async () => {
      const medicalData = "Patient: Juan Dela Cruz, DOB: 01/15/1990, MRN: 12345678";
      const encrypted = await encrypt(medicalData);
      const decrypted = await decrypt(encrypted);
      expect(decrypted).toBe(medicalData);
    });
  });

  describe("encryptField/decryptField", () => {
    it("encrypts string field", async () => {
      const value = "Sensitive medical data";
      const encrypted = await encryptField(value);

      expect(encrypted).not.toBe(value);
      expect(isEncrypted(encrypted!)).toBe(true);
    });

    it("decrypts string field", async () => {
      const value = "Sensitive medical data";
      const encrypted = await encryptField(value);
      const decrypted = await decryptField(encrypted);

      expect(decrypted).toBe(value);
    });

    it("handles null", async () => {
      const encrypted = await encryptField(null);
      expect(encrypted).toBeNull();

      const decrypted = await decryptField(null);
      expect(decrypted).toBeNull();
    });

    it("handles undefined", async () => {
      const encrypted = await encryptField(undefined);
      expect(encrypted).toBeUndefined();
    });

    it("handles empty string", async () => {
      const encrypted = await encryptField("");
      expect(encrypted).toBe("");

      const decrypted = await decryptField("");
      expect(decrypted).toBe("");
    });
  });

  describe("encryptJson/decryptJson", () => {
    it("encrypts JSON object", async () => {
      const data = { name: "Juan", age: 30, tests: ["Hemoglobin", "WBC"] };
      const encrypted = await encryptJson(data);

      expect(encrypted).not.toBe(JSON.stringify(data));
      expect(isEncrypted(encrypted!)).toBe(true);
    });

    it("decrypts JSON object", async () => {
      const data = { name: "Juan", age: 30, tests: ["Hemoglobin", "WBC"] };
      const encrypted = await encryptJson(data);
      const decrypted = await decryptJson(encrypted);

      expect(decrypted).toEqual(data);
    });

    it("handles null", async () => {
      const encrypted = await encryptJson(null);
      expect(encrypted).toBeNull();
    });

    it("handles complex nested objects", async () => {
      const data = {
        patient: {
          name: "Juan Dela Cruz",
          dob: "1990-01-15",
          results: [
            { name: "Hemoglobin", value: 12.5, flagged: false },
            { name: "WBC", value: 15000, flagged: true },
          ],
        },
      };
      const encrypted = await encryptJson(data);
      const decrypted = await decryptJson(encrypted);
      expect(decrypted).toEqual(data);
    });
  });

  describe("isEncrypted", () => {
    it("identifies encrypted data", async () => {
      const encrypted = await encrypt("test");
      const encryptedStr = JSON.stringify(encrypted);
      expect(isEncrypted(encryptedStr)).toBe(true);
    });

    it("identifies non-encrypted data", () => {
      expect(isEncrypted("plain text")).toBe(false);
      expect(isEncrypted('{"name": "value"}')).toBe(false);
      expect(isEncrypted("123")).toBe(false);
    });

    it("handles invalid JSON", () => {
      expect(isEncrypted("not json")).toBe(false);
    });
  });

  describe("generateEncryptionKey", () => {
    it("generates a valid hex key", () => {
      const key = generateEncryptionKey();
      expect(key).toMatch(/^[0-9a-f]{64}$/);
    });

    it("generates unique keys", () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe("rotateEncryption", () => {
    it("re-encrypts data with a new key", async () => {
      const original = "Sensitive patient data";
      const encrypted = await encrypt(original);
      const encryptedStr = JSON.stringify(encrypted);

      const newKey = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
      const reEncryptedStr = await rotateEncryption(encryptedStr, newKey);

      expect(reEncryptedStr).not.toBe(encryptedStr);

      const oldKey = process.env.ENCRYPTION_MASTER_KEY;
      process.env.ENCRYPTION_MASTER_KEY = newKey;
      try {
        const parsed = JSON.parse(reEncryptedStr);
        const decrypted = await decrypt(parsed);
        expect(decrypted).toBe(original);
      } finally {
        process.env.ENCRYPTION_MASTER_KEY = oldKey;
      }
    });

    it("old key cannot decrypt after rotation", async () => {
      const original = "Rotate me";
      const encrypted = await encrypt(original);
      const encryptedStr = JSON.stringify(encrypted);

      const newKey = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
      const reEncryptedStr = await rotateEncryption(encryptedStr, newKey);

      // Old key should NOT be able to decrypt new ciphertext
      await expect(async () => {
        const parsed = JSON.parse(reEncryptedStr);
        await decrypt(parsed);
      }).rejects.toThrow();
    });
  });

  describe("Error Handling", () => {
    it("throws on invalid encrypted data", async () => {
      const invalid = {
        encrypted: "invalid",
        iv: "invalid",
        tag: "invalid",
        keyVersion: 1,
        encryptedAt: "2024-01-01T00:00:00.000Z",
      };

      await expect(decrypt(invalid)).rejects.toThrow();
    });

    it("throws on tampered data", async () => {
      const encrypted = await encrypt("test data");
      // Tamper with the encrypted data
      encrypted.encrypted = Buffer.from("tampered").toString("base64");

      await expect(decrypt(encrypted)).rejects.toThrow();
    });
  });
});

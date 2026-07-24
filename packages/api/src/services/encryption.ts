/**
 * Encryption Service
 *
 * HIPAA Technical Safeguard: Encryption at Rest (45 CFR 164.312(a)(2)(iv))
 *
 * Implements AES-256-GCM encryption for sensitive medical data.
 * Uses authenticated encryption to ensure data integrity.
 *
 * Features:
 * - AES-256-GCM encryption (authenticated encryption)
 * - Key rotation support
 * - Envelope encryption pattern
 * - Automatic IV generation
 * - Tag verification for integrity
 */

import { createCipheriv, createDecipheriv, randomBytes, scrypt } from "crypto";
import { promisify } from "util";

// ============================================================================
// Configuration
// ============================================================================

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;

const scryptAsync = promisify(scrypt);

export interface EncryptionConfig {
  /** Master encryption key (32 bytes hex) */
  masterKey: string;
  /** Key version for rotation */
  keyVersion: number;
  /** Algorithm to use */
  algorithm: string;
}

export interface EncryptedData {
  /** Encrypted content (base64) */
  encrypted: string;
  /** Initialization vector (base64) */
  iv: string;
  /** Authentication tag (base64) */
  tag: string;
  /** Key version used for encryption */
  keyVersion: number;
  /** Timestamp of encryption */
  encryptedAt: string;
}

// ============================================================================
// Key Management
// ============================================================================

function getMasterKey(): string {
  const key = process.env.ENCRYPTION_MASTER_KEY;
  if (!key) {
    throw new Error(
      "ENCRYPTION_MASTER_KEY environment variable is required. " +
        "Generate one with: openssl rand -hex 32",
    );
  }
  return key;
}

function getKeyVersion(): number {
  return parseInt(process.env.ENCRYPTION_KEY_VERSION || "1", 10);
}

function hexToBuffer(hex: string): Buffer {
  return Buffer.from(hex, "hex");
}

/**
 * Derive an encryption key from the master key using scrypt
 */
async function deriveKey(masterKey: Buffer, salt: Buffer): Promise<Buffer> {
  return scryptAsync(masterKey, salt, KEY_LENGTH) as Promise<Buffer>;
}

// ============================================================================
// Core Encryption Functions
// ============================================================================

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export async function encrypt(plaintext: string): Promise<EncryptedData> {
  const masterKey = hexToBuffer(getMasterKey());
  const keyVersion = getKeyVersion();

  // Generate random IV and salt
  const iv = randomBytes(IV_LENGTH);
  const salt = randomBytes(SALT_LENGTH);

  // Derive encryption key
  const key = await deriveKey(masterKey, salt);

  // Create cipher
  const cipher = createCipheriv(ALGORITHM, key, iv);

  // Encrypt
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  // Get authentication tag
  const tag = cipher.getAuthTag();

  // Combine salt + encrypted data for storage
  const combined = Buffer.concat([salt, encrypted]);

  return {
    encrypted: combined.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    keyVersion,
    encryptedAt: new Date().toISOString(),
  };
}

/**
 * Decrypt sensitive data using AES-256-GCM
 */
export async function decrypt(encryptedData: EncryptedData): Promise<string> {
  const masterKey = hexToBuffer(getMasterKey());

  // Decode base64 values
  const combined = Buffer.from(encryptedData.encrypted, "base64");
  const iv = Buffer.from(encryptedData.iv, "base64");
  const tag = Buffer.from(encryptedData.tag, "base64");

  // Extract salt (first SALT_LENGTH bytes)
  const salt = combined.subarray(0, SALT_LENGTH);
  const encrypted = combined.subarray(SALT_LENGTH);

  // Derive the same encryption key
  const key = await deriveKey(masterKey, salt);

  // Create decipher
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  // Decrypt
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Encrypt a string field (convenience wrapper)
 */
export async function encryptField(
  value: string | null,
): Promise<string | null> {
  if (value === null || value === undefined || value === "") {
    return value;
  }

  const encrypted = await encrypt(value);
  return JSON.stringify(encrypted);
}

/**
 * Decrypt a string field (convenience wrapper)
 */
export async function decryptField(
  encryptedValue: string | null,
): Promise<string | null> {
  if (
    encryptedValue === null ||
    encryptedValue === undefined ||
    encryptedValue === ""
  ) {
    return encryptedValue;
  }

  try {
    const parsed = JSON.parse(encryptedValue) as EncryptedData;
    return await decrypt(parsed);
  } catch {
    // If decryption fails, return original value (may be unencrypted legacy data)
    console.warn(
      "[Encryption] Failed to decrypt field, returning original value",
    );
    return encryptedValue;
  }
}

/**
 * Encrypt a JSON object (for jsonb fields)
 */
export async function encryptJson(
  value: Record<string, unknown> | null,
): Promise<string | null> {
  if (value === null || value === undefined) {
    return value as null;
  }

  const jsonString = JSON.stringify(value);
  const encrypted = await encrypt(jsonString);
  return JSON.stringify(encrypted);
}

/**
 * Decrypt a JSON object (from jsonb fields)
 */
export async function decryptJson<T = Record<string, unknown>>(
  encryptedValue: string | null,
): Promise<T | null> {
  if (
    encryptedValue === null ||
    encryptedValue === undefined ||
    encryptedValue === ""
  ) {
    return encryptedValue as null;
  }

  try {
    const parsed = JSON.parse(encryptedValue) as EncryptedData;
    const decrypted = await decrypt(parsed);
    return JSON.parse(decrypted) as T;
  } catch {
    console.warn(
      "[Encryption] Failed to decrypt JSON field, returning original",
    );
    try {
      return JSON.parse(encryptedValue) as T;
    } catch {
      return encryptedValue as unknown as T;
    }
  }
}

// ============================================================================
// Field-Specific Encryption Helpers
// ============================================================================

/**
 * Fields that should be encrypted in the database
 */
export const ENCRYPTED_FIELDS = {
  document: ["ocrText"],
  analysis: ["extractedFields", "plainLanguageSummary", "tanqmoCard"],
  chatMessage: ["content"],
} as const;

/**
 * Encrypt document fields before storage
 */
export async function encryptDocumentFields(doc: {
  ocrText?: string | null;
}): Promise<{
  ocrText?: string | null;
}> {
  return {
    ocrText: await encryptField(doc.ocrText ?? null),
  };
}

/**
 * Decrypt document fields after retrieval
 */
export async function decryptDocumentFields(doc: {
  ocrText?: string | null;
}): Promise<{
  ocrText?: string | null;
}> {
  return {
    ocrText: await decryptField(doc.ocrText ?? null),
  };
}

/**
 * Encrypt analysis fields before storage
 */
export async function encryptAnalysisFields(analysis: {
  extractedFields?: Record<string, unknown> | null;
  plainLanguageSummary?: string | null;
  tanqmoCard?: Record<string, unknown> | null;
}): Promise<{
  extractedFields?: string | null;
  plainLanguageSummary?: string | null;
  tanqmoCard?: string | null;
}> {
  return {
    extractedFields: await encryptJson(analysis.extractedFields ?? null),
    plainLanguageSummary: await encryptField(
      analysis.plainLanguageSummary ?? null,
    ),
    tanqmoCard: await encryptJson(analysis.tanqmoCard ?? null),
  };
}

/**
 * Decrypt analysis fields after retrieval
 */
export async function decryptAnalysisFields<
  T extends {
    extractedFields?: unknown;
    plainLanguageSummary?: unknown;
    tanqmoCard?: unknown;
  },
>(analysis: T): Promise<T> {
  return {
    ...analysis,
    extractedFields: await decryptJson(
      analysis.extractedFields as string | null,
    ),
    plainLanguageSummary: await decryptField(
      analysis.plainLanguageSummary as string | null,
    ),
    tanqmoCard: await decryptJson(analysis.tanqmoCard as string | null),
  };
}

/**
 * Encrypt chat message content before storage
 */
export async function encryptChatMessage(content: string): Promise<string> {
  return (await encryptField(content)) || content;
}

/**
 * Decrypt chat message content after retrieval
 */
export async function decryptChatMessage(content: string): Promise<string> {
  return (await decryptField(content)) || content;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a value is encrypted
 */
export function isEncrypted(value: string): boolean {
  try {
    const parsed = JSON.parse(value);
    return (
      typeof parsed === "object" &&
      "encrypted" in parsed &&
      "iv" in parsed &&
      "tag" in parsed &&
      "keyVersion" in parsed
    );
  } catch {
    return false;
  }
}

/**
 * Generate a new encryption key (for setup)
 */
export function generateEncryptionKey(): string {
  return randomBytes(KEY_LENGTH).toString("hex");
}

/**
 * Rotate encryption key (re-encrypt data with new key)
 * Returns the re-encrypted value
 */
export async function rotateEncryption(
  encryptedValue: string,
  newMasterKey: string,
): Promise<string> {
  // Decrypt with old key
  const parsed = JSON.parse(encryptedValue) as EncryptedData;
  const plaintext = await decrypt(parsed);

  // Temporarily set new master key
  const oldKey = process.env.ENCRYPTION_MASTER_KEY;
  process.env.ENCRYPTION_MASTER_KEY = newMasterKey;

  try {
    // Encrypt with new key
    const reEncrypted = await encrypt(plaintext);
    return JSON.stringify(reEncrypted);
  } finally {
    // Restore old key
    if (oldKey) {
      process.env.ENCRYPTION_MASTER_KEY = oldKey;
    }
  }
}

import { describe, expect, it } from "vitest";

import {
  ExtractedTestSchema,
  ExtractedTestsSchema,
  ExtractionResultSchema,
} from "../extraction";

describe("ExtractedTestSchema", () => {
  it("accepts valid test with name and value", () => {
    const result = ExtractedTestSchema.safeParse({
      name: "Hemoglobin",
      value: "14.5",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = ExtractedTestSchema.safeParse({
      name: "",
      value: "14.5",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty value", () => {
    const result = ExtractedTestSchema.safeParse({
      name: "Hemoglobin",
      value: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional unit", () => {
    const result = ExtractedTestSchema.safeParse({
      name: "Hemoglobin",
      value: "14.5",
      unit: "g/dL",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional referenceRange", () => {
    const result = ExtractedTestSchema.safeParse({
      name: "Hemoglobin",
      value: "14.5",
      referenceRange: "12-16",
    });
    expect(result.success).toBe(true);
  });

  it("defaults flagged to false", () => {
    const result = ExtractedTestSchema.safeParse({
      name: "Hemoglobin",
      value: "14.5",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.flagged).toBe(false);
    }
  });

  it("accepts flagged true", () => {
    const result = ExtractedTestSchema.safeParse({
      name: "Glucose",
      value: "200",
      flagged: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("ExtractedTestsSchema", () => {
  it("accepts empty array", () => {
    const result = ExtractedTestsSchema.safeParse([]);
    expect(result.success).toBe(true);
  });

  it("accepts array of valid tests", () => {
    const result = ExtractedTestsSchema.safeParse([
      { name: "Hemoglobin", value: "14.5" },
      { name: "WBC", value: "7.5" },
    ]);
    expect(result.success).toBe(true);
  });
});

describe("ExtractionResultSchema", () => {
  it("accepts valid result", () => {
    const result = ExtractionResultSchema.safeParse({
      documentId: "550e8400-e29b-41d4-a716-446655440000",
      tests: [{ name: "Hemoglobin", value: "14.5" }],
      accuracy: 0.95,
      processedAt: new Date(),
      method: "regex",
    });
    expect(result.success).toBe(true);
  });

  it("requires documentId as UUID", () => {
    const result = ExtractionResultSchema.safeParse({
      documentId: "not-a-uuid",
      tests: [],
      accuracy: 0.95,
      processedAt: new Date(),
      method: "regex",
    });
    expect(result.success).toBe(false);
  });

  it("accepts accuracy 0", () => {
    const result = ExtractionResultSchema.safeParse({
      documentId: "550e8400-e29b-41d4-a716-446655440000",
      tests: [],
      accuracy: 0,
      processedAt: new Date(),
      method: "llm",
    });
    expect(result.success).toBe(true);
  });

  it("accepts accuracy 1", () => {
    const result = ExtractionResultSchema.safeParse({
      documentId: "550e8400-e29b-41d4-a716-446655440000",
      tests: [],
      accuracy: 1,
      processedAt: new Date(),
      method: "hybrid",
    });
    expect(result.success).toBe(true);
  });

  it("rejects accuracy below 0", () => {
    const result = ExtractionResultSchema.safeParse({
      documentId: "550e8400-e29b-41d4-a716-446655440000",
      tests: [],
      accuracy: -0.1,
      processedAt: new Date(),
      method: "regex",
    });
    expect(result.success).toBe(false);
  });

  it("rejects accuracy above 1", () => {
    const result = ExtractionResultSchema.safeParse({
      documentId: "550e8400-e29b-41d4-a716-446655440000",
      tests: [],
      accuracy: 1.1,
      processedAt: new Date(),
      method: "regex",
    });
    expect(result.success).toBe(false);
  });

  it("accepts method regex", () => {
    const result = ExtractionResultSchema.safeParse({
      documentId: "550e8400-e29b-41d4-a716-446655440000",
      tests: [],
      accuracy: 0.9,
      processedAt: new Date(),
      method: "regex",
    });
    expect(result.success).toBe(true);
  });

  it("accepts method llm", () => {
    const result = ExtractionResultSchema.safeParse({
      documentId: "550e8400-e29b-41d4-a716-446655440000",
      tests: [],
      accuracy: 0.9,
      processedAt: new Date(),
      method: "llm",
    });
    expect(result.success).toBe(true);
  });

  it("accepts method hybrid", () => {
    const result = ExtractionResultSchema.safeParse({
      documentId: "550e8400-e29b-41d4-a716-446655440000",
      tests: [],
      accuracy: 0.9,
      processedAt: new Date(),
      method: "hybrid",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid method", () => {
    const result = ExtractionResultSchema.safeParse({
      documentId: "550e8400-e29b-41d4-a716-446655440000",
      tests: [],
      accuracy: 0.9,
      processedAt: new Date(),
      method: "manual",
    });
    expect(result.success).toBe(false);
  });
});

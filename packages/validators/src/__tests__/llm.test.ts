import { describe, expect, it } from "vitest";

import {
  DialectEnum,
  GenerateExplanationInputSchema,
  LLMResponseSchema,
  PlainLanguageAnalysisSchema,
  PromptTemplateSchema,
  SeverityEnum,
  TanongMoCardSchema,
  TestExplanationSchema,
} from "../llm";

describe("SeverityEnum", () => {
  it("accepts LOW", () => {
    expect(SeverityEnum.safeParse("LOW").success).toBe(true);
  });

  it("accepts MODERATE", () => {
    expect(SeverityEnum.safeParse("MODERATE").success).toBe(true);
  });

  it("accepts HIGH", () => {
    expect(SeverityEnum.safeParse("HIGH").success).toBe(true);
  });

  it("rejects invalid severity", () => {
    expect(SeverityEnum.safeParse("CRITICAL").success).toBe(false);
  });
});

describe("DialectEnum", () => {
  it("accepts Filipino", () => {
    expect(DialectEnum.safeParse("Filipino").success).toBe(true);
  });

  it("accepts Bisaya", () => {
    expect(DialectEnum.safeParse("Bisaya").success).toBe(true);
  });

  it("accepts Ilocano", () => {
    expect(DialectEnum.safeParse("Ilocano").success).toBe(true);
  });

  it("rejects invalid dialect", () => {
    expect(DialectEnum.safeParse("Tagalog").success).toBe(false);
  });
});

describe("TestExplanationSchema", () => {
  it("accepts valid explanation", () => {
    const result = TestExplanationSchema.safeParse({
      name: "Hemoglobin",
      interpretation: "Normal range",
    });
    expect(result.success).toBe(true);
  });

  it("requires name", () => {
    const result = TestExplanationSchema.safeParse({
      interpretation: "Normal range",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional value", () => {
    const result = TestExplanationSchema.safeParse({
      name: "Hemoglobin",
      value: "14.5",
      interpretation: "Normal range",
    });
    expect(result.success).toBe(true);
  });

  it("enforces 150 char max on interpretation", () => {
    const result = TestExplanationSchema.safeParse({
      name: "Hemoglobin",
      interpretation: "a".repeat(151),
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional recommendation", () => {
    const result = TestExplanationSchema.safeParse({
      name: "Hemoglobin",
      interpretation: "Normal range",
      recommendation: "Continue monitoring",
    });
    expect(result.success).toBe(true);
  });
});

describe("TanongMoCardSchema", () => {
  it("accepts valid card", () => {
    const result = TanongMoCardSchema.safeParse({
      title: "Itatanong Mo Sa Doktor",
      questions: ["What does this result mean?"],
      severity: "LOW",
    });
    expect(result.success).toBe(true);
  });

  it("requires at least 1 question", () => {
    const result = TanongMoCardSchema.safeParse({
      title: "Itatanong Mo Sa Doktor",
      questions: [],
      severity: "LOW",
    });
    expect(result.success).toBe(false);
  });

  it("allows max 5 questions", () => {
    const result = TanongMoCardSchema.safeParse({
      title: "Itatanong Mo Sa Doktor",
      questions: ["Q1", "Q2", "Q3", "Q4", "Q5"],
      severity: "LOW",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty questions array", () => {
    const result = TanongMoCardSchema.safeParse({
      title: "Itatanong Mo Sa Doktor",
      questions: [],
      severity: "HIGH",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional disclaimer", () => {
    const result = TanongMoCardSchema.safeParse({
      title: "Itatanong Mo Sa Doktor",
      questions: ["What should I do?"],
      severity: "HIGH",
      disclaimer: "This is not medical advice",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional bookingCta", () => {
    const result = TanongMoCardSchema.safeParse({
      title: "Itatanong Mo Sa Doktor",
      questions: ["Should I see a doctor?"],
      severity: "HIGH",
      bookingCta: "Book an appointment now",
    });
    expect(result.success).toBe(true);
  });
});

describe("PlainLanguageAnalysisSchema", () => {
  it("accepts valid analysis", () => {
    const result = PlainLanguageAnalysisSchema.safeParse({
      summary: "Your results look good",
      tests: [{ name: "Hemoglobin", interpretation: "Normal" }],
      tanqmo: {
        title: "Questions",
        questions: ["What does this mean?"],
        severity: "LOW",
      },
      severity: "LOW",
      dialect: "Filipino",
    });
    expect(result.success).toBe(true);
  });

  it("requires summary max 500 chars", () => {
    const result = PlainLanguageAnalysisSchema.safeParse({
      summary: "a".repeat(501),
      tests: [],
      tanqmo: {
        title: "Questions",
        questions: ["Q1"],
        severity: "LOW",
      },
      severity: "LOW",
      dialect: "Filipino",
    });
    expect(result.success).toBe(false);
  });

  it("requires tests array", () => {
    const result = PlainLanguageAnalysisSchema.safeParse({
      summary: "Summary",
      tanqmo: {
        title: "Questions",
        questions: ["Q1"],
        severity: "LOW",
      },
      severity: "LOW",
      dialect: "Filipino",
    });
    expect(result.success).toBe(false);
  });

  it("requires tanqmo card", () => {
    const result = PlainLanguageAnalysisSchema.safeParse({
      summary: "Summary",
      tests: [],
      severity: "LOW",
      dialect: "Filipino",
    });
    expect(result.success).toBe(false);
  });

  it("requires severity", () => {
    const result = PlainLanguageAnalysisSchema.safeParse({
      summary: "Summary",
      tests: [],
      tanqmo: {
        title: "Questions",
        questions: ["Q1"],
        severity: "LOW",
      },
      dialect: "Filipino",
    });
    expect(result.success).toBe(false);
  });

  it("requires dialect", () => {
    const result = PlainLanguageAnalysisSchema.safeParse({
      summary: "Summary",
      tests: [],
      tanqmo: {
        title: "Questions",
        questions: ["Q1"],
        severity: "LOW",
      },
      severity: "LOW",
    });
    expect(result.success).toBe(false);
  });
});

describe("GenerateExplanationInputSchema", () => {
  it("accepts valid input", () => {
    const result = GenerateExplanationInputSchema.safeParse({
      documentId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("requires documentId UUID", () => {
    const result = GenerateExplanationInputSchema.safeParse({
      documentId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("defaults dialect to Filipino", () => {
    const result = GenerateExplanationInputSchema.safeParse({
      documentId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dialect).toBe("Filipino");
    }
  });

  it("defaults includeDisclaimers to true", () => {
    const result = GenerateExplanationInputSchema.safeParse({
      documentId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.includeDisclaimers).toBe(true);
    }
  });
});

describe("LLMResponseSchema", () => {
  it("accepts valid response", () => {
    const result = LLMResponseSchema.safeParse({
      summary: "Your results are normal",
      tests: [],
      questionsForDoctor: [],
      severity: "LOW",
    });
    expect(result.success).toBe(true);
  });

  it("requires summary", () => {
    const result = LLMResponseSchema.safeParse({
      tests: [],
      questionsForDoctor: [],
      severity: "LOW",
    });
    expect(result.success).toBe(false);
  });

  it("requires tests array", () => {
    const result = LLMResponseSchema.safeParse({
      summary: "Summary",
      questionsForDoctor: [],
      severity: "LOW",
    });
    expect(result.success).toBe(false);
  });

  it("requires questionsForDoctor array", () => {
    const result = LLMResponseSchema.safeParse({
      summary: "Summary",
      tests: [],
      severity: "LOW",
    });
    expect(result.success).toBe(false);
  });

  it("requires severity", () => {
    const result = LLMResponseSchema.safeParse({
      summary: "Summary",
      tests: [],
      questionsForDoctor: [],
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional disclaimer", () => {
    const result = LLMResponseSchema.safeParse({
      summary: "Summary",
      tests: [],
      questionsForDoctor: [],
      severity: "HIGH",
      disclaimer: "Consult your doctor",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional bookingPrompt", () => {
    const result = LLMResponseSchema.safeParse({
      summary: "Summary",
      tests: [],
      questionsForDoctor: [],
      severity: "MODERATE",
      bookingPrompt: "Consider booking an appointment",
    });
    expect(result.success).toBe(true);
  });
});

describe("PromptTemplateSchema", () => {
  it("accepts valid template", () => {
    const result = PromptTemplateSchema.safeParse({
      id: "template-1",
      version: 1,
      dialect: "Filipino",
      name: "Lab Results Template",
      created: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it("requires id and version", () => {
    const result = PromptTemplateSchema.safeParse({
      dialect: "Filipino",
      name: "Template",
      created: new Date(),
    });
    expect(result.success).toBe(false);
  });

  it("defaults active to true", () => {
    const result = PromptTemplateSchema.safeParse({
      id: "template-1",
      version: 1,
      dialect: "Filipino",
      name: "Template",
      created: new Date(),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.active).toBe(true);
    }
  });
});

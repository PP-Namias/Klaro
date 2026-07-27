import { describe, expect, it } from "vitest";

import {
  aiScanAnalysisSchema,
  analyzeScanInputSchema,
  DialectEnum,
  documentSchema,
  documentStatusEnum,
  ExtractedTestSchema,
  ExtractedTestsSchema,
  ExtractionResultSchema,
  facilityResponseSchema,
  facilityTypeEnum,
  facilityTypeOrder,
  facilityTypeRank,
  GenerateExplanationInputSchema,
  LLMResponseSchema,
  logoutResponseSchema,
  medicalContextSchema,
  PlainLanguageAnalysisSchema,
  PromptTemplateSchema,
  recommendByTestResultsSchema,
  scanGuestAnalysisSchema,
  scanGuestInputSchema,
  scanGuestResponseSchema,
  scanLanguageSchema,
  scanStatusSchema,
  scanUrgencySchema,
  searchNearbySchema,
  sessionSchema,
  SeverityEnum,
  signInInputSchema,
  TanongMoCardSchema,
  TestExplanationSchema,
  uploadDocumentInputSchema,
  uploadDocumentResponseSchema,
  uploadResponseSchema,
} from "../index";

describe("index re-exports auth schemas", () => {
  it("exports signInInputSchema", () => {
    expect(signInInputSchema).toBeDefined();
  });

  it("exports sessionSchema", () => {
    expect(sessionSchema).toBeDefined();
  });

  it("exports logoutResponseSchema", () => {
    expect(logoutResponseSchema).toBeDefined();
  });
});

describe("index re-exports extraction schemas", () => {
  it("exports ExtractedTestSchema", () => {
    expect(ExtractedTestSchema).toBeDefined();
  });

  it("exports ExtractedTestsSchema", () => {
    expect(ExtractedTestsSchema).toBeDefined();
  });

  it("exports ExtractionResultSchema", () => {
    expect(ExtractionResultSchema).toBeDefined();
  });
});

describe("index re-exports LLM schemas", () => {
  it("exports SeverityEnum", () => {
    expect(SeverityEnum).toBeDefined();
  });

  it("exports DialectEnum", () => {
    expect(DialectEnum).toBeDefined();
  });

  it("exports TestExplanationSchema", () => {
    expect(TestExplanationSchema).toBeDefined();
  });

  it("exports TanongMoCardSchema", () => {
    expect(TanongMoCardSchema).toBeDefined();
  });

  it("exports PlainLanguageAnalysisSchema", () => {
    expect(PlainLanguageAnalysisSchema).toBeDefined();
  });

  it("exports GenerateExplanationInputSchema", () => {
    expect(GenerateExplanationInputSchema).toBeDefined();
  });

  it("exports LLMResponseSchema", () => {
    expect(LLMResponseSchema).toBeDefined();
  });

  it("exports PromptTemplateSchema", () => {
    expect(PromptTemplateSchema).toBeDefined();
  });
});

describe("index re-exports document schemas", () => {
  it("exports uploadDocumentInputSchema", () => {
    expect(uploadDocumentInputSchema).toBeDefined();
  });

  it("exports documentSchema", () => {
    expect(documentSchema).toBeDefined();
  });

  it("exports documentStatusEnum", () => {
    expect(documentStatusEnum).toBeDefined();
  });

  it("exports uploadResponseSchema", () => {
    expect(uploadResponseSchema).toBeDefined();
  });

  it("exports uploadDocumentResponseSchema", () => {
    expect(uploadDocumentResponseSchema).toBeDefined();
  });
});

describe("index re-exports facility schemas", () => {
  it("exports facilityTypeEnum", () => {
    expect(facilityTypeEnum).toBeDefined();
  });

  it("exports facilityTypeOrder", () => {
    expect(facilityTypeOrder).toBeDefined();
  });

  it("exports facilityTypeRank", () => {
    expect(typeof facilityTypeRank).toBe("function");
  });

  it("exports searchNearbySchema", () => {
    expect(searchNearbySchema).toBeDefined();
  });

  it("exports medicalContextSchema", () => {
    expect(medicalContextSchema).toBeDefined();
  });

  it("exports recommendByTestResultsSchema", () => {
    expect(recommendByTestResultsSchema).toBeDefined();
  });

  it("exports facilityResponseSchema", () => {
    expect(facilityResponseSchema).toBeDefined();
  });
});

describe("index re-exports scan-analysis schemas", () => {
  it("exports aiScanAnalysisSchema", () => {
    expect(aiScanAnalysisSchema).toBeDefined();
  });

  it("exports analyzeScanInputSchema", () => {
    expect(analyzeScanInputSchema).toBeDefined();
  });

  it("exports scanUrgencySchema", () => {
    expect(scanUrgencySchema).toBeDefined();
  });

  it("exports scanLanguageSchema", () => {
    expect(scanLanguageSchema).toBeDefined();
  });

  it("exports scanStatusSchema", () => {
    expect(scanStatusSchema).toBeDefined();
  });

  it("exports scanGuestInputSchema", () => {
    expect(scanGuestInputSchema).toBeDefined();
  });

  it("exports scanGuestAnalysisSchema", () => {
    expect(scanGuestAnalysisSchema).toBeDefined();
  });

  it("exports scanGuestResponseSchema", () => {
    expect(scanGuestResponseSchema).toBeDefined();
  });
});

describe("index re-exports work correctly", () => {
  it("signInInputSchema validates data", () => {
    const result = signInInputSchema.safeParse({ provider: "discord" });
    expect(result.success).toBe(true);
  });

  it("SeverityEnum validates data", () => {
    const result = SeverityEnum.safeParse("LOW");
    expect(result.success).toBe(true);
  });

  it("facilityTypeEnum validates data", () => {
    const result = facilityTypeEnum.safeParse("hospital");
    expect(result.success).toBe(true);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_WORKFLOW_CONFIG,
  executeDocumentWorkflow,
  executeGuestWorkflow,
  getWorkflowStatus,
  validateWorkflowInput,
} from "../ai-workflow";

vi.mock("../llm", () => ({
  generatePlainLanguageExplanation: vi.fn().mockResolvedValue({
    summary: "Your results look normal overall.",
    tests: [
      {
        name: "Hemoglobin",
        value: "14.5",
        interpretation: "Normal range",
        recommendation: "Continue healthy habits",
      },
    ],
    severity: "NORMAL",
    questionsForDoctor: ["Is my hemoglobin level healthy?"],
    disclaimer: "This is not medical advice.",
    bookingPrompt: "Book a consultation",
  }),
}));

vi.mock("../ocr", () => ({
  performOcrWithFallback: vi.fn().mockResolvedValue({
    result: {
      text: "Hemoglobin: 14.5 g/dL (12-16)",
      confidence: 0.95,
      source: "local",
    },
    audit: { usedCloudFallback: false },
  }),
}));

describe("DEFAULT_WORKFLOW_CONFIG", () => {
  it("has correct default values", () => {
    expect(DEFAULT_WORKFLOW_CONFIG).toEqual({
      useGeminiVision: true,
      ocrThreshold: 0.7,
      dialect: "Filipino",
      parallelProcessing: true,
    });
  });

  it("has ocrThreshold as a number between 0 and 1", () => {
    expect(DEFAULT_WORKFLOW_CONFIG.ocrThreshold).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_WORKFLOW_CONFIG.ocrThreshold).toBeLessThanOrEqual(1);
  });

  it("has valid dialect", () => {
    expect(["Filipino", "English", "Bisaya"]).toContain(
      DEFAULT_WORKFLOW_CONFIG.dialect,
    );
  });
});

describe("validateWorkflowInput", () => {
  it("returns valid for proper input", () => {
    const result = validateWorkflowInput([
      { buffer: Buffer.from("test"), filename: "lab.png" },
    ]);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("returns error for empty images", () => {
    const result = validateWorkflowInput([]);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("At least one image is required");
  });

  it("returns error for more than 20 images", () => {
    const images = Array.from({ length: 21 }, (_, i) => ({
      buffer: Buffer.from("test"),
      filename: `lab${i}.png`,
    }));
    const result = validateWorkflowInput(images);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Maximum 20 images allowed per workflow");
  });

  it("returns error for missing filename", () => {
    const result = validateWorkflowInput([
      { buffer: Buffer.from("test"), filename: "" },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Filename is required for all images");
  });

  it("accepts exactly 20 images", () => {
    const images = Array.from({ length: 20 }, (_, i) => ({
      buffer: Buffer.from("test"),
      filename: `lab${i}.png`,
    }));
    const result = validateWorkflowInput(images);
    expect(result.valid).toBe(true);
  });

  it("returns error for file exceeding 50MB limit", () => {
    const largeBuffer = Buffer.alloc(50 * 1024 * 1024 + 1);
    const result = validateWorkflowInput([
      { buffer: largeBuffer, filename: "large.png" },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("50MB limit"))).toBe(true);
  });

  it("accepts buffer exactly at 50MB", () => {
    const exactBuffer = Buffer.alloc(50 * 1024 * 1024);
    const result = validateWorkflowInput([
      { buffer: exactBuffer, filename: "exact.png" },
    ]);
    expect(result.valid).toBe(true);
  });

  it("validates multiple images", () => {
    const result = validateWorkflowInput([
      { buffer: Buffer.from("test"), filename: "lab1.png" },
      { buffer: Buffer.from("test"), filename: "" },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Filename is required for all images");
  });

  it("accepts images without buffer", () => {
    const result = validateWorkflowInput([{ filename: "lab.png" }]);
    expect(result.valid).toBe(true);
  });
});

describe("executeDocumentWorkflow", () => {
  it("returns completed status on success", async () => {
    const images = [
      {
        buffer: Buffer.from("test"),
        filename: "lab.png",
        mimeType: "image/png",
      },
    ];
    const result = await executeDocumentWorkflow(images);
    expect(result.status).toBe("completed");
  });

  it("returns requestId", async () => {
    const images = [{ buffer: Buffer.from("test"), filename: "lab.png" }];
    const result = await executeDocumentWorkflow(images);
    expect(result.requestId).toMatch(/^workflow-\d+-[a-z0-9]+$/);
  });

  it("populates extracted tests from OCR text", async () => {
    const images = [{ buffer: Buffer.from("test"), filename: "lab.png" }];
    const result = await executeDocumentWorkflow(images);
    expect(result.extractedTests).toBeDefined();
    expect(Array.isArray(result.extractedTests)).toBe(true);
  });

  it("populates flagged tests", async () => {
    const images = [{ buffer: Buffer.from("test"), filename: "lab.png" }];
    const result = await executeDocumentWorkflow(images);
    expect(result.flaggedTests).toBeDefined();
    expect(Array.isArray(result.flaggedTests)).toBe(true);
  });

  it("populates plainLanguage", async () => {
    const images = [{ buffer: Buffer.from("test"), filename: "lab.png" }];
    const result = await executeDocumentWorkflow(images);
    expect(result.plainLanguage).toBeDefined();
    expect(result.plainLanguage.summary).toBeTruthy();
    expect(result.plainLanguage.severity).toBeTruthy();
  });

  it("populates tanqmoCard", async () => {
    const images = [{ buffer: Buffer.from("test"), filename: "lab.png" }];
    const result = await executeDocumentWorkflow(images);
    expect(result.tanqmoCard).toBeDefined();
    expect(result.tanqmoCard.title).toBeTruthy();
    expect(Array.isArray(result.tanqmoCard.questions)).toBe(true);
  });

  it("populates metadata", async () => {
    const images = [{ buffer: Buffer.from("test"), filename: "lab.png" }];
    const result = await executeDocumentWorkflow(images);
    expect(result.metadata).toBeDefined();
    expect(result.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.metadata.imageCount).toBe(1);
  });

  it("accepts custom config", async () => {
    const images = [{ buffer: Buffer.from("test"), filename: "lab.png" }];
    const result = await executeDocumentWorkflow(images, {
      dialect: "English",
      ocrThreshold: 0.9,
    });
    expect(result.status).toBe("completed");
  });

  it("handles multiple images", async () => {
    const images = [
      { buffer: Buffer.from("test1"), filename: "lab1.png" },
      { buffer: Buffer.from("test2"), filename: "lab2.png" },
    ];
    const result = await executeDocumentWorkflow(images);
    expect(result.metadata.imageCount).toBe(2);
  });

  it("catches OCR errors and returns warnings", async () => {
    const images = [{ buffer: Buffer.from("test"), filename: "lab.png" }];
    const result = await executeDocumentWorkflow(images);
    expect(result.warnings).toBeDefined();
  });
});

describe("executeGuestWorkflow", () => {
  it("returns completed status", async () => {
    const base64Images = [
      {
        bytesBase64: Buffer.from("test").toString("base64"),
        filename: "lab.png",
      },
    ];
    const result = await executeGuestWorkflow(base64Images);
    expect(result.status).toBe("completed");
  });

  it("accepts language option", async () => {
    const base64Images = [
      {
        bytesBase64: Buffer.from("test").toString("base64"),
        filename: "lab.png",
      },
    ];
    const result = await executeGuestWorkflow(base64Images, {
      language: "Filipino",
    });
    expect(result.status).toBe("completed");
  });

  it("accepts patient info", async () => {
    const base64Images = [
      {
        bytesBase64: Buffer.from("test").toString("base64"),
        filename: "lab.png",
      },
    ];
    const result = await executeGuestWorkflow(base64Images, {
      patientAge: 30,
      patientSex: "male",
    });
    expect(result.status).toBe("completed");
  });
});

describe("getWorkflowStatus", () => {
  it("returns completed status", async () => {
    const result = await getWorkflowStatus("workflow-123-abc");
    expect(result.status).toBe("completed");
    expect(result.progress).toBe(100);
  });
});

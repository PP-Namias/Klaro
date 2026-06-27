import { describe, expect, it } from "vitest";

import {
  createClaraMessage,
  buildClaraSystemPrompt,
  shouldRespondToMessage,
  formatClaraResponse,
  buildPatientDataSummary,
  validateClaraMessage,
} from "../claraChat";

describe("Clara Chat Service", () => {
  describe("createClaraMessage", () => {
    it("creates message with correct type", () => {
      const msg = createClaraMessage("user", "Hello");
      expect(msg.type).toBe("user");
      expect(msg.content).toBe("Hello");
      expect(msg.id).toMatch(/^msg-/);
    });

    it("creates message with document ID", () => {
      const msg = createClaraMessage("clara", "Response", "doc-1");
      expect(msg.documentId).toBe("doc-1");
    });

    it("creates message with language", () => {
      const msg = createClaraMessage("clara", "Sagot", undefined, "fil");
      expect(msg.language).toBe("fil");
    });

    it("generates unique IDs", () => {
      const msg1 = createClaraMessage("user", "a");
      const msg2 = createClaraMessage("user", "b");
      expect(msg1.id).not.toBe(msg2.id);
    });
  });

  describe("buildClaraSystemPrompt", () => {
    it("builds prompt with patient data", () => {
      const prompt = buildClaraSystemPrompt({
        documentId: "doc-1",
        patientData: { patientName: "John", diagnosis: ["Hypertension"] },
      });

      expect(prompt).toContain("Clara");
      expect(prompt).toContain("John");
      expect(prompt).toContain("Hypertension");
    });

    it("includes language instruction for non-English", () => {
      const prompt = buildClaraSystemPrompt({
        documentId: "doc-1",
        language: "fil",
      });

      expect(prompt).toContain("fil");
    });

    it("omits language instruction for English", () => {
      const prompt = buildClaraSystemPrompt({
        documentId: "doc-1",
        language: "en",
      });

      expect(prompt).not.toContain("Respond in");
    });

    it("handles empty patient data", () => {
      const prompt = buildClaraSystemPrompt({ documentId: "doc-1" });
      expect(prompt).toContain("Clara");
    });
  });

  describe("shouldRespondToMessage", () => {
    it("responds to health keywords", () => {
      expect(shouldRespondToMessage("What is my diagnosis?")).toBe(true);
      expect(shouldRespondToMessage("Tell me about my medications")).toBe(true);
      expect(shouldRespondToMessage("My blood pressure results")).toBe(true);
    });

    it("responds to questions", () => {
      expect(shouldRespondToMessage("What does this mean?")).toBe(true);
    });

    it("responds to greetings", () => {
      expect(shouldRespondToMessage("Hello")).toBe(true);
      expect(shouldRespondToMessage("Hi")).toBe(true);
    });

    it("rejects messages too short", () => {
      expect(shouldRespondToMessage("x")).toBe(false);
      expect(shouldRespondToMessage("")).toBe(false);
    });

    it("rejects irrelevant messages", () => {
      expect(shouldRespondToMessage("the weather is nice today")).toBe(false);
      expect(shouldRespondToMessage("I like pizza")).toBe(false);
    });
  });

  describe("formatClaraResponse", () => {
    it("formats response with confidence", () => {
      const response = formatClaraResponse("Your BP is normal", 0.9);
      expect(response.message.content).toBe("Your BP is normal");
      expect(response.confidence).toBe(0.9);
      expect(response.message.type).toBe("clara");
    });
  });

  describe("buildPatientDataSummary", () => {
    it("builds summary with all fields", () => {
      const summary = buildPatientDataSummary({
        patientName: "John",
        dateOfBirth: "1990-01-01",
        diagnosis: ["Hypertension"],
        medications: [{ name: "Amlodipine", dosage: "5mg" }],
      });

      expect(summary).toContain("John");
      expect(summary).toContain("1990-01-01");
      expect(summary).toContain("Hypertension");
      expect(summary).toContain("Amlodipine 5mg");
    });

    it("handles partial data", () => {
      const summary = buildPatientDataSummary({ patientName: "John" });
      expect(summary).toContain("John");
      expect(summary).not.toContain("|");
    });

    it("returns empty string for empty data", () => {
      const summary = buildPatientDataSummary({});
      expect(summary).toBe("");
    });
  });

  describe("validateClaraMessage", () => {
    it("returns no errors for valid message", () => {
      const errors = validateClaraMessage("What is my diagnosis?");
      expect(errors).toHaveLength(0);
    });

    it("returns error for empty message", () => {
      const errors = validateClaraMessage("");
      expect(errors.length).toBeGreaterThan(0);
    });

    it("returns error for too long message", () => {
      const errors = validateClaraMessage("a".repeat(2001));
      expect(errors.some((e) => e.includes("too long"))).toBe(true);
    });

    it("returns error for invalid characters", () => {
      const errors = validateClaraMessage("Hello <script>alert('xss')</script>");
      expect(errors.some((e) => e.includes("invalid characters"))).toBe(true);
    });
  });
});

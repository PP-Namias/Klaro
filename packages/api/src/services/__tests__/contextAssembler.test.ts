import { describe, expect, it } from "vitest";

import assembleDocumentContext from "../contextAssembler";

describe("Context Assembler", () => {
  it("assembles extracted fields", () => {
    const context = assembleDocumentContext({
      extractedFields: { patientName: "John", diagnosis: ["Hypertension"] },
    });
    expect(context).toContain("Patient results");
    expect(context).toContain("John");
  });

  it("assembles plain language summary", () => {
    const context = assembleDocumentContext({
      plainLanguageSummary: "Patient has high blood pressure",
    });
    expect(context).toContain("Analysis summary");
    expect(context).toContain("high blood pressure");
  });

  it("assembles conversation history", () => {
    const context = assembleDocumentContext(
      {},
      [
        { role: "user", content: "What is my diagnosis?" },
        { role: "assistant", content: "You have hypertension" },
      ],
    );
    expect(context).toContain("Recent conversation");
    expect(context).toContain("user: What is my diagnosis?");
  });

  it("combines all parts", () => {
    const context = assembleDocumentContext(
      {
        extractedFields: { patientName: "John" },
        plainLanguageSummary: "Summary here",
      },
      [{ role: "user", content: "Hello" }],
    );
    expect(context).toContain("Patient results");
    expect(context).toContain("Analysis summary");
    expect(context).toContain("Recent conversation");
  });

  it("handles empty analysis", () => {
    const context = assembleDocumentContext({});
    expect(context).toBe("");
  });

  it("limits conversation history", () => {
    const messages = Array(10).fill({ role: "user", content: "message" });
    const context = assembleDocumentContext({}, messages);
    expect(context).toContain("Recent conversation");
  });
});

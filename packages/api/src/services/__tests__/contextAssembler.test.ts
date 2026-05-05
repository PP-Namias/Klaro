import { assembleDocumentContext } from "../contextAssembler";

describe("Context assembler", () => {
  test("assembles fields, summary, and recent messages", () => {
    const analysis = {
      extractedFields: { Hemoglobin: "13.2 g/dL", WBC: "7.5 K/uL" },
      plainLanguageSummary: "Results mostly normal, slight anemia.",
    };

    const recent = [
      { role: "user", content: "I feel tired", dialect: "Filipino" },
      { role: "assistant", content: "Do you have any other symptoms?", dialect: "Filipino" },
    ];

    const ctx = assembleDocumentContext(analysis as any, recent as any);
    expect(ctx).toContain("Patient results:");
    expect(ctx).toContain("Analysis summary:");
    expect(ctx).toContain("Recent conversation:");
  });
});

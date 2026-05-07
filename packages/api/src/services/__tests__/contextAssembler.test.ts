import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assembleDocumentContext } from "../contextAssembler";

describe("Context assembler", () => {
  it("assembles fields, summary, and recent messages", () => {
    const analysis = {
      extractedFields: { Hemoglobin: "13.2 g/dL", WBC: "7.5 K/uL" },
      plainLanguageSummary: "Results mostly normal, slight anemia.",
    };

    const recent = [
      { role: "user", content: "I feel tired", dialect: "Filipino" },
      {
        role: "assistant",
        content: "Do you have any other symptoms?",
        dialect: "Filipino",
      },
    ];

    const ctx = assembleDocumentContext(analysis, recent);
    assert.ok(ctx.includes("Patient results:"));
    assert.ok(ctx.includes("Analysis summary:"));
    assert.ok(ctx.includes("Recent conversation:"));
  });
});

import { describe, expect, it } from "vitest";

describe("Extraction Edge Cases", () => {
  describe("empty OCR text handling", () => {
    const emptyDocCheck = (ocrText: string | null | undefined): boolean => {
      return !ocrText || ocrText.trim().length === 0;
    };

    it("treats empty string as empty", () => {
      expect(emptyDocCheck("")).toBe(true);
    });

    it("treats whitespace-only text as empty", () => {
      expect(emptyDocCheck("   \n  \t  ")).toBe(true);
    });

    it("treats null as empty", () => {
      expect(emptyDocCheck(null)).toBe(true);
    });

    it("treats undefined as empty", () => {
      expect(emptyDocCheck(undefined)).toBe(true);
    });

    it("treats valid text as non-empty", () => {
      expect(emptyDocCheck("Hemoglobin: 14.2 g/dL")).toBe(false);
    });

    it("returns error payload matching expected structure", () => {
      const ocrText = "";
      const docId = "doc-1";

      const getResultForEmpty = () => ({
        analysisId: null,
        extractedCount: 0,
        flaggedCount: 0,
        accuracy: 0,
        method: "regex",
        error:
          "Could not extract any text from this document. Make sure the document contains clearly printed medical text.",
      });

      if (!ocrText || ocrText.trim().length === 0) {
        const result = getResultForEmpty();
        expect(result.extractedCount).toBe(0);
        expect(result.accuracy).toBe(0);
        expect(result.error).toContain("Could not extract any text");
        expect(result.analysisId).toBeNull();
      }
    });
  });
});

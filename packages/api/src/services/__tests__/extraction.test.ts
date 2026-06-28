import { describe, it, expect } from "vitest";
import { extractTestsFromText } from "../extraction";

describe("extractTestsFromText", () => {
  it("parses 'Hemoglobin: 14.5 g/dL (12-16)'", () => {
    const result = extractTestsFromText("Hemoglobin: 14.5 g/dL (12-16)");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: "Hemoglobin",
      value: "14.5",
      unit: "g/dL",
      referenceRange: "12-16",
      flagged: false,
    });
  });

  it("parses 'WBC: 7.5 /uL (4.5-11.0)'", () => {
    const result = extractTestsFromText("WBC: 7.5 /uL (4.5-11.0)");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("White Blood Cell Count");
    expect(result[0].value).toBe("7.5");
  });

  it("parses 'Platelets: 250 /uL (150-400)'", () => {
    const result = extractTestsFromText("Platelets: 250 /uL (150-400)");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Platelet Count");
    expect(result[0].value).toBe("250");
  });

  it("parses 'Glucose: 110 mg/dL (70-100)' flagged", () => {
    const result = extractTestsFromText("Glucose: 110 mg/dL (70-100)");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: "Fasting Blood Glucose",
      value: "110",
      unit: "mg/dL",
      referenceRange: "70-100",
      flagged: true,
    });
  });

  it("parses 'Creatinine: 1.2 mg/dL (0.6-1.2)'", () => {
    const result = extractTestsFromText("Creatinine: 1.2 mg/dL (0.6-1.2)");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: "Creatinine",
      value: "1.2",
      unit: "mg/dL",
      referenceRange: "0.6-1.2",
      flagged: false,
    });
  });

  it("parses 'Total Cholesterol: 240 mg/dL (100-200)' flagged", () => {
    const result = extractTestsFromText(
      "Total Cholesterol: 240 mg/dL (100-200)",
    );
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Total Cholesterol");
    expect(result[0].flagged).toBe(true);
  });

  it("parses 'HDL: 55 mg/dL (40-60)'", () => {
    const result = extractTestsFromText("HDL: 55 mg/dL (40-60)");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("HDL Cholesterol");
    expect(result[0].flagged).toBe(false);
  });

  it("parses 'LDL: 160 mg/dL (0-130)' flagged", () => {
    const result = extractTestsFromText("LDL: 160 mg/dL (0-130)");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("LDL Cholesterol");
    expect(result[0].flagged).toBe(true);
  });

  it("parses 'Triglycerides: 180 mg/dL (0-150)' flagged", () => {
    const result = extractTestsFromText(
      "Triglycerides: 180 mg/dL (0-150)",
    );
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Triglycerides");
    expect(result[0].flagged).toBe(true);
  });

  it("parses 'TSH: 2.5 uIU/mL (0.4-4.0)'", () => {
    const result = extractTestsFromText("TSH: 2.5 uIU/mL (0.4-4.0)");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: "TSH",
      value: "2.5",
      unit: "uIU/mL",
      referenceRange: "0.4-4.0",
      flagged: false,
    });
  });

  it("parses 'BUN: 18 mg/dL (7-20)'", () => {
    const result = extractTestsFromText("BUN: 18 mg/dL (7-20)");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: "Blood Urea Nitrogen",
      value: "18",
      unit: "mg/dL",
      referenceRange: "7-20",
      flagged: false,
    });
  });

  it("parses 'Sodium: 140 mEq/L (136-145)'", () => {
    const result = extractTestsFromText("Sodium: 140 mEq/L (136-145)");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: "Sodium",
      value: "140",
      unit: "mEq/L",
      referenceRange: "136-145",
      flagged: false,
    });
  });

  it("parses 'Potassium: 4.2 mEq/L (3.5-5.0)'", () => {
    const result = extractTestsFromText("Potassium: 4.2 mEq/L (3.5-5.0)");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: "Potassium",
      value: "4.2",
      unit: "mEq/L",
      referenceRange: "3.5-5.0",
      flagged: false,
    });
  });

  it("normalizes 'HGB' to 'Hemoglobin'", () => {
    const result = extractTestsFromText("HGB: 14.5 g/dL (12-16)");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Hemoglobin");
  });

  it("normalizes 'RBC' to 'Red Blood Cell Count'", () => {
    const result = extractTestsFromText("RBC: 4.5 M/uL (4.5-5.5)");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Red Blood Cell Count");
  });

  it("normalizes 'PLT' to 'Platelet Count'", () => {
    const result = extractTestsFromText("PLT: 250 /uL (150-400)");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Platelet Count");
  });

  it("normalizes 'FBG' to 'Fasting Blood Glucose'", () => {
    const result = extractTestsFromText("FBG: 110 mg/dL (70-100)");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Fasting Blood Glucose");
  });

  it("normalizes 'HBA1C' to 'Hemoglobin A1C' with pattern 3", () => {
    const result = extractTestsFromText("Hemoglobin A1C: 6.5 (4.0-5.6)");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Hemoglobin A1C");
  });

  it("returns empty array for empty text", () => {
    const result = extractTestsFromText("");
    expect(result).toHaveLength(0);
  });

  it("returns empty array for non-lab text", () => {
    const result = extractTestsFromText("This is not a lab result");
    expect(result).toHaveLength(0);
  });

  it("handles multiple lab lines", () => {
    const text = [
      "Hemoglobin: 14.5 g/dL (12-16)",
      "BUN: 18 mg/dL (7-20)",
      "Sodium: 140 mEq/L (136-145)",
    ].join("\n");
    const result = extractTestsFromText(text);
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe("Hemoglobin");
    expect(result[1].name).toBe("Blood Urea Nitrogen");
    expect(result[2].name).toBe("Sodium");
  });

  it("skips duplicate test names", () => {
    const text = [
      "Hemoglobin: 14.5 g/dL (12-16)",
      "Hemoglobin: 15.0 g/dL (12-16)",
    ].join("\n");
    const result = extractTestsFromText(text);
    expect(result).toHaveLength(1);
  });

  it("sets flagged true when value outside range", () => {
    const result = extractTestsFromText("Glucose: 200 mg/dL (70-100)");
    expect(result).toHaveLength(1);
    expect(result[0].flagged).toBe(true);
  });

  it("sets flagged false when value within range", () => {
    const result = extractTestsFromText("Glucose: 85 mg/dL (70-100)");
    expect(result).toHaveLength(1);
    expect(result[0].flagged).toBe(false);
  });

  it("handles missing reference range", () => {
    const result = extractTestsFromText("Hemoglobin: 14.5 g/dL");
    expect(result).toHaveLength(1);
    expect(result[0].referenceRange).toBeUndefined();
  });

  it("normalizes 'Bilirubin' to 'Total Bilirubin'", () => {
    const result = extractTestsFromText("Bilirubin: 0.8 mg/dL (0.1-1.2)");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Total Bilirubin");
  });

  it("normalizes 'ALP' to 'Alkaline Phosphatase'", () => {
    const result = extractTestsFromText("ALP: 70 U/L (44-147)");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Alkaline Phosphatase");
  });

  it("normalizes 'SGOT' to 'AST'", () => {
    const result = extractTestsFromText("SGOT: 25 U/L (10-40)");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("AST");
  });

  it("normalizes 'SGPT' to 'ALT'", () => {
    const result = extractTestsFromText("SGPT: 30 U/L (7-56)");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("ALT");
  });
});

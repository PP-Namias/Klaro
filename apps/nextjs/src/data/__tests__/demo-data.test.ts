import { describe, it, expect } from "vitest";

import { labResultsDemo } from "../demo-lab-results";
import { prescriptionDemo } from "../demo-prescriptions";
import { dischargeDemo } from "../demo-discharge";
import { xrayReportDemo, ecgReportDemo } from "../demo-other-docs";
import {
  getDemoData,
  getDemoTitle,
  getDemoDescription,
  demoData,
} from "../demo-index";

describe("Lab Results Demo Data", () => {
  it("has patient name", () => {
    expect(labResultsDemo.patientName).toBe("Juan Dela Cruz");
  });

  it("has patient age and sex", () => {
    expect(labResultsDemo.patientAge).toBe(52);
    expect(labResultsDemo.patientSex).toBe("Male");
  });

  it("has facility and physician", () => {
    expect(labResultsDemo.facilityName).toBeTruthy();
    expect(labResultsDemo.physician).toBeTruthy();
  });

  it("has summary in Filipino", () => {
    expect(labResultsDemo.summary.toLowerCase()).toContain("ito");
    expect(labResultsDemo.summary.length).toBeGreaterThan(50);
  });

  it("has urgency level", () => {
    expect(["LOW", "MODERATE", "HIGH"]).toContain(labResultsDemo.urgency);
  });

  it("has confidence between 0 and 1", () => {
    expect(labResultsDemo.confidence).toBeGreaterThan(0);
    expect(labResultsDemo.confidence).toBeLessThanOrEqual(1);
  });

  it("has 8 test results", () => {
    expect(labResultsDemo.tests).toHaveLength(8);
  });

  it("each test has required fields", () => {
    labResultsDemo.tests.forEach((test) => {
      expect(test.name).toBeTruthy();
      expect(test.value).toBeTruthy();
      expect(test.unit).toBeTruthy();
      expect(test.referenceRange).toBeTruthy();
      expect(typeof test.flagged).toBe("boolean");
      expect(test.interpretation).toBeTruthy();
    });
  });

  it("has flagged values", () => {
    const flagged = labResultsDemo.tests.filter((t) => t.flagged);
    expect(flagged.length).toBeGreaterThan(0);
  });

  it("has warnings array", () => {
    expect(Array.isArray(labResultsDemo.warnings)).toBe(true);
    expect(labResultsDemo.warnings.length).toBeGreaterThan(0);
  });

  it("has recommendations array", () => {
    expect(Array.isArray(labResultsDemo.recommendations)).toBe(true);
    expect(labResultsDemo.recommendations.length).toBeGreaterThan(0);
  });

  it("has Tanong Mo Sa Doktor questions", () => {
    expect(Array.isArray(labResultsDemo.tanongMoQuestions)).toBe(true);
    expect(labResultsDemo.tanongMoQuestions.length).toBeGreaterThan(0);
  });
});

describe("Prescriptions Demo Data", () => {
  it("has patient name", () => {
    expect(prescriptionDemo.patientName).toBe("Maria Santos");
  });

  it("has diagnosis", () => {
    expect(prescriptionDemo.diagnosis).toContain("Respiratory");
  });

  it("has 2 medicines", () => {
    expect(prescriptionDemo.medicines).toHaveLength(2);
  });

  it("each medicine has required fields", () => {
    prescriptionDemo.medicines.forEach((med) => {
      expect(med.name).toBeTruthy();
      expect(med.genericName).toBeTruthy();
      expect(med.dosage).toBeTruthy();
      expect(med.frequency).toBeTruthy();
      expect(med.duration).toBeTruthy();
      expect(med.instructions).toBeTruthy();
      expect(Array.isArray(med.warnings)).toBe(true);
    });
  });

  it("has Amoxicillin", () => {
    const amox = prescriptionDemo.medicines.find((m) => m.name === "Amoxicillin");
    expect(amox).toBeTruthy();
    expect(amox?.dosage).toBe("500mg");
  });

  it("has recommendations", () => {
    expect(prescriptionDemo.recommendations.length).toBeGreaterThan(0);
  });

  it("has Tanong Mo Sa Doktor questions", () => {
    expect(prescriptionDemo.tanongMoQuestions.length).toBeGreaterThan(0);
  });
});

describe("Discharge Summary Demo Data", () => {
  it("has patient name", () => {
    expect(dischargeDemo.patientName).toBe("Pedro Reyes");
  });

  it("has hospital stay details", () => {
    expect(dischargeDemo.facilityName).toBe("St. Luke's Medical Center");
    expect(dischargeDemo.lengthOfStay).toBe("5 araw");
    expect(dischargeDemo.department).toBe("Internal Medicine");
  });

  it("has diagnosis", () => {
    expect(dischargeDemo.diagnosis).toContain("Pneumonia");
  });

  it("has procedures array", () => {
    expect(Array.isArray(dischargeDemo.procedures)).toBe(true);
    expect(dischargeDemo.procedures.length).toBeGreaterThan(0);
  });

  it("has discharge medications", () => {
    expect(dischargeDemo.dischargeMedications.length).toBeGreaterThan(0);
    dischargeDemo.dischargeMedications.forEach((med) => {
      expect(med.name).toBeTruthy();
      expect(med.dosage).toBeTruthy();
      expect(med.frequency).toBeTruthy();
      expect(med.duration).toBeTruthy();
    });
  });

  it("has follow-up instructions", () => {
    expect(dischargeDemo.followUpInstructions.length).toBeGreaterThan(0);
  });

  it("has warnings", () => {
    expect(dischargeDemo.warnings.length).toBeGreaterThan(0);
  });
});

describe("Other Documents Demo Data", () => {
  it("xray has document type", () => {
    expect(xrayReportDemo.documentType).toBe("Chest X-Ray Report");
  });

  it("xray has patient info", () => {
    expect(xrayReportDemo.patientName).toBe("Ana Villanueva");
    expect(xrayReportDemo.patientAge).toBe(28);
  });

  it("xray has extracted fields", () => {
    expect(xrayReportDemo.extractedFields.length).toBeGreaterThan(0);
    xrayReportDemo.extractedFields.forEach((field) => {
      expect(field.key).toBeTruthy();
      expect(field.value).toBeTruthy();
    });
  });

  it("xray is LOW urgency (normal result)", () => {
    expect(xrayReportDemo.urgency).toBe("LOW");
  });

  it("ecg has document type", () => {
    expect(ecgReportDemo.documentType).toContain("ECG");
  });

  it("ecg is MODERATE urgency", () => {
    expect(ecgReportDemo.urgency).toBe("MODERATE");
  });

  it("ecg has warnings", () => {
    expect(ecgReportDemo.warnings.length).toBeGreaterThan(0);
  });
});

describe("Demo Index", () => {
  it("getDemoData returns lab data for lab type", () => {
    const data = getDemoData("lab");
    expect(data).toBe(labResultsDemo);
  });

  it("getDemoData returns prescription data", () => {
    const data = getDemoData("prescription");
    expect(data).toBe(prescriptionDemo);
  });

  it("getDemoData returns discharge data", () => {
    const data = getDemoData("discharge");
    expect(data).toBe(dischargeDemo);
  });

  it("getDemoData returns other doc data", () => {
    const data = getDemoData("other");
    expect(data).toBe(xrayReportDemo);
  });

  it("getDemoTitle returns correct titles", () => {
    expect(getDemoTitle("lab")).toContain("Lab Results");
    expect(getDemoTitle("prescription")).toContain("Prescription");
    expect(getDemoTitle("discharge")).toContain("Discharge");
    expect(getDemoTitle("other")).toContain("Medical Document");
  });

  it("getDemoDescription returns Filipino descriptions", () => {
    const desc = getDemoDescription("lab");
    expect(desc).toContain("halimbawa");
    expect(desc).toContain("Clara");
  });

  it("demoData has all 4 types", () => {
    expect(Object.keys(demoData)).toHaveLength(4);
    expect(demoData.lab).toBeTruthy();
    expect(demoData.prescription).toBeTruthy();
    expect(demoData.discharge).toBeTruthy();
    expect(demoData.other).toBeTruthy();
  });
});

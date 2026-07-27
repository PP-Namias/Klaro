import { describe, expect, it } from "vitest";

import { dischargeDemo } from "~/data/demo-discharge";
import { labResultsDemo } from "~/data/demo-lab-results";
import { xrayReportDemo } from "~/data/demo-other-docs";
import { prescriptionDemo } from "~/data/demo-prescriptions";

describe("DemoLabResults display", () => {
  it("shows patient name", () => {
    expect(labResultsDemo.patientName).toBe("Juan Dela Cruz");
  });

  it("shows 8 test results", () => {
    expect(labResultsDemo.tests).toHaveLength(8);
  });

  it("shows flagged values highlighted", () => {
    const flagged = labResultsDemo.tests.filter((t) => t.flagged);
    expect(flagged.length).toBe(5);
    flagged.forEach((t) => {
      expect(t.flagged).toBe(true);
      // Flagged tests have interpretation starting with "Mataas" or "Mababa"
      const firstWord = t.interpretation.split(" ")[0]?.toLowerCase();
      expect(["mataas", "mababa"]).toContain(firstWord);
    });
  });

  it("shows reference ranges for each test", () => {
    labResultsDemo.tests.forEach((test) => {
      expect(test.referenceRange).toBeTruthy();
      expect(test.referenceRange).toMatch(/\d/);
    });
  });

  it("shows urgency badge", () => {
    expect(labResultsDemo.urgency).toBe("MODERATE");
  });

  it("shows 3 warnings", () => {
    expect(labResultsDemo.warnings).toHaveLength(3);
  });

  it("shows 3 recommendations", () => {
    expect(labResultsDemo.recommendations).toHaveLength(3);
  });

  it("shows 4 Tanong Mo Sa Doktor questions", () => {
    expect(labResultsDemo.tanongMoQuestions).toHaveLength(4);
  });
});

describe("DemoPrescription display", () => {
  it("shows patient name", () => {
    expect(prescriptionDemo.patientName).toBe("Maria Santos");
  });

  it("shows diagnosis", () => {
    expect(prescriptionDemo.diagnosis).toContain("Respiratory");
  });

  it("shows 2 medicines with dosage", () => {
    expect(prescriptionDemo.medicines).toHaveLength(2);
    prescriptionDemo.medicines.forEach((med) => {
      expect(med.dosage).toBe("500mg");
    });
  });

  it("shows Amoxicillin instructions", () => {
    const amox = prescriptionDemo.medicines[0];
    expect(amox?.name).toBe("Amoxicillin");
    expect(amox?.instructions).toContain("pagkain");
  });

  it("shows Paracetamol PRN frequency", () => {
    const para = prescriptionDemo.medicines[1];
    expect(para?.name).toBe("Paracetamol");
    expect(para?.frequency).toContain("PRN");
  });

  it("shows medicine warnings", () => {
    prescriptionDemo.medicines.forEach((med) => {
      expect(med.warnings.length).toBeGreaterThan(0);
    });
  });
});

describe("DemoDischarge display", () => {
  it("shows patient name", () => {
    expect(dischargeDemo.patientName).toBe("Pedro Reyes");
  });

  it("shows hospital name", () => {
    expect(dischargeDemo.facilityName).toBe("St. Luke's Medical Center");
  });

  it("shows length of stay", () => {
    expect(dischargeDemo.lengthOfStay).toBe("5 araw");
  });

  it("shows diagnosis", () => {
    expect(dischargeDemo.diagnosis).toContain("Pneumonia");
  });

  it("shows 6 procedures", () => {
    expect(dischargeDemo.procedures).toHaveLength(6);
  });

  it("shows 3 discharge medications", () => {
    expect(dischargeDemo.dischargeMedications).toHaveLength(3);
  });

  it("shows 5 follow-up instructions", () => {
    expect(dischargeDemo.followUpInstructions).toHaveLength(5);
  });

  it("shows 3 warnings", () => {
    expect(dischargeDemo.warnings).toHaveLength(3);
  });
});

describe("DemoOtherDoc display", () => {
  it("shows document type", () => {
    expect(xrayReportDemo.documentType).toBe("Chest X-Ray Report");
  });

  it("shows 8 extracted fields", () => {
    expect(xrayReportDemo.extractedFields).toHaveLength(8);
  });

  it("each field has key-value pair", () => {
    xrayReportDemo.extractedFields.forEach((field) => {
      expect(field.key.length).toBeGreaterThan(0);
      expect(field.value.length).toBeGreaterThan(0);
    });
  });

  it("shows impression field", () => {
    const impression = xrayReportDemo.extractedFields.find(
      (f) => f.key === "Impression",
    );
    expect(impression).toBeTruthy();
    expect(impression?.value).toContain("Normal");
  });

  it("shows no warnings for normal result", () => {
    expect(xrayReportDemo.warnings).toHaveLength(0);
  });

  it("shows 3 recommendations", () => {
    expect(xrayReportDemo.recommendations).toHaveLength(3);
  });
});

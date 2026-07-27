import { describe, expect, it, vi } from "vitest";

import {
  buildMedicalContext,
  calculateDistanceKm,
  facilityTypeRank,
  isEmergencyCapable,
  matchesSpecialty,
  matchesTextSearch,
  parseSpecialties,
  rankFacilitiesForContext,
  summarizeMedicalContext,
} from "../facilities";

vi.mock("../llm", () => ({
  callLLMAPI: vi.fn().mockResolvedValue("This is a facility recommendation."),
}));

describe("calculateDistanceKm", () => {
  it("returns 0 for same coordinates", () => {
    const result = calculateDistanceKm(14.5995, 120.9842, 14.5995, 120.9842);
    expect(result).toBe(0);
  });

  it("calculates correct distance between Manila and Quezon City", () => {
    const result = calculateDistanceKm(14.5995, 120.9842, 14.676, 121.044);
    expect(result).toBeGreaterThan(5);
    expect(result).toBeLessThan(20);
  });

  it("handles antipodal points", () => {
    const result = calculateDistanceKm(0, 0, 0, 180);
    expect(result).toBeGreaterThan(20000);
  });
});

describe("facilityTypeRank", () => {
  it("returns 0 for hospital", () => {
    expect(facilityTypeRank("hospital")).toBe(0);
  });

  it("returns 6 for birthing_home", () => {
    expect(facilityTypeRank("birthing_home")).toBe(6);
  });

  it("returns array length for unknown type", () => {
    expect(facilityTypeRank("unknown")).toBe(7);
  });
});

describe("parseSpecialties", () => {
  it("returns empty array for non-array input", () => {
    expect(parseSpecialties(null)).toEqual([]);
    expect(parseSpecialties(undefined)).toEqual([]);
    expect(parseSpecialties("string")).toEqual([]);
  });

  it("returns empty strings filtered out", () => {
    expect(parseSpecialties(["Cardiology", "", "  ", "Neurology"])).toEqual([
      "Cardiology",
      "Neurology",
    ]);
  });

  it("returns trimmed specialties", () => {
    expect(parseSpecialties(["  Cardiology  ", " Neurology "])).toEqual([
      "Cardiology",
      "Neurology",
    ]);
  });
});

describe("matchesSpecialty", () => {
  it("returns true when needle empty", () => {
    expect(matchesSpecialty(["Cardiology"], "")).toBe(true);
  });

  it("matches partial specialty name", () => {
    expect(matchesSpecialty(["Cardiology", "Neurology"], "cardio")).toBe(true);
  });

  it("returns false when no match", () => {
    expect(matchesSpecialty(["Cardiology"], "orthopedics")).toBe(false);
  });
});

describe("matchesTextSearch", () => {
  it("returns true when searchText empty", () => {
    expect(
      matchesTextSearch({ name: "Hospital", address: "123 St" }, undefined),
    ).toBe(true);
  });

  it("matches facility name", () => {
    expect(
      matchesTextSearch(
        { name: "Manila Hospital", address: "123 St" },
        "manila",
      ),
    ).toBe(true);
  });

  it("matches facility address", () => {
    expect(
      matchesTextSearch({ name: "Hospital", address: "123 Manila St" }, "123"),
    ).toBe(true);
  });

  it("returns false when no match", () => {
    expect(
      matchesTextSearch({ name: "Hospital", address: "123 St" }, "quezon"),
    ).toBe(false);
  });
});

describe("isEmergencyCapable", () => {
  it("returns true for hospital", () => {
    expect(isEmergencyCapable({ facilityType: "hospital" })).toBe(true);
  });

  it("returns true for medical_center", () => {
    expect(isEmergencyCapable({ facilityType: "medical_center" })).toBe(true);
  });

  it("returns true when name contains emergency", () => {
    expect(isEmergencyCapable({ name: "Emergency Clinic" })).toBe(true);
  });

  it("returns true for 24/7 opening hours", () => {
    expect(
      isEmergencyCapable({
        facilityType: "clinic",
        openingHours: { weekdays: "24/7" },
      }),
    ).toBe(true);
  });

  it("returns false for clinic", () => {
    expect(isEmergencyCapable({ facilityType: "clinic" })).toBe(false);
  });
});

describe("buildMedicalContext", () => {
  it("returns LOW when no flagged tests", () => {
    const context = buildMedicalContext([
      { name: "Hemoglobin", value: "14.5", flagged: false },
    ]);
    expect(context.severity).toBe("LOW");
  });

  it("returns MODERATE for 1-2 flagged tests", () => {
    const context = buildMedicalContext([
      { name: "Glucose", value: "110", flagged: true },
    ]);
    expect(context.severity).toBe("MODERATE");
  });

  it("returns HIGH for 3+ flagged tests", () => {
    const context = buildMedicalContext([
      { name: "Glucose", value: "110", flagged: true },
      { name: "LDL", value: "160", flagged: true },
      { name: "Triglycerides", value: "180", flagged: true },
    ]);
    expect(context.severity).toBe("HIGH");
  });

  it("generates testSummary", () => {
    const context = buildMedicalContext([
      { name: "Glucose", value: "110", flagged: true },
    ]);
    expect(context.testSummary).toContain("flagged result(s)");
  });
});

describe("rankFacilitiesForContext", () => {
  it("returns empty array for empty input", () => {
    const result = rankFacilitiesForContext([]);
    expect(result).toEqual([]);
  });

  it("ranks hospital above clinic", () => {
    const facilities = [
      { id: "1", name: "Clinic", facilityType: "clinic", address: "123 St" },
      {
        id: "2",
        name: "Hospital",
        facilityType: "hospital",
        address: "456 St",
      },
    ];
    const result = rankFacilitiesForContext(facilities);
    expect(result[0].name).toBe("Hospital");
  });

  it("boosts PhilHealth accredited facilities", () => {
    const facilities = [
      {
        id: "1",
        name: "Non-Accredited",
        facilityType: "hospital",
        address: "123 St",
        isPhilHealthAccredited: false,
      },
      {
        id: "2",
        name: "Accredited",
        facilityType: "hospital",
        address: "456 St",
        isPhilHealthAccredited: true,
      },
    ];
    const result = rankFacilitiesForContext(facilities);
    expect(result[0].name).toBe("Accredited");
  });

  it("boosts matching specialties", () => {
    const facilities = [
      {
        id: "1",
        name: "General",
        facilityType: "hospital",
        address: "123 St",
        acceptedSpecialties: ["Surgery"],
      },
      {
        id: "2",
        name: "Cardio",
        facilityType: "hospital",
        address: "456 St",
        acceptedSpecialties: ["Cardiology"],
      },
    ];
    const result = rankFacilitiesForContext(facilities, undefined, [
      "Cardiology",
    ]);
    expect(result[0].name).toBe("Cardio");
  });

  it("boosts emergency for HIGH severity", () => {
    const facilities = [
      {
        id: "1",
        name: "Clinic",
        facilityType: "clinic",
        address: "123 St",
      },
      {
        id: "2",
        name: "Hospital",
        facilityType: "hospital",
        address: "456 St",
      },
    ];
    const result = rankFacilitiesForContext(facilities, {
      severity: "HIGH",
      flaggedTests: [],
    });
    expect(result[0].name).toBe("Hospital");
  });
});

describe("summarizeMedicalContext", () => {
  it("returns default when no context", () => {
    expect(summarizeMedicalContext()).toBe("No scan context available.");
  });

  it("formats severity and flagged count", () => {
    const context = summarizeMedicalContext({
      severity: "HIGH",
      flaggedTests: [{ name: "Glucose" }, { name: "LDL" }],
      testSummary: "Needs follow-up",
    });
    expect(context).toContain("HIGH");
    expect(context).toContain("2 flagged test(s)");
  });
});

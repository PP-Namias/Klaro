import { describe, it, expect } from "vitest";
import {
  facilityTypeEnum,
  facilityTypeRank,
  facilityTypeOrder,
  searchNearbySchema,
  medicalContextSchema,
  recommendByTestResultsSchema,
  facilityResponseSchema,
} from "../facilities";

describe("facilityTypeEnum", () => {
  it("accepts hospital", () => {
    expect(facilityTypeEnum.safeParse("hospital").success).toBe(true);
  });

  it("accepts clinic", () => {
    expect(facilityTypeEnum.safeParse("clinic").success).toBe(true);
  });

  it("accepts medical_center", () => {
    expect(facilityTypeEnum.safeParse("medical_center").success).toBe(true);
  });

  it("accepts diagnostic_center", () => {
    expect(facilityTypeEnum.safeParse("diagnostic_center").success).toBe(true);
  });

  it("accepts health_unit", () => {
    expect(facilityTypeEnum.safeParse("health_unit").success).toBe(true);
  });

  it("accepts rural_health_unit", () => {
    expect(facilityTypeEnum.safeParse("rural_health_unit").success).toBe(true);
  });

  it("accepts birthing_home", () => {
    expect(facilityTypeEnum.safeParse("birthing_home").success).toBe(true);
  });

  it("rejects invalid type", () => {
    expect(facilityTypeEnum.safeParse("pharmacy").success).toBe(false);
  });
});

describe("facilityTypeRank", () => {
  it("returns 0 for hospital", () => {
    expect(facilityTypeRank("hospital")).toBe(0);
  });

  it("returns last rank for unknown type", () => {
    expect(facilityTypeRank("unknown")).toBe(facilityTypeOrder.length);
  });

  it("handles null input", () => {
    expect(facilityTypeRank(null)).toBe(facilityTypeOrder.length);
  });

  it("handles undefined input", () => {
    expect(facilityTypeRank(undefined)).toBe(facilityTypeOrder.length);
  });
});

describe("searchNearbySchema", () => {
  it("accepts valid latitude and longitude", () => {
    const result = searchNearbySchema.safeParse({
      latitude: 14.5995,
      longitude: 120.9842,
    });
    expect(result.success).toBe(true);
  });

  it("rejects latitude below -90", () => {
    const result = searchNearbySchema.safeParse({
      latitude: -91,
      longitude: 120.9842,
    });
    expect(result.success).toBe(false);
  });

  it("rejects latitude above 90", () => {
    const result = searchNearbySchema.safeParse({
      latitude: 91,
      longitude: 120.9842,
    });
    expect(result.success).toBe(false);
  });

  it("rejects longitude below -180", () => {
    const result = searchNearbySchema.safeParse({
      latitude: 14.5995,
      longitude: -181,
    });
    expect(result.success).toBe(false);
  });

  it("rejects longitude above 180", () => {
    const result = searchNearbySchema.safeParse({
      latitude: 14.5995,
      longitude: 181,
    });
    expect(result.success).toBe(false);
  });

  it("defaults radiusKm to 10", () => {
    const result = searchNearbySchema.safeParse({
      latitude: 14.5995,
      longitude: 120.9842,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.radiusKm).toBe(10);
    }
  });

  it("defaults limit to 20", () => {
    const result = searchNearbySchema.safeParse({
      latitude: 14.5995,
      longitude: 120.9842,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
    }
  });

  it("accepts facilityType filter", () => {
    const result = searchNearbySchema.safeParse({
      latitude: 14.5995,
      longitude: 120.9842,
      facilityType: "hospital",
    });
    expect(result.success).toBe(true);
  });

  it("accepts ownership filter", () => {
    const result = searchNearbySchema.safeParse({
      latitude: 14.5995,
      longitude: 120.9842,
      ownership: "public",
    });
    expect(result.success).toBe(true);
  });

  it("accepts philHealthOnly boolean", () => {
    const result = searchNearbySchema.safeParse({
      latitude: 14.5995,
      longitude: 120.9842,
      philHealthOnly: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts textSearch", () => {
    const result = searchNearbySchema.safeParse({
      latitude: 14.5995,
      longitude: 120.9842,
      textSearch: "hospital",
    });
    expect(result.success).toBe(true);
  });

  it("accepts specialty", () => {
    const result = searchNearbySchema.safeParse({
      latitude: 14.5995,
      longitude: 120.9842,
      specialty: "cardiology",
    });
    expect(result.success).toBe(true);
  });

  it("accepts emergencyOnly", () => {
    const result = searchNearbySchema.safeParse({
      latitude: 14.5995,
      longitude: 120.9842,
      emergencyOnly: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("medicalContextSchema", () => {
  it("accepts LOW severity", () => {
    const result = medicalContextSchema.safeParse({ severity: "LOW" });
    expect(result.success).toBe(true);
  });

  it("accepts MODERATE severity", () => {
    const result = medicalContextSchema.safeParse({ severity: "MODERATE" });
    expect(result.success).toBe(true);
  });

  it("accepts HIGH severity", () => {
    const result = medicalContextSchema.safeParse({ severity: "HIGH" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid severity", () => {
    const result = medicalContextSchema.safeParse({ severity: "CRITICAL" });
    expect(result.success).toBe(false);
  });

  it("accepts optional testSummary", () => {
    const result = medicalContextSchema.safeParse({
      severity: "LOW",
      testSummary: "No issues found",
    });
    expect(result.success).toBe(true);
  });

  it("defaults flaggedTests to empty array", () => {
    const result = medicalContextSchema.safeParse({ severity: "LOW" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.flaggedTests).toEqual([]);
    }
  });
});

describe("recommendByTestResultsSchema", () => {
  it("accepts valid input", () => {
    const result = recommendByTestResultsSchema.safeParse({
      extractedTests: [{ name: "Glucose", value: "110", flagged: true }],
      latitude: 14.5995,
      longitude: 120.9842,
    });
    expect(result.success).toBe(true);
  });

  it("defaults radiusKm to 15", () => {
    const result = recommendByTestResultsSchema.safeParse({
      extractedTests: [],
      latitude: 14.5995,
      longitude: 120.9842,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.radiusKm).toBe(15);
    }
  });

  it("defaults limit to 5", () => {
    const result = recommendByTestResultsSchema.safeParse({
      extractedTests: [],
      latitude: 14.5995,
      longitude: 120.9842,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(5);
    }
  });
});

describe("facilityResponseSchema", () => {
  it("accepts valid facility", () => {
    const result = facilityResponseSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Manila Hospital",
      facilityType: "hospital",
      address: "123 Manila St",
      latitude: 14.5995,
      longitude: 120.9842,
      distance: 2.5,
      isPhilHealthAccredited: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts nullable fields", () => {
    const result = facilityResponseSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Manila Hospital",
      facilityType: null,
      address: "123 Manila St",
      latitude: 14.5995,
      longitude: 120.9842,
      distance: 2.5,
      phoneNumber: null,
      isPhilHealthAccredited: false,
      acceptedSpecialties: null,
      openingHours: null,
    });
    expect(result.success).toBe(true);
  });
});

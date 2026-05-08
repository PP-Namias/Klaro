import type { ExtractedTest } from "@klaro/validators/extraction";
import type { FacilityResponse } from "@klaro/validators";

import { callLLMAPI } from "./llm";

type MedicalContextInput = {
  severity: "LOW" | "MODERATE" | "HIGH";
  testSummary?: string;
  flaggedTests: Array<{ name: string; value?: string; unit?: string }>;
};

type RecommendByTestResultsInput = {
  extractedTests: Array<{
    name: string;
    value?: string;
    unit?: string;
    flagged?: boolean;
  }>;
  latitude: number;
  longitude: number;
  radiusKm?: number;
  limit?: number;
};

export type FacilityLike = {
  id?: string;
  name?: string | null;
  facilityType?: string | null;
  ownership?: string | null;
  address?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  distance?: number;
  isPhilHealthAccredited?: boolean | null;
  acceptedSpecialties?: unknown;
  openingHours?: unknown;
};

export type RankedFacility = FacilityResponse & {
  rankingScore: number;
  matchReasons: string[];
  urgency: "LOW" | "MODERATE" | "HIGH";
};

const FACILITY_TYPE_ORDER = [
  "hospital",
  "clinic",
  "medical_center",
  "diagnostic_center",
  "health_unit",
  "rural_health_unit",
  "birthing_home",
] as const;

type FacilityTypeValue = (typeof FACILITY_TYPE_ORDER)[number];

const normalize = (value: string | null | undefined) =>
  value?.trim().toLowerCase() ?? "";

export const calculateDistanceKm = (
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
) => {
  const earthRadiusKm = 6371;
  const latitudeDelta = ((latitude2 - latitude1) * Math.PI) / 180;
  const longitudeDelta = ((longitude2 - longitude1) * Math.PI) / 180;
  const latitude1Radians = (latitude1 * Math.PI) / 180;
  const latitude2Radians = (latitude2 * Math.PI) / 180;

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitude1Radians) *
      Math.cos(latitude2Radians) *
      Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const facilityTypeRank = (type: string | null | undefined) => {
  const normalizedType = normalize(type);
  const rank = FACILITY_TYPE_ORDER.indexOf(
    normalizedType as (typeof FACILITY_TYPE_ORDER)[number],
  );
  return rank === -1 ? FACILITY_TYPE_ORDER.length : rank;
};

const coerceFacilityType = (
  type: string | null | undefined,
): FacilityTypeValue | null => {
  const normalizedType = normalize(type);
  if (!normalizedType) return null;

  return FACILITY_TYPE_ORDER.includes(normalizedType as FacilityTypeValue)
    ? (normalizedType as FacilityTypeValue)
    : null;
};

export const parseSpecialties = (specialties: unknown) => {
  if (!Array.isArray(specialties)) {
    return [] as string[];
  }

  return specialties
    .map((specialty) => (typeof specialty === "string" ? specialty.trim() : ""))
    .filter((specialty) => specialty.length > 0);
};

export const matchesSpecialty = (specialties: unknown, specialty: string) => {
  const needle = normalize(specialty);
  if (!needle) return true;

  return parseSpecialties(specialties).some(
    (value) => normalize(value).includes(needle),
  );
};

export const matchesTextSearch = (
  facility: FacilityLike,
  searchText: string | undefined,
) => {
  const needle = normalize(searchText);
  if (!needle) return true;

  const haystack = [facility.name, facility.address]
    .filter(Boolean)
    .map((value) => normalize(String(value)))
    .join(" ");

  return haystack.includes(needle);
};

export const isEmergencyCapable = (facility: FacilityLike) => {
  const type = normalize(facility.facilityType);
  if (type === "hospital" || type === "medical_center") {
    return true;
  }

  const name = normalize(facility.name);
  if (name.includes("emergency") || name.includes("urgent")) {
    return true;
  }

  const openingHours = facility.openingHours;
  if (openingHours && typeof openingHours === "object") {
    const values = Object.values(openingHours as Record<string, unknown>)
      .map((value) => normalize(typeof value === "string" ? value : String(value)))
      .join(" ");

    if (values.includes("24") || values.includes("24/7") || values.includes("24 hours")) {
      return true;
    }
  }

  return false;
};

const extractEmergencyTargets = (tests: ExtractedTest[]) => {
  const targets = new Set<string>();
  for (const test of tests) {
    const label = normalize(test.name);
    if (label.includes("glucose") || label.includes("hba1c") || label.includes("blood sugar")) {
      targets.add("endocrinology");
      targets.add("internal medicine");
    }
    if (label.includes("creatinine") || label.includes("bun") || label.includes("urinalysis")) {
      targets.add("nephrology");
      targets.add("internal medicine");
    }
    if (label.includes("cholesterol") || label.includes("ldl") || label.includes("triglyceride")) {
      targets.add("cardiology");
      targets.add("internal medicine");
    }
    if (label.includes("cbc") || label.includes("hemoglobin") || label.includes("platelet")) {
      targets.add("hematology");
      targets.add("internal medicine");
    }
  }

  return [...targets];
};

export const buildMedicalContext = (tests: ExtractedTest[]): MedicalContextInput => {
  const flaggedTests = tests.filter((test) => test.flagged).map((test) => ({
    name: test.name,
    value: test.value,
    unit: test.unit,
  }));

  const severity =
    flaggedTests.length === 0
      ? "LOW"
      : flaggedTests.length >= 3
        ? "HIGH"
        : "MODERATE";

  return {
    severity,
    testSummary: flaggedTests.length
      ? `${flaggedTests.length} flagged result(s) may need medical follow-up.`
      : "No abnormal results found.",
    flaggedTests,
  };
};

const buildTestDrivenSpecialties = (
  tests: ExtractedTest[],
  explicitContext?: MedicalContextInput,
) => {
  const specialtySet = new Set<string>();
  for (const specialty of extractEmergencyTargets(tests)) {
    specialtySet.add(specialty);
  }

  for (const flagged of explicitContext?.flaggedTests ?? []) {
    const label = normalize(flagged.name);
    if (label.includes("glucose") || label.includes("hba1c")) {
      specialtySet.add("endocrinology");
    }
  }

  return [...specialtySet];
};

const scoreFacility = (
  facility: FacilityLike,
  medicalContext?: MedicalContextInput,
  targetSpecialties: string[] = [],
) => {
  const reasons: string[] = [];
  let score = 0;

  score += Math.max(0, FACILITY_TYPE_ORDER.length - facilityTypeRank(facility.facilityType)) * 5;

  if (facility.isPhilHealthAccredited) {
    score += 3;
    reasons.push("PhilHealth accredited");
  }

  const facilitySpecialties = parseSpecialties(facility.acceptedSpecialties).map((specialty) => normalize(specialty));
  const matchedSpecialty = targetSpecialties.find((specialty) =>
    facilitySpecialties.some((value) => value.includes(normalize(specialty))),
  );

  if (matchedSpecialty) {
    score += 8;
    reasons.push(`Matches ${matchedSpecialty} care`);
  }

  if (medicalContext?.severity === "HIGH" && isEmergencyCapable(facility)) {
    score += 10;
    reasons.push("Emergency-capable for high severity findings");
  } else if (medicalContext?.severity === "MODERATE" && isEmergencyCapable(facility)) {
    score += 4;
    reasons.push("Suitable for follow-up care");
  }

  const distance = typeof facility.distance === "number" ? facility.distance : Number.POSITIVE_INFINITY;
  if (Number.isFinite(distance)) {
    score += Math.max(0, 25 - Math.min(distance, 25));
  }

  return { score, reasons };
};

export const rankFacilitiesForContext = (
  facilities: FacilityLike[],
  medicalContext?: MedicalContextInput,
  targetSpecialties: string[] = [],
): RankedFacility[] => {
  return facilities
    .map((facility) => {
      const latitude = Number(facility.latitude);
      const longitude = Number(facility.longitude);
      const distance = typeof facility.distance === "number"
        ? facility.distance
        : Number.isFinite(latitude) && Number.isFinite(longitude)
          ? facility.distance ?? 0
          : 0;

      const { score, reasons } = scoreFacility(facility, medicalContext, targetSpecialties);
      const urgency: RankedFacility["urgency"] = medicalContext?.severity === "HIGH"
          ? "HIGH"
          : medicalContext?.severity === "MODERATE"
            ? "MODERATE"
            : "LOW";

      return {
        id: String(facility.id ?? ""),
        name: String(facility.name ?? "Unknown Facility"),
        facilityType: coerceFacilityType(facility.facilityType),
        address: String(facility.address ?? ""),
        latitude: Number.isFinite(latitude) ? latitude : 0,
        longitude: Number.isFinite(longitude) ? longitude : 0,
        distance: Number.isFinite(distance) ? distance : 0,
        phoneNumber: null,
        isPhilHealthAccredited: Boolean(facility.isPhilHealthAccredited),
        acceptedSpecialties: parseSpecialties(facility.acceptedSpecialties),
        openingHours: facility.openingHours as FacilityResponse["openingHours"],
        rankingScore: score,
        matchReasons: reasons,
        urgency,
      };
    })
    .sort((a, b) => {
      const scoreDelta = b.rankingScore - a.rankingScore;
      if (scoreDelta !== 0) return scoreDelta;
      const distanceDelta = a.distance - b.distance;
      if (distanceDelta !== 0) return distanceDelta;
      const rankDelta = facilityTypeRank(a.facilityType) - facilityTypeRank(b.facilityType);
      if (rankDelta !== 0) return rankDelta;
      return a.name.localeCompare(b.name);
    });
};

export const generateFacilityRecommendation = async (
  facility: FacilityLike,
  medicalContext?: MedicalContextInput,
  distanceKm?: number,
) => {
  const basePrompt = `You are helping a patient choose a nearby medical facility. Explain in plain language why this facility is a good fit. Keep the answer under 70 words.`;
  const prompt = `Facility: ${facility.name ?? "Unknown Facility"}\nType: ${facility.facilityType ?? "medical facility"}\nDistance: ${typeof distanceKm === "number" ? distanceKm.toFixed(1) : "unknown"} km\nPhilHealth: ${facility.isPhilHealthAccredited ? "yes" : "no"}\nSpecialties: ${parseSpecialties(facility.acceptedSpecialties).join(", ") || "not listed"}\nMedical context: ${medicalContext?.testSummary ?? "none"}`;

  const llmOutput = await callLLMAPI(prompt, basePrompt);
  if (llmOutput.trim()) {
    return llmOutput.trim();
  }

  const reasonParts = [
    facility.facilityType ? `It is a ${facility.facilityType}.` : "It is a medical facility.",
    facility.isPhilHealthAccredited ? "It accepts PhilHealth." : "PhilHealth is not listed.",
    typeof distanceKm === "number" ? `It is about ${distanceKm.toFixed(1)} km away.` : undefined,
    medicalContext?.severity === "HIGH"
      ? "It is suitable to review sooner because your test results need urgent follow-up."
      : medicalContext?.severity === "MODERATE"
        ? "It is a good choice for timely follow-up care."
        : "It is a reasonable nearby option for routine care.",
  ].filter(Boolean);

  return reasonParts.join(" ");
};

export const buildRecommendationSummary = async (
  facility: FacilityLike,
  medicalContext?: MedicalContextInput,
  distanceKm?: number,
) => {
  return generateFacilityRecommendation(facility, medicalContext, distanceKm);
};

export const recommendFacilitiesByTests = async (
  facilities: FacilityLike[],
  input: RecommendByTestResultsInput,
) => {
  const flaggedTests = input.extractedTests.filter((test) => Boolean(test.flagged));
  const normalizedTests: ExtractedTest[] = input.extractedTests.map((test) => ({
    name: test.name,
    value: test.value ?? "",
    flagged: Boolean(test.flagged),
    unit: test.unit ?? undefined,
    referenceRange: undefined,
  }));

  const medicalContext = buildMedicalContext(
    normalizedTests,
  );
  medicalContext.severity = flaggedTests.length >= 3 ? "HIGH" : flaggedTests.length > 0 ? "MODERATE" : "LOW";
  medicalContext.testSummary = flaggedTests.length
    ? `${flaggedTests.length} flagged result(s) need follow-up.`
    : "No flagged results provided.";

  const specialties = buildTestDrivenSpecialties(
    normalizedTests,
    medicalContext,
  );

  const radiusKm = input.radiusKm ?? 15;
  const limit = input.limit ?? 5;

  const ranked = rankFacilitiesForContext(facilities, medicalContext, specialties)
    .filter((facility) => facility.distance <= radiusKm)
    .slice(0, limit);

  const recommendations = await Promise.all(
    ranked.map(async (facility) => ({
      ...facility,
      summary: await generateFacilityRecommendation(
        facility,
        medicalContext,
        facility.distance,
      ),
    })),
  );

  return recommendations;
};

export const summarizeMedicalContext = (
  medicalContext?: MedicalContextInput,
) => {
  if (!medicalContext) {
    return "No scan context available.";
  }

  const flagged = medicalContext.flaggedTests?.length ?? 0;
  return `${medicalContext.severity} severity with ${flagged} flagged test(s). ${medicalContext.testSummary ?? ""}`.trim();
};

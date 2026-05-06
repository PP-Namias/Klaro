import { z } from "zod/v4";

export const facilityTypeEnum = z.enum([
  "hospital",
  "clinic",
  "medical_center",
  "diagnostic_center",
  "health_unit",
  "rural_health_unit",
  "birthing_home",
]);

export const searchNearbySchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusKm: z.number().min(0.1).max(50).default(10),
  limit: z.number().min(1).max(100).default(20),
  facilityType: facilityTypeEnum.optional(),
  ownership: z.enum(["public", "private"]).optional(),
  philHealthOnly: z.boolean().default(false),
});

export const facilityResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  facilityType: facilityTypeEnum.optional().nullable(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  distance: z.number().describe("Distance in km"),
  phoneNumber: z.string().optional().nullable(),
  isPhilHealthAccredited: z.boolean(),
  acceptedSpecialties: z.array(z.string()).optional().nullable(),
  openingHours: z.record(z.string(), z.any()).optional().nullable(),
});

export type FacilityType = z.infer<typeof facilityTypeEnum>;
export type SearchNearbyInput = z.infer<typeof searchNearbySchema>;
export type FacilityResponse = z.infer<typeof facilityResponseSchema>;

import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod/v4";

import { facility } from "@klaro/db/schema";

import { publicProcedure } from "../trpc";

const facilityTypeOrder = [
  "hospital",
  "clinic",
  "medical_center",
  "diagnostic_center",
  "health_unit",
  "rural_health_unit",
  "birthing_home",
];

const calculateDistanceKm = (
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

const parseSpecialties = (specialties: unknown) => {
  if (!Array.isArray(specialties)) {
    return [];
  }

  return specialties
    .map((specialty) => (typeof specialty === "string" ? specialty.trim() : ""))
    .filter((specialty) => specialty.length > 0);
};

const matchesSpecialty = (specialties: unknown, specialty: string) => {
  const normalizedSpecialty = specialty.trim().toLowerCase();

  return parseSpecialties(specialties).some(
    (value) => value.toLowerCase() === normalizedSpecialty,
  );
};

const facilityTypeRank = (type: string | null | undefined) => {
  const normalizedType = type?.toLowerCase() ?? "";
  const rank = facilityTypeOrder.indexOf(normalizedType);

  return rank === -1 ? facilityTypeOrder.length : rank;
};

export const facilitiesRouter = {
  /**
   * List all facilities (with optional filtering)
   */
  list: publicProcedure
    .input(
      z.object({
        facilityType: z.string().optional(),
        ownership: z.enum(["public", "private"]).optional(),
        isPhilHealthAccredited: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input.facilityType) {
        conditions.push(eq(facility.facilityType, input.facilityType));
      }

      if (input.ownership) {
        conditions.push(eq(facility.ownership, input.ownership));
      }

      if (input.isPhilHealthAccredited !== undefined) {
        conditions.push(
          eq(facility.isPhilHealthAccredited, input.isPhilHealthAccredited),
        );
      }

      const whereClause =
        conditions.length === 0
          ? undefined
          : conditions.length === 1
            ? conditions[0]
            : and(...conditions);

      const facilities = await ctx.db
        .select()
        .from(facility)
        .where(whereClause)
        .limit(input.limit)
        .offset(input.offset);

      return facilities;
    }),

  /**
   * Get facility by ID
   */
  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [fac] = await ctx.db
        .select()
        .from(facility)
        .where(eq(facility.id, input.id));

      if (!fac) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Facility not found",
        });
      }

      return fac;
    }),

  /**
   * Search facilities near a location (geolocation-based)
   * Returns facilities within a radius (in km)
   */
  searchNearby: publicProcedure
    .input(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        radiusKm: z.number().min(1).max(100).default(10),
        facilityType: z.string().optional(),
        ownership: z.enum(["public", "private"]).optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input.facilityType) {
        conditions.push(eq(facility.facilityType, input.facilityType));
      }

      if (input.ownership) {
        conditions.push(eq(facility.ownership, input.ownership));
      }

      const whereClause =
        conditions.length === 0
          ? undefined
          : conditions.length === 1
            ? conditions[0]
            : and(...conditions);

      const facilities = await ctx.db
        .select()
        .from(facility)
        .where(whereClause)
        .limit(input.limit);

      const filteredFacilities = facilities
        .map((fac) => {
          const latitude = Number(fac.latitude);
          const longitude = Number(fac.longitude);

          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return null;
          }

          const distanceKm = calculateDistanceKm(
            input.latitude,
            input.longitude,
            latitude,
            longitude,
          );

          return { facility: fac, distance: distanceKm };
        })
        .filter((item) => item && item.distance <= input.radiusKm)
        .sort((a, b) => (a?.distance ?? 0) - (b?.distance ?? 0))
        .slice(0, input.limit);

      return filteredFacilities.map((item) => ({
        ...item?.facility,
        distance: item?.distance,
      }));
    }),

  /**
   * Get the best suggested facility based on location and optional type
   * Includes an AI-ready summary field
   */
  bestSuggested: publicProcedure
    .input(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        facilityType: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const facilities = await ctx.db
        .select()
        .from(facility)
        .where(
          input.facilityType
            ? eq(facility.facilityType, input.facilityType)
            : undefined,
        )
        .limit(50);

      const sorted = facilities
        .map((fac) => {
          const latitude = Number(fac.latitude);
          const longitude = Number(fac.longitude);

          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return null;
          }

          return {
            ...fac,
            distance: calculateDistanceKm(
              input.latitude,
              input.longitude,
              latitude,
              longitude,
            ),
          };
        })
        .filter((f): f is (typeof facilities[0] & { distance: number }) => f !== null)
        .sort((a, b) => {
          const typeRankDelta =
            facilityTypeRank(a.facilityType) - facilityTypeRank(b.facilityType);

          if (typeRankDelta !== 0) return typeRankDelta;

          if (a.isPhilHealthAccredited && !b.isPhilHealthAccredited) return -1;
          if (!a.isPhilHealthAccredited && b.isPhilHealthAccredited) return 1;
          return a.distance - b.distance;
        });

      const best = sorted[0];
      if (!best) return null;

      // In a real implementation, this summary would be generated by an LLM
      const summary = `Best suggested ${best.facilityType ?? "facility"} based on your location is ${best.name}. It is a ${best.ownership} facility ${best.isPhilHealthAccredited ? "with PhilHealth accreditation" : ""}. Estimated travel distance is ${best.distance.toFixed(1)} km.`;

      return {
        ...best,
        summary,
      };
    }),

  /**
   * Search facilities by specialty
   */
  searchBySpecialty: publicProcedure
    .input(
      z.object({
        specialty: z.string(),
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const facilities = await ctx.db
        .select()
        .from(facility)
        .limit(input.limit);

      return facilities.filter((item) =>
        matchesSpecialty(item.acceptedSpecialties, input.specialty),
      );
    }),

  /**
   * List facility types (for filtering)
   */
  getTypes: publicProcedure.query(() => {
    return facilityTypeOrder;
  }),


  /**
   * Get operating hours for a facility
   */
  getOperatingHours: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [fac] = await ctx.db
        .select()
        .from(facility)
        .where(eq(facility.id, input.id));

      if (!fac) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Facility not found",
        });
      }

      return fac.openingHours ?? {};
    }),
} satisfies TRPCRouterRecord;

import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod/v4";

import { facility } from "@klaro/db/schema";

import { publicProcedure } from "../trpc";

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
      // TODO: Implement proper geospatial query using PostGIS
      // For now, fetch all facilities and filter in application
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

      // Simple distance calculation (Haversine formula)
      const filteredFacilities = facilities
        .map((fac) => {
          if (!fac.latitude || !fac.longitude) return null;

          const lat1 = (input.latitude * Math.PI) / 180;
          const lat2 = (parseFloat(fac.latitude) * Math.PI) / 180;
          const deltaLat =
            ((parseFloat(fac.latitude) - input.latitude) * Math.PI) / 180;
          const deltaLng =
            ((parseFloat(fac.longitude) - input.longitude) * Math.PI) / 180;

          const a =
            Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) *
              Math.cos(lat2) *
              Math.sin(deltaLng / 2) *
              Math.sin(deltaLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distanceKm = 6371 * c;

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
      // Heuristic: find nearest hospital or clinic with PhilHealth if possible
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
          if (!fac.latitude || !fac.longitude) return null;
          const dist = 6371 * 2 * Math.atan2(Math.sqrt(
            Math.sin(((parseFloat(fac.latitude) - input.latitude) * Math.PI / 180) / 2) ** 2 +
            Math.cos((input.latitude * Math.PI) / 180) * Math.cos((parseFloat(fac.latitude) * Math.PI) / 180) *
            Math.sin(((parseFloat(fac.longitude) - input.longitude) * Math.PI / 180) / 2) ** 2
          ), Math.sqrt(1 - (
            Math.sin(((parseFloat(fac.latitude) - input.latitude) * Math.PI / 180) / 2) ** 2 +
            Math.cos((input.latitude * Math.PI) / 180) * Math.cos((parseFloat(fac.latitude) * Math.PI) / 180) *
            Math.sin(((parseFloat(fac.longitude) - input.longitude) * Math.PI / 180) / 2) ** 2
          )));
          return { ...fac, distance: dist };
        })
        .filter((f): f is (typeof facilities[0] & { distance: number }) => f !== null)
        .sort((a, b) => {
          // Boost PhilHealth accredited
          if (a.isPhilHealthAccredited && !b.isPhilHealthAccredited) return -1;
          if (!a.isPhilHealthAccredited && b.isPhilHealthAccredited) return 1;
          return a.distance - b.distance;
        });

      const best = sorted[0];
      if (!best) return null;

      // In a real implementation, this summary would be generated by an LLM
      const summary = `Best suggested ${best.facilityType} based on your location is ${best.name}. It is a ${best.ownership} facility ${best.isPhilHealthAccredited ? "with PhilHealth accreditation" : ""}. Estimated travel distance is ${best.distance.toFixed(1)} km.`;

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
      // This would search through facilities that offer specific specialties
      // Implementation depends on how specialties are stored (jsonb array)
      const facilities = await ctx.db
        .select()
        .from(facility)
        .limit(input.limit);

      // Filter facilities that have the requested specialty
      // TODO: Implement proper JSONB array filtering
      return facilities;
    }),

  /**
   * List facility types (for filtering)
   */
  getTypes: publicProcedure.query(() => {
    // Return hardcoded facility types for now
    return [
      "hospital",
      "clinic",
      "health_unit",
      "diagnostic_center",
    ];
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

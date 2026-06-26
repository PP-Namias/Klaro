import type { TRPCRouterRecord } from "@trpc/server";
import type { SQL } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod/v4";

import { facility } from "@klaro/db/schema";
import {
  facilityTypeOrder,
  facilityTypeRank,
  medicalContextSchema,
  recommendByTestResultsSchema,
  searchNearbySchema,
} from "@klaro/validators";

import {
  buildMedicalContext,
  buildRecommendationSummary,
  calculateDistanceKm,
  matchesSpecialty,
  matchesTextSearch,
  rankFacilitiesForContext,
  recommendFacilitiesByTests,
  summarizeMedicalContext,
} from "../services/facilities";
import { publicProcedure } from "../trpc";

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const isEmergencyCapable = (facilityRow: {
  facilityType?: string | null;
  name?: string | null;
  openingHours?: unknown;
}) => {
  const type = facilityRow.facilityType?.toLowerCase() ?? "";
  if (type === "hospital" || type === "medical_center") {
    return true;
  }

  const name = facilityRow.name?.toLowerCase() ?? "";
  if (name.includes("emergency") || name.includes("urgent")) {
    return true;
  }

  if (
    facilityRow.openingHours &&
    typeof facilityRow.openingHours === "object"
  ) {
    const values = Object.values(
      facilityRow.openingHours as Record<string, unknown>,
    )
      .map((value) => String(value).toLowerCase())
      .join(" ");

    return (
      values.includes("24") ||
      values.includes("24/7") ||
      values.includes("24 hours")
    );
  }

  return false;
};

const summarizeLoad = async (
  rows: Array<Record<string, unknown>>,
  latitude: number,
  longitude: number,
  input: {
    facilityType?: string;
    ownership?: "public" | "private";
    philHealthOnly?: boolean;
    textSearch?: string;
    specialty?: string;
    emergencyOnly?: boolean;
  },
) => {
  return rows
    .map((row) => {
      const rowLatitude = toNumber(row.latitude);
      const rowLongitude = toNumber(row.longitude);

      if (rowLatitude === null || rowLongitude === null) {
        return null;
      }

      if (input.facilityType && row.facilityType !== input.facilityType) {
        return null;
      }

      if (input.ownership && row.ownership !== input.ownership) {
        return null;
      }

      if (input.philHealthOnly && !row.isPhilHealthAccredited) {
        return null;
      }

      if (input.textSearch && !matchesTextSearch(row, input.textSearch)) {
        return null;
      }

      if (
        input.specialty &&
        !matchesSpecialty(row.acceptedSpecialties, input.specialty)
      ) {
        return null;
      }

      if (input.emergencyOnly && !isEmergencyCapable(row)) {
        return null;
      }

      const distance = calculateDistanceKm(
        latitude,
        longitude,
        rowLatitude,
        rowLongitude,
      );

      return {
        ...row,
        latitude: rowLatitude,
        longitude: rowLongitude,
        distance,
      };
    })
    .filter(
      (
        row,
      ): row is Record<string, unknown> & {
        distance: number;
        latitude: number;
        longitude: number;
      } => row !== null,
    );
};

const selectFacilities = async (
  ctx: {
    db: {
      select: () => {
        from: (table: typeof facility) => {
          where: (clause: SQL<unknown>) => {
            limit: (value: number) => Promise<unknown[]>;
          };
          limit: (value: number) => Promise<unknown[]>;
        };
      };
    };
  },
  input: {
    facilityType?: string;
    ownership?: "public" | "private";
    philHealthOnly?: boolean;
    limit: number;
  },
) => {
  const conditions: SQL<unknown>[] = [];

  if (input.facilityType) {
    conditions.push(eq(facility.facilityType, input.facilityType));
  }

  if (input.ownership) {
    conditions.push(eq(facility.ownership, input.ownership));
  }

  if (input.philHealthOnly) {
    conditions.push(eq(facility.isPhilHealthAccredited, true));
  }

  const safeLimit = Math.max(input.limit, 1);
  const baseQuery = ctx.db.select().from(facility);

  if (conditions.length === 0) {
    return baseQuery.limit(safeLimit);
  }

  if (conditions.length === 1) {
    return baseQuery.where(conditions[0]!).limit(safeLimit);
  }

  return baseQuery.where(and(...conditions)!).limit(safeLimit);
};

export const facilitiesRouter = {
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
      const conditions: SQL<unknown>[] = [];

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

      const baseQuery = ctx.db.select().from(facility);

      if (conditions.length === 0) {
        return baseQuery.limit(input.limit).offset(input.offset);
      }

      if (conditions.length === 1) {
        return baseQuery
          .where(conditions[0]!)
          .limit(input.limit)
          .offset(input.offset);
      }

      return baseQuery
        .where(and(...conditions)!)
        .limit(input.limit)
        .offset(input.offset);
    }),

  byId: publicProcedure
    .input(z.object({ id: z.uuid() }))
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

  searchNearby: publicProcedure
    .input(searchNearbySchema)
    .query(async ({ ctx, input }) => {
      const rows = await selectFacilities(ctx, input);
      const mapped = await summarizeLoad(
        rows as Array<Record<string, unknown>>,
        input.latitude,
        input.longitude,
        input,
      );

      return mapped
        .sort((a, b) => {
          const distanceDelta = a.distance - b.distance;
          if (distanceDelta !== 0) return distanceDelta;

          const typeDelta =
            facilityTypeRank(String(a.facilityType ?? "")) -
            facilityTypeRank(String(b.facilityType ?? ""));
          if (typeDelta !== 0) return typeDelta;

          return String(a.name ?? "").localeCompare(String(b.name ?? ""));
        })
        .slice(0, input.limit)
        .map((item) => ({
          ...item,
          latitude: item.latitude,
          longitude: item.longitude,
          distance: item.distance,
        }));
    }),

  bestSuggested: publicProcedure
    .input(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        facilityType: z.string().optional(),
        medicalContext: medicalContextSchema.optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rows = await selectFacilities(ctx, {
        facilityType: input.facilityType,
        limit: 50,
      });

      const mapped = await summarizeLoad(
        rows as Array<Record<string, unknown>>,
        input.latitude,
        input.longitude,
        {
          facilityType: input.facilityType,
        },
      );

      const ranked = rankFacilitiesForContext(mapped, input.medicalContext);

      const best = ranked[0];
      if (!best) return null;

      return {
        ...best,
        summary: await buildRecommendationSummary(
          best,
          input.medicalContext,
          best.distance,
        ),
      };
    }),

  recommendByTestResults: publicProcedure
    .input(recommendByTestResultsSchema)
    .query(async ({ ctx, input }) => {
      const rows = await selectFacilities(ctx, {
        limit: 200,
      });

      const mapped = await summarizeLoad(
        rows as Array<Record<string, unknown>>,
        input.latitude,
        input.longitude,
        {
          emergencyOnly: false,
        },
      );

      const recommendations = await recommendFacilitiesByTests(mapped, input);

      return recommendations;
    }),

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

  getTypes: publicProcedure.query(() => {
    return facilityTypeOrder;
  }),

  getOperatingHours: publicProcedure
    .input(z.object({ id: z.uuid() }))
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

import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { and, eq, like } from "drizzle-orm";
import { z } from "zod/v4";

import { doctor } from "@klaro/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

export const doctorRouter = {
  /**
   * List all active doctors (public endpoint)
   */
  list: publicProcedure
    .input(
      z.object({
        specialization: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(doctor.isActive, true)];

      if (input.specialization) {
        conditions.push(
          like(doctor.specialization, `%${input.specialization}%`),
        );
      }

      const whereClause =
        conditions.length === 0
          ? undefined
          : conditions.length === 1
            ? conditions[0]
            : and(...conditions);

      const doctors = await ctx.db
        .select()
        .from(doctor)
        .where(whereClause)
        .limit(input.limit)
        .offset(input.offset);

      return doctors;
    }),

  /**
   * Get doctor profile by ID
   */
  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [doc] = await ctx.db
        .select()
        .from(doctor)
        .where(eq(doctor.id, input.id));

      if (!doc) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Doctor not found",
        });
      }

      return doc;
    }),

  /**
   * Register as a doctor (protected)
   */
  register: protectedProcedure
    .input(
      z.object({
        name: z.string().max(255),
        specialization: z.string().max(255),
        licenseNumber: z.string().max(100),
        bio: z.string().optional(),
        pricePerSession: z.number().positive(),
        availableSessionTypes: z.array(
          z.enum(["chat_consult", "video_consult", "async_review"]),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        });
      }

      // Check if license number already exists
      const [existing] = await ctx.db
        .select()
        .from(doctor)
        .where(eq(doctor.licenseNumber, input.licenseNumber));

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "License number already registered",
        });
      }

      const [newDoctor] = await ctx.db
        .insert(doctor)
        .values({
          userId: ctx.session.user.id,
          name: input.name,
          specialization: input.specialization,
          licenseNumber: input.licenseNumber,
          bio: input.bio,
          pricePerSession: input.pricePerSession.toString(),
          availableSessionTypes: input.availableSessionTypes,
          isActive: false, // Requires admin verification
        })
        .returning();

      return {
        id: newDoctor?.id,
        status: "pending_verification",
        message: "Doctor registration submitted for verification",
      };
    }),

  /**
   * Update doctor profile (doctor-only)
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().max(255).optional(),
        bio: z.string().optional(),
        pricePerSession: z.number().positive().optional(),
        availableSessionTypes: z
          .array(z.enum(["chat_consult", "video_consult", "async_review"]))
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        });
      }

      const [doc] = await ctx.db
        .select()
        .from(doctor)
        .where(eq(doctor.id, input.id));

      if (!doc) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Doctor not found",
        });
      }

      if (doc.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own profile",
        });
      }

      const updateData: Partial<typeof doctor.$inferInsert> = {};

      if (input.name !== undefined) updateData.name = input.name;
      if (input.bio !== undefined) updateData.bio = input.bio;
      if (input.pricePerSession !== undefined) {
        updateData.pricePerSession = input.pricePerSession.toString();
      }
      if (input.availableSessionTypes !== undefined) {
        updateData.availableSessionTypes = input.availableSessionTypes;
      }

      if (Object.keys(updateData).length === 0) {
        return { success: true, doctor: doc };
      }

      const [updatedDoctor] = await ctx.db
        .update(doctor)
        .set(updateData)
        .where(eq(doctor.id, input.id))
        .returning();

      return { success: true, doctor: updatedDoctor ?? doc };
    }),

  /**
   * Search doctors by specialization and availability
   */
  search: publicProcedure
    .input(
      z.object({
        specialization: z.string().optional(),
        sessionType: z
          .enum(["chat_consult", "video_consult", "async_review"])
          .optional(),
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(doctor.isActive, true)];

      if (input.specialization) {
        conditions.push(
          like(doctor.specialization, `%${input.specialization}%`),
        );
      }

      // TODO: Filter by session type availability
      // This requires checking the jsonb array

      const whereClause =
        conditions.length === 0
          ? undefined
          : conditions.length === 1
            ? conditions[0]
            : and(...conditions);

      const results = await ctx.db
        .select()
        .from(doctor)
        .where(whereClause)
        .limit(input.limit);

      return results;
    }),
} satisfies TRPCRouterRecord;

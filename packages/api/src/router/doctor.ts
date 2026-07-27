import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { and, eq, like } from "drizzle-orm";
import { z } from "zod/v4";

import { doctor, doctorAvailability } from "@klaro/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";
import { isAdmin } from "../utils/admin";

const doctorSessionTypesSchema = z.array(
  z.enum(["chat_consult", "video_consult", "async_review"]),
);

const doctorFiltersSchema = z.object({
  specialization: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

const doctorCreateSchema = z.object({
  name: z.string().max(255),
  specialization: z.string().max(255),
  licenseNumber: z.string().max(100),
  bio: z.string().optional(),
  pricePerSession: z.number().positive(),
  availableSessionTypes: doctorSessionTypesSchema,
});

const doctorUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().max(255).optional(),
  bio: z.string().optional(),
  pricePerSession: z.number().positive().optional(),
  availableSessionTypes: doctorSessionTypesSchema.optional(),
});

const doctorByIdSchema = z.object({
  id: z.string().uuid(),
});

const doctorVerificationSchema = z.object({
  doctorId: z.string().uuid(),
  approved: z.boolean(),
  reason: z.string().optional(),
});

const availabilityCreateSchema = z.object({
  dayOfWeek: z.enum([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ]),
  startTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
});

const availabilityUpdateSchema = z.object({
  id: z.string().uuid(),
  dayOfWeek: z
    .enum([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ])
    .optional(),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}:\d{2}$/)
    .optional(),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}:\d{2}$/)
    .optional(),
});

const availabilityListSchema = z.object({
  doctorId: z.string().uuid(),
});

// Create availability for the signed-in doctor's profile
const createAvailability = protectedProcedure
  .input(availabilityCreateSchema)
  .mutation(async ({ ctx, input }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    // Find the doctor's record owned by this user
    const [doc] = await ctx.db
      .select()
      .from(doctor)
      .where(eq(doctor.userId, ctx.session.user.id));
    if (!doc) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Doctor profile not found for user",
      });
    }

    const [row] = await ctx.db
      .insert(doctorAvailability)
      .values({
        doctorId: doc.id,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
      })
      .returning();

    return { success: true, availability: row };
  });

const listAvailability = publicProcedure
  .input(availabilityListSchema)
  .query(async ({ ctx, input }) => {
    const rows = await ctx.db
      .select()
      .from(doctorAvailability)
      .where(eq(doctorAvailability.doctorId, input.doctorId));
    return rows;
  });

const updateAvailability = protectedProcedure
  .input(availabilityUpdateSchema)
  .mutation(async ({ ctx, input }) => {
    if (!ctx.session?.user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });

    const [existing] = await ctx.db
      .select()
      .from(doctorAvailability)
      .where(eq(doctorAvailability.id, input.id));
    if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

    const [doc] = await ctx.db
      .select()
      .from(doctor)
      .where(eq(doctor.id, existing.doctorId));
    if (!doc || doc.userId !== ctx.session.user.id)
      throw new TRPCError({ code: "FORBIDDEN" });

    const updateData: Partial<typeof doctorAvailability.$inferInsert> = {};
    if (input.dayOfWeek !== undefined) updateData.dayOfWeek = input.dayOfWeek;
    if (input.startTime !== undefined) updateData.startTime = input.startTime;
    if (input.endTime !== undefined) updateData.endTime = input.endTime;

    const [updated] = await ctx.db
      .update(doctorAvailability)
      .set(updateData)
      .where(eq(doctorAvailability.id, input.id))
      .returning();
    return { success: true, availability: updated ?? existing };
  });

const deleteAvailability = protectedProcedure
  .input(z.object({ id: z.string().uuid() }))
  .mutation(async ({ ctx, input }) => {
    if (!ctx.session?.user?.id) throw new TRPCError({ code: "UNAUTHORIZED" });
    const [existing] = await ctx.db
      .select()
      .from(doctorAvailability)
      .where(eq(doctorAvailability.id, input.id));
    if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
    const [doc] = await ctx.db
      .select()
      .from(doctor)
      .where(eq(doctor.id, existing.doctorId));
    if (!doc || doc.userId !== ctx.session.user.id)
      throw new TRPCError({ code: "FORBIDDEN" });
    await ctx.db
      .delete(doctorAvailability)
      .where(eq(doctorAvailability.id, input.id));
    return { success: true };
  });

const listDoctors = publicProcedure
  .input(doctorFiltersSchema)
  .query(async ({ ctx, input }) => {
    const conditions = [eq(doctor.isActive, true)];

    if (input.specialization) {
      conditions.push(like(doctor.specialization, `%${input.specialization}%`));
    }

    const whereClause =
      conditions.length === 1 ? conditions[0] : and(...conditions);

    const doctors = await ctx.db
      .select()
      .from(doctor)
      .where(whereClause)
      .limit(input.limit)
      .offset(input.offset);

    return doctors;
  });

const getDoctorById = publicProcedure
  .input(doctorByIdSchema)
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
  });

const createDoctor = protectedProcedure
  .input(doctorCreateSchema)
  .mutation(async ({ ctx, input }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User must be authenticated",
      });
    }

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
        isActive: false,
      })
      .returning();

    return {
      id: newDoctor?.id,
      status: "pending_verification",
      message: "Doctor registration submitted for verification",
    };
  });

const updateDoctor = protectedProcedure
  .input(doctorUpdateSchema)
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
  });

const togglePrcVerification = protectedProcedure
  .input(doctorVerificationSchema)
  .mutation(async ({ ctx, input }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User must be authenticated",
      });
    }

    if (!isAdmin(ctx)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can verify doctors",
      });
    }

    const [doc] = await ctx.db
      .select()
      .from(doctor)
      .where(eq(doctor.id, input.doctorId));

    if (!doc) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Doctor not found",
      });
    }

    const updatedStatus = input.approved ? "verified" : "rejected";

    const [updatedDoctor] = await ctx.db
      .update(doctor)
      .set({
        prcStatus: updatedStatus,
        isActive: input.approved,
      })
      .where(eq(doctor.id, input.doctorId))
      .returning();

    return {
      success: true,
      doctorId: updatedDoctor?.id ?? doc.id,
      status: updatedStatus,
      reason: input.reason,
    };
  });

export const doctorRouter = {
  /**
   * List all active doctors (public endpoint)
   */
  list: listDoctors,

  /**
   * Get doctor profile by ID
   */
  byId: getDoctorById,

  /**
   * Register as a doctor (protected)
   */
  register: createDoctor,

  /**
   * Update doctor profile (doctor-only)
   */
  update: updateDoctor,

  /**
   * Toggle PRC verification status for a doctor (admin endpoint)
   */
  togglePrcVerification,
  // Availability CRUD
  createAvailability,
  listAvailability,
  updateAvailability,
  deleteAvailability,

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

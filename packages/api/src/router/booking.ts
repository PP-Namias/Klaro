import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

import { booking, doctor, document } from "@klaro/db/schema";

import { protectedProcedure } from "../trpc";

export const bookingRouter = {
  /**
   * Create a booking with a doctor
   */
  create: protectedProcedure
    .input(
      z.object({
        doctorId: z.string().uuid(),
        sessionType: z.enum(["chat_consult", "video_consult", "async_review"]),
        scheduledAt: z.date(),
        documentId: z.string().uuid().optional(),
        notes: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        });
      }

      // Verify doctor exists
      const [doc] = await ctx.db
        .select()
        .from(doctor)
        .where(eq(doctor.id, input.doctorId));

      if (!doc?.isActive) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Doctor not available",
        });
      }

      // Verify document if provided
      if (input.documentId) {
        const [doc_check] = await ctx.db
          .select()
          .from(document)
          .where(eq(document.id, input.documentId));

        if (!doc_check || doc_check.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Document not found or you don't have access",
          });
        }
      }

      // Create booking
      const [newBooking] = await ctx.db
        .insert(booking)
        .values({
          userId: ctx.session.user.id,
          doctorId: input.doctorId,
          sessionType: input.sessionType,
          scheduledAt: input.scheduledAt,
          documentId: input.documentId,
          notes: input.notes,
          status: "scheduled",
        })
        .returning();

      return {
        id: newBooking?.id,
        status: "scheduled",
        message: "Booking created successfully",
      };
    }),

  /**
   * Get user's bookings
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        });
      }

      const bookings = await ctx.db
        .select()
        .from(booking)
        .where(eq(booking.userId, ctx.session.user.id))
        .limit(input.limit)
        .offset(input.offset);

      return bookings;
    }),

  /**
   * Get booking details
   */
  byId: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        });
      }

      const [book] = await ctx.db
        .select()
        .from(booking)
        .where(eq(booking.id, input.id));

      if (!book || book.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Booking not found",
        });
      }

      return book;
    }),

  /**
   * Cancel a booking
   */
  cancel: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        });
      }

      const [book] = await ctx.db
        .select()
        .from(booking)
        .where(eq(booking.id, input.id));

      if (!book || book.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Booking not found",
        });
      }

      if (book.status === "completed" || book.status === "cancelled") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot cancel a ${book.status} booking`,
        });
      }

      const [updatedBooking] = await ctx.db
        .update(booking)
        .set({ status: "cancelled" })
        .where(eq(booking.id, input.id))
        .returning();

      return {
        success: true,
        booking: updatedBooking ?? { ...book, status: "cancelled" },
      };
    }),

  /**
   * Reschedule a booking
   */
  reschedule: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        newScheduledAt: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        });
      }

      const [book] = await ctx.db
        .select()
        .from(booking)
        .where(eq(booking.id, input.id));

      if (!book || book.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Booking not found",
        });
      }

      if (book.status === "completed" || book.status === "cancelled") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot reschedule a ${book.status} booking`,
        });
      }

      const [updatedBooking] = await ctx.db
        .update(booking)
        .set({ scheduledAt: input.newScheduledAt })
        .where(eq(booking.id, input.id))
        .returning();

      return {
        success: true,
        booking: updatedBooking ?? {
          ...book,
          scheduledAt: input.newScheduledAt,
        },
      };
    }),
} satisfies TRPCRouterRecord;

import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

import { booking, doctor, payment } from "@klaro/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

export const paymentsRouter = {
  /**
   * Create a payment intent for a booking
   * Returns Stripe client secret for frontend payment processing
   */
  createIntent: protectedProcedure
    .input(
      z.object({
        bookingId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        });
      }

      // Verify booking exists and belongs to user
      const [book] = await ctx.db
        .select()
        .from(booking)
        .where(eq(booking.id, input.bookingId));

      if (!book || book.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Booking not found",
        });
      }

      // Get doctor to retrieve price
      const [doc] = await ctx.db
        .select()
        .from(doctor)
        .where(eq(doctor.id, book.doctorId));

      if (!doc) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Doctor not found",
        });
      }

      // TODO: Call Stripe API to create payment intent
      const amount = parseFloat(doc.pricePerSession);

      // For now, create a placeholder payment record
      const [newPayment] = await ctx.db
        .insert(payment)
        .values({
          bookingId: input.bookingId,
          userId: ctx.session.user.id,
          amount: amount.toString(),
          currency: "PHP",
          status: "pending",
          // TODO: Set actual Stripe IDs from API response
          stripePaymentIntentId: "pi_placeholder",
          stripeClientSecret: null,
        })
        .returning();

      return {
        paymentId: newPayment?.id,
        // TODO: Return actual clientSecret from Stripe API response
        clientSecret: null,
        amount,
        currency: "PHP",
        status: "pending",
      };
    }),

  /**
   * Get payment details
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

      const [pay] = await ctx.db
        .select()
        .from(payment)
        .where(eq(payment.id, input.id));

      if (!pay || pay.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Payment not found",
        });
      }

      return pay;
    }),

  /**
   * Get payment history for user
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

      const payments = await ctx.db
        .select()
        .from(payment)
        .where(eq(payment.userId, ctx.session.user.id))
        .limit(input.limit)
        .offset(input.offset);

      return payments;
    }),

  /**
   * Handle Stripe webhook for payment confirmation
   * Called by Stripe when payment status changes.
   * NOTE: In production, this should be a standalone API route (not tRPC)
   * with raw body parsing and stripe.webhooks.constructEvent() verification.
   */
  handleWebhook: publicProcedure
    .input(
      z.object({
        paymentIntentId: z.string(),
        status: z.enum(["succeeded", "failed", "canceled"]),
        stripeSignature: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: In production, verify webhook signature:
      // const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
      // For now, require stripeSignature to be present as a basic safeguard.
      if (!input.stripeSignature) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Missing Stripe webhook signature",
        });
      }

      // Find payment by Stripe intent ID
      const [pay] = await ctx.db
        .select()
        .from(payment)
        .where(eq(payment.stripePaymentIntentId, input.paymentIntentId));

      if (!pay) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found",
        });
      }

      // Map Stripe status to our status
      const statusMap = {
        succeeded: "completed",
        failed: "failed",
        canceled: "failed",
      } as const;

      const updatedStatus = statusMap[input.status];

      await ctx.db
        .update(payment)
        .set({ status: updatedStatus })
        .where(eq(payment.id, pay.id));

      if (updatedStatus === "completed") {
        await ctx.db
          .update(booking)
          .set({ status: "confirmed" })
          .where(eq(booking.id, pay.bookingId));
      }

      // Update payment status
      return {
        success: true,
        paymentId: pay.id,
        status: updatedStatus,
      };
    }),

  /**
   * Refund a completed payment
   */
  refund: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        });
      }

      const [pay] = await ctx.db
        .select()
        .from(payment)
        .where(eq(payment.id, input.id));

      if (!pay || pay.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Payment not found",
        });
      }

      if (pay.status !== "completed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only refund completed payments",
        });
      }

      // TODO: Call Stripe API to process refund
      await ctx.db
        .update(payment)
        .set({ status: "refunded" })
        .where(eq(payment.id, input.id));

      return { success: true };
    }),
} satisfies TRPCRouterRecord;

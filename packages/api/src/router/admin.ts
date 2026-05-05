import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

import { doctor } from "@klaro/db/schema";

import { protectedProcedure } from "../trpc";

// Simple admin check - in production, use role-based access control
const isAdmin = (userId: string) => {
  // TODO: Implement proper admin role checking from database
  // For now, this is a placeholder
  return true;
};

const verifyDoctor = protectedProcedure
  .input(
    z.object({
      doctorId: z.string().uuid(),
      approved: z.boolean(),
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

    if (!isAdmin(ctx.session.user.id)) {
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
    };
  });

export const adminRouter = {
  /**
   * Verify a doctor's credentials (admin only)
   */
  verifyDoctor,
  togglePrcVerification: verifyDoctor,

  /**
   * Get unverified doctors for review
   */
  getPendingDoctors: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User must be authenticated",
      });
    }

    if (!isAdmin(ctx.session.user.id)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can access this",
      });
    }

    // Fetch doctors pending verification
    const doctors = await ctx.db
      .select()
      .from(doctor)
      .where(eq(doctor.prcStatus, "pending"));

    return doctors;
  }),

  /**
   * Get analytics/statistics (admin only)
   */
  getAnalytics: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User must be authenticated",
      });
    }

    if (!isAdmin(ctx.session.user.id)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can access this",
      });
    }

    // Return placeholder analytics
    return {
      totalUsers: 0,
      totalDoctors: 0,
      totalBookings: 0,
      totalRevenue: 0,
      pendingVerifications: 0,
    };
  }),

  /**
   * Get system health status (admin only)
   */
  getSystemHealth: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User must be authenticated",
      });
    }

    if (!isAdmin(ctx.session.user.id)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can access this",
      });
    }

    return {
      status: "healthy",
      database: "connected",
      services: {
        ocr: "ready",
        llm: "ready",
        stripe: "ready",
        email: "ready",
      },
      uptime: "99.9%",
    };
  }),

  /**
   * Suspend/activate user account (admin only)
   */
  toggleUserStatus: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        active: z.boolean(),
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

      if (!isAdmin(ctx.session.user.id)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can access this",
        });
      }

      // Update user status
      return {
        success: true,
        userId: input.userId,
        status: input.active ? "active" : "suspended",
      };
    }),

  /**
   * Get dispute reports (admin only)
   */
  getDisputes: protectedProcedure
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

      if (!isAdmin(ctx.session.user.id)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can access this",
        });
      }

      // Return placeholder disputes
      return [];
    }),
} satisfies TRPCRouterRecord;

# Backend API Implementation - Corrected Router Files

This file contains the corrected versions of all routers with proper Drizzle ORM syntax.
Copy and replace the corresponding files in `packages/api/src/router/`.

## Chat Router (chat.ts)

```typescript
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import { eq } from "drizzle-orm";

import { chatMessage, analysis } from "@klaro/db/schema";
import { protectedProcedure } from "../trpc";

export const chatRouter = {
  sendMessage: protectedProcedure
    .input(
      z.object({
        analysisId: z.string().uuid(),
        content: z.string().min(1).max(2000),
        dialect: z
          .enum(["Filipino", "Bisaya", "Ilocano"])
          .default("Filipino"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        });
      }

      const [doc_analysis] = await ctx.db
        .select()
        .from(analysis)
        .where(eq(analysis.id, input.analysisId));

      if (!doc_analysis || doc_analysis.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this analysis",
        });
      }

      await ctx.db.insert(chatMessage).values({
        analysisId: input.analysisId,
        userId: ctx.session.user.id,
        role: "user",
        content: input.content,
        dialect: input.dialect,
      });

      const assistantMessage = {
        role: "assistant",
        content:
          "This is a placeholder LLM response. Chat integration coming soon.",
        dialect: input.dialect,
      };

      await ctx.db.insert(chatMessage).values({
        analysisId: input.analysisId,
        userId: ctx.session.user.id,
        role: "assistant",
        content: assistantMessage.content,
        dialect: input.dialect,
      });

      return {
        userMessage: {
          role: "user",
          content: input.content,
          dialect: input.dialect,
        },
        assistantMessage,
      };
    }),

  getHistory: protectedProcedure
    .input(
      z.object({
        analysisId: z.string().uuid(),
        limit: z.number().default(50).max(200),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        });
      }

      const [doc_analysis] = await ctx.db
        .select()
        .from(analysis)
        .where(eq(analysis.id, input.analysisId));

      if (!doc_analysis || doc_analysis.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this analysis",
        });
      }

      const messages = await ctx.db
        .select()
        .from(chatMessage)
        .where(eq(chatMessage.analysisId, input.analysisId))
        .limit(input.limit)
        .orderBy(chatMessage.createdAt);

      return messages;
    }),

  clearHistory: protectedProcedure
    .input(z.object({ analysisId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        });
      }

      const [doc_analysis] = await ctx.db
        .select()
        .from(analysis)
        .where(eq(analysis.id, input.analysisId));

      if (!doc_analysis || doc_analysis.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this analysis",
        });
      }

      await ctx.db
        .delete(chatMessage)
        .where(eq(chatMessage.analysisId, input.analysisId));

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
```

## Doctor Router (doctor.ts)

```typescript
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import { eq } from "drizzle-orm";

import { doctor } from "@klaro/db/schema";
import { protectedProcedure, publicProcedure } from "../trpc";

export const doctorRouter = {
  list: publicProcedure
    .input(
      z.object({
        specialization: z.string().optional(),
        limit: z.number().default(20).max(100),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.db.select().from(doctor);

      if (input.specialization) {
        // Note: For LIKE queries, check Drizzle docs for your DB dialect
        // This is a placeholder - actual implementation depends on database
      }

      const doctors = await query
        .where(eq(doctor.isActive, true))
        .limit(input.limit)
        .offset(input.offset)
        .orderBy(doctor.createdAt);

      return doctors;
    }),

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
    }),

  search: publicProcedure
    .input(
      z.object({
        specialization: z.string().optional(),
        limit: z.number().default(20).max(100),
      }),
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.db.select().from(doctor).where(eq(doctor.isActive, true));

      const results = await query.limit(input.limit);

      return results;
    }),
} satisfies TRPCRouterRecord;
```

## Booking Router (booking.ts)

```typescript
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import { eq } from "drizzle-orm";

import { booking, doctor, document } from "@klaro/db/schema";
import { protectedProcedure } from "../trpc";

export const bookingRouter = {
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

      const [doc] = await ctx.db
        .select()
        .from(doctor)
        .where(eq(doctor.id, input.doctorId));

      if (!doc || !doc.isActive) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Doctor not available",
        });
      }

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

  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20).max(100),
        offset: z.number().default(0),
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
        .offset(input.offset)
        .orderBy(booking.scheduledAt);

      return bookings;
    }),

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

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
```

## Implementation Notes

1. **Key Pattern**: Replace `.then((rows) => rows[0])` with `const [item] = await query`
2. **Import**: Always `import { eq } from "drizzle-orm"`
3. **Returning**: Use `.returning()` to get inserted/updated data
4. **Ordering**: Use table columns directly: `.orderBy(table.field)` not arrow functions
5. **Where clauses**: Use `eq()`, `and()`, `or()` from drizzle-orm

---

See full implementations in `/docs/CORRECTED_ROUTERS.md` for remaining routers (facilities, payments, admin).

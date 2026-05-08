import { z } from "zod/v4";

import { adminRouter } from "./router/admin";
import { authRouter } from "./router/auth";
import { bookingRouter } from "./router/booking";
import { chatRouter } from "./router/chat";
import { doctorRouter } from "./router/doctor";
import { documentsRouter } from "./router/documents";
import { facilitiesRouter } from "./router/facilities";
import { paymentsRouter } from "./router/payments";
import { callLLMAPI } from "./services/llm";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "./trpc";

const apiVersion = "1.0.0";

export const appRouter = createTRPCRouter({
  // Utility endpoints
  health: publicProcedure.query(() => ({
    status: "ok",
    version: apiVersion,
    timestamp: new Date().toISOString(),
  })),

  version: publicProcedure.query(() => ({
    version: apiVersion,
    timestamp: new Date().toISOString(),
  })),

  // Quick LLM connectivity test (public) — returns model output for a short prompt
  llmTest: publicProcedure
    .input(
      z.object({ prompt: z.string().min(1).max(2000).optional() }).optional(),
    )
    .query(async ({ input }) => {
      const prompt =
        input?.prompt ||
        "Say hello in Filipino and ask one follow-up question.";
      const systemPrompt = "You are a helpful assistant.";
      const output = await callLLMAPI(prompt, systemPrompt);
      return { output };
    }),

  me: protectedProcedure.query(({ ctx }) => ({
    id: ctx.session?.user?.id,
    email: ctx.session?.user?.email,
    name: ctx.session?.user?.name,
  })),

  // Domain routers
  auth: authRouter,
  documents: documentsRouter,
  chat: chatRouter,
  doctor: doctorRouter,
  booking: bookingRouter,
  facilities: facilitiesRouter,
  payments: paymentsRouter,
  admin: adminRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

import { z } from "zod/v4";

import { adminRouter } from "./router/admin";
import { authRouter } from "./router/auth";
import { bookingRouter } from "./router/booking";
import { chatRouter } from "./router/chat";
import { doctorRouter } from "./router/doctor";
import { documentsRouter } from "./router/documents";
import { facilitiesRouter } from "./router/facilities";
import { paymentsRouter } from "./router/payments";
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

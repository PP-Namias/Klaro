import { z } from "zod/v4";

export const signInInputSchema = z.object({
  provider: z.enum(["discord", "google"]).describe("OAuth provider"),
});

export const sessionSchema = z.object({
  id: z.string().uuid().describe("User ID"),
  email: z.string().email().describe("User email"),
  name: z.string().describe("User display name"),
  emailVerified: z.boolean().describe("Email verification status"),
});

export const logoutResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export type SignInInput = z.infer<typeof signInInputSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type LogoutResponse = z.infer<typeof logoutResponseSchema>;

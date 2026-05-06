import type { NextRequest } from "next/server";

import { getSession } from "~/auth/server";

export interface ValidSession {
  userId: string;
  email: string;
  name: string | null;
}

/**
 * Extract and validate user session from request context.
 * Returns validated session or null if not authenticated.
 */
export async function validateSession(): Promise<ValidSession | null> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return null;
    }

    return {
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name || null,
    };
  } catch (error) {
    console.error("session validation error:", error);
    return null;
  }
}

/**
 * Assert session exists, throw 401 if not.
 */
export async function assertSession(): Promise<ValidSession> {
  const session = await validateSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

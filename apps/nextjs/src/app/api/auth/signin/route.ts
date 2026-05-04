import { auth } from "~/auth/server";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "~/lib/rate-limit";

export async function GET(req: Request) {
  // Rate limit: 10 signin attempts per 15 minutes
  const key = req.headers.get("x-forwarded-for") || "unknown";
  const { allowed, remaining, resetAt } = checkRateLimit(
    `signin:${key}`,
    RATE_LIMITS.auth.signin.maxRequests,
    RATE_LIMITS.auth.signin.windowMs
  );

  if (!allowed) {
    return rateLimitResponse(remaining, resetAt);
  }

  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider") as "discord" | "google";

  if (!provider || !["discord", "google"].includes(provider)) {
    return Response.json(
      { error: "Invalid provider parameter. Use 'discord' or 'google'." },
      { status: 400 }
    );
  }

  try {
    // Get OAuth authorization URL from better-auth
    const signInUrl = await auth.api.signInSocial({
      provider,
      redirectURL: new URL(req.url).origin,
    });

    // Redirect to OAuth provider
    return Response.redirect(signInUrl, 302);
  } catch (error) {
    console.error(`OAuth signin error for ${provider}:`, error);
    return Response.json(
      { error: "Failed to initiate OAuth flow" },
      { status: 500 }
    );
  }
}

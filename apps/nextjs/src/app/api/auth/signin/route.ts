import { auth } from "~/auth/server";

export async function GET(req: Request) {
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

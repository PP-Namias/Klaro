import { auth } from "~/auth/server";
import { assertSession } from "~/lib/session-validation";

export async function POST(req: Request) {
  try {
    // Ensure user is authenticated
    const session = await assertSession();

    // Invalidate session using better-auth
    await auth.api.signOut({ asJSON: true });

    return Response.json(
      {
        success: true,
        message: "Session cleared. You have been logged out.",
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return Response.json(
        { error: "Unauthorized", details: "No active session" },
        { status: 401 },
      );
    }

    console.error("Logout error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

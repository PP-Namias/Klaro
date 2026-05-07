import { auth } from "~/auth/server";
import { headers } from "next/headers";
import { assertSession } from "~/lib/session-validation";

export async function POST() {
  try {
    await assertSession();

    await auth.api.signOut({ headers: await headers() });

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

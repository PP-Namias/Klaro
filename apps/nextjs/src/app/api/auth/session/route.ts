import { headers } from "next/headers";

import { auth } from "~/auth/server";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    return Response.json(
      {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name ?? "",
        emailVerified: Boolean(session.user.emailVerified),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/auth/session error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

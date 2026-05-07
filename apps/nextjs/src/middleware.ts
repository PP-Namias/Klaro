import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

export function middleware(_request: NextRequest) {
  // Klaro uses Better Auth route handlers for session management.
  // Keep middleware intentionally lightweight to avoid edge-runtime failures.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

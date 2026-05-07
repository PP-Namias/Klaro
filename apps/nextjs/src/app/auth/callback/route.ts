import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createClient } from "~/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/auth/error", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  return NextResponse.redirect(
    new URL(error ? "/auth/error" : "/", request.url),
  );
}

"use client";

import { useState } from "react";

import { createClient } from "~/lib/supabase/client";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleDiscordSignIn = async () => {
    setIsLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: "http://localhost:3000/auth/callback",
      },
    });

    if (error) {
      console.error("Discord sign-in failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-8 rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl shadow-black/30 backdrop-blur">
        <div className="space-y-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">
            Klaro
          </p>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
            Welcome to Klaro
          </h1>
          <p className="max-w-xl text-base text-slate-300 sm:text-lg">
            Connect with Discord to access document scan analysis, AI chat in
            Filipino dialects, clinic discovery, and consultation booking.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDiscordSignIn}
          disabled={isLoading}
          className="rounded-full bg-indigo-500 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Opening Discord..." : "Sign in to Klaro"}
        </button>
      </div>
    </main>
  );
}

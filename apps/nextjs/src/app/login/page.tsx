import Link from "next/link";

/* ──────────────────────────────────────────────
   SSO Sign-In Page
   Pure visual design — auth functionality
   will be wired after leader approval.
   ────────────────────────────────────────────── */

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#93C5FD] px-4">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-20 left-20 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute right-20 bottom-20 h-40 w-40 rounded-full bg-white/5 blur-2xl" />

        {/* Subtle medical cross pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg width="100%" height="100%">
            <defs>
              <pattern
                id="medical-crosses"
                x="0"
                y="0"
                width="60"
                height="60"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M25 15h10v10h10v10H35v10H25V35H15V25h10V15z"
                  fill="white"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#medical-crosses)" />
          </svg>
        </div>
      </div>

      {/* Sign-in Card */}
      <div className="relative z-10 w-full max-w-[420px]">
        {/* Card */}
        <div className="rounded-2xl border border-white/20 bg-white p-8 shadow-2xl shadow-black/20 sm:p-10">
          {/* Logo & Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#2563EB] shadow-lg shadow-blue-500/30">
              <span className="text-lg font-bold text-white">K</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1F2937]">
              Welcome to Klaro
            </h1>
            <p className="mt-2 text-sm text-[#6B7280]">
              Sign in to access your health companion
            </p>
          </div>

          {/* SSO Buttons */}
          <div className="space-y-3">
            {/* Google SSO Button */}
            <button
              type="button"
              className="group flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-[#1F2937] shadow-sm transition-all hover:border-gray-300 hover:bg-[#F9FAFB] hover:shadow-md active:scale-[0.98]"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            {/* Discord SSO Button */}
            <button
              type="button"
              className="group flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#5865F2] px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#4752C4] hover:shadow-md active:scale-[0.98]"
            >
              <DiscordIcon />
              Continue with Discord
            </button>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-medium text-[#9CA3AF]">
              SECURE SIGN-IN
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Trust Indicators */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-[#F0FDF4] px-4 py-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10B981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <p className="text-xs leading-relaxed text-[#166534]">
                Your data is encrypted and protected. We never share your health
                information without your consent.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-[#EFF6FF] px-4 py-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2563EB"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p className="text-xs leading-relaxed text-[#1E40AF]">
                Available in Filipino, Bisaya, Ilocano & English — your health,
                your language.
              </p>
            </div>
          </div>

          {/* Guest Option */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#6B7280]">
              No account?{" "}
              <Link
                href="/"
                className="font-semibold text-[#2563EB] transition-colors hover:text-[#1D4ED8]"
              >
                Try as Guest
              </Link>
            </p>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              Scan & analyze without signing in — limited features
            </p>
          </div>
        </div>

        {/* Footer below card */}
        <p className="mt-6 text-center text-xs text-blue-200/60">
          By continuing, you agree to Klaro&apos;s{" "}
          <a href="#" className="underline hover:text-white">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="underline hover:text-white">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-10 text-center">
        <h1 className="text-3xl font-black tracking-tight">Authentication failed</h1>
        <p className="text-slate-200">
          The Discord callback did not complete successfully. Try signing in
          again from the home page.
        </p>
      </div>
    </main>
  );
}
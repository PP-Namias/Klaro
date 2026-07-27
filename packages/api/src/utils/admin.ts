// Admin authorization via environment variable ADMIN_EMAILS (comma-separated).
// In production, replace with a proper role column on the user table.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdmin(ctx: { db: any; session: any }): boolean {
  if (!ctx.session?.user?.id) return false;
  if (ADMIN_EMAILS.length === 0) return false;
  const email = ctx.session.user.email?.toLowerCase();
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}

export function requireAdmin(ctx: { db: any; session: any }): boolean {
  return isAdmin(ctx);
}

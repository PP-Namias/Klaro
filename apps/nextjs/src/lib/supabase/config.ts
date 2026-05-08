// eslint-disable-next-line no-restricted-properties
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
// eslint-disable-next-line no-restricted-properties
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const hasSupabaseConfig = Boolean(supabaseUrl && supabasePublishableKey);

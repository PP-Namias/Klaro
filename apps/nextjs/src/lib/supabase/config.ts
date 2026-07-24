import { env } from "~/env";

export const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
export const supabasePublishableKey =
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabasePublishableKey);

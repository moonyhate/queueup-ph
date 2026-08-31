import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // Surfaced in the browser console during local/dev misconfiguration.
  // We don't throw at import time so the app can still render a helpful
  // "not configured" screen instead of a blank crash page.
  // eslint-disable-next-line no-console
  console.warn(
    "Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "", {
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

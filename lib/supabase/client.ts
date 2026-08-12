import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export function createClient() {
  // Deliberately static `process.env.NEXT_PUBLIC_...` references, not a
  // dynamic helper — this file runs in the browser, and Next.js can only
  // inline a NEXT_PUBLIC_ value into the client bundle when it can see the
  // exact variable name written directly in the source.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them to .env.local — see docs/ARCHITECTURE.md for what's needed."
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

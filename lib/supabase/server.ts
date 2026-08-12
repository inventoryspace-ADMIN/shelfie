import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Add it to .env.local — see docs/ARCHITECTURE.md for what's needed.`
    );
  }
  return value;
}

/**
 * A Supabase client for use in Server Components, Server Actions, and
 * Route Handlers. Carries the visitor's session (if any) via cookies, so
 * every query is subject to that visitor's RLS policies — not an admin
 * client. See lib/supabase/admin.ts for the one exception (the click
 * redirect route).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component, which can't set cookies —
            // safe to ignore because middleware.ts refreshes the session
            // on every request anyway.
          }
        },
      },
    }
  );
}

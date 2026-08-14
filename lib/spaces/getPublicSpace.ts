import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Shared by every public route (the space page, the per-item detail page,
// and generateMetadata for both) so a request only ever queries the
// profile+space once — React's cache() dedupes calls with the same
// arguments within one render, regardless of how many places call it.
export const getPublicSpace = cache(async (username: string, slug: string) => {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", username)
    .maybeSingle();
  if (!profile) return null;

  const { data: space } = await supabase
    .from("spaces")
    .select(
      "id, name, status, accent_color, font_pairing, background_treatment, card_shape, grid_density, layout_mode, value_display_mode, value_currency"
    )
    .eq("owner_id", profile.id)
    .eq("slug", slug)
    .maybeSingle();
  // RLS already restricts this to published spaces, or the owner's own —
  // if nothing came back, "doesn't exist" and "exists but is a private
  // draft" are indistinguishable on purpose (see docs/DESIGN-SYSTEM.md
  // 404 state: a guessed URL can't be used to confirm either way).
  if (!space) return null;

  return { profile, space };
});

export type PublicSpaceResult = NonNullable<
  Awaited<ReturnType<typeof getPublicSpace>>
>;

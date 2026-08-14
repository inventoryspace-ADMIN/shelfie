import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

type PageParams = { username: string };

// Shared by generateMetadata and the page body so a request only queries
// once — same pattern as lib/spaces/getPublicSpace.ts, but this route
// needs every published space, not one specific one.
const getPublishedSpaces = cache(async (username: string) => {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", username)
    .maybeSingle();
  if (!profile) return null;

  const { data: spaces } = await supabase
    .from("spaces")
    .select("id, name, slug, template")
    .eq("owner_id", profile.id)
    .eq("status", "published")
    .order("created_at", { ascending: true });

  return { profile, spaces: spaces ?? [] };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { username } = await params;
  const result = await getPublishedSpaces(username);
  if (!result || result.spaces.length === 0) notFound();

  const ownerName = result.profile.display_name ?? result.profile.username;
  return {
    title: `${ownerName} — Shelfie`,
    description: `${ownerName}'s spaces on Shelfie.`,
    // Same privacy rule as every other public route — see docs/ROADMAP.md
    // Phase 5.
    robots: { index: false, follow: false },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { username } = await params;
  const result = await getPublishedSpaces(username);

  // "Doesn't exist" and "exists but has nothing published" are
  // indistinguishable here on purpose, same privacy reasoning as
  // lib/spaces/getPublicSpace.ts.
  if (!result || result.spaces.length === 0) notFound();

  const { profile, spaces } = result;

  if (spaces.length === 1) {
    redirect(`/${username}/${spaces[0].slug}`);
  }

  const ownerName = profile.display_name ?? profile.username;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-8 px-6 py-16 text-center">
      <h1 className="text-2xl font-medium tracking-wide">{ownerName}</h1>
      <div className="flex flex-col gap-3">
        {spaces.map((space) => (
          <Link
            key={space.id}
            href={`/${username}/${space.slug}`}
            className="rounded border border-neutral-300 px-4 py-3 text-sm font-medium hover:border-neutral-500"
          >
            {space.name}
          </Link>
        ))}
      </div>
    </main>
  );
}

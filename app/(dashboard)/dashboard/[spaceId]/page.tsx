import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { templates } from "@/lib/templates";
import { EditableSpaceName } from "@/components/dashboard/EditableSpaceName";
import { DashboardItemCard } from "@/components/dashboard/DashboardItemCard";
import { PublishToggle } from "@/components/dashboard/PublishToggle";
import { CopyLinkButton } from "@/components/dashboard/CopyLinkButton";
import { ExpandingToolbar } from "@/components/dashboard/ExpandingToolbar";
import { DevicePreview } from "@/components/dashboard/DevicePreview";
import { SpaceGrid } from "@/components/space/SpaceGrid";
import { withCacheBust } from "@/lib/images/uploadItemImage";
import { getSiteOrigin } from "@/lib/site";
import { GRID_DENSITY_SIZES, isGridDensityKey } from "@/lib/themes/tokens";

export default async function SpacePage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: space } = await supabase
    .from("spaces")
    .select(
      "id, name, slug, template, status, owner_id, created_at, grid_density, first_published_at"
    )
    .eq("id", spaceId)
    .single();

  // A published space is publicly readable via RLS, but this dashboard
  // view is owner-only — so we check ownership explicitly rather than
  // trusting "a row came back" the way the public page will in Phase 5.
  if (!space || space.owner_id !== user.id) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  const { data: items } = await supabase
    .from("items")
    .select(
      "id, title, category, value, primary_image_path, hover_image_path, updated_at"
    )
    .eq("space_id", spaceId)
    .order("sort_order", { ascending: true });

  const bucket = supabase.storage.from("space-images");
  const publicUrl = profile
    ? `${await getSiteOrigin()}/${profile.username}/${space.slug}`
    : null;
  // Same grid_density the public page reads — see components/space/SpaceGrid.tsx.
  // Falls back to the column's own database default if somehow invalid.
  const gridDensityKey = isGridDensityKey(space.grid_density)
    ? space.grid_density
    : "comfortable";

  const gridContent =
    items && items.length > 0 ? (
      <SpaceGrid gridDensity={gridDensityKey}>
        {items.map((item) => (
          <DashboardItemCard
            key={item.id}
            spaceId={spaceId}
            sizes={GRID_DENSITY_SIZES[gridDensityKey]}
            item={{
              id: item.id,
              title: item.title,
              category: item.category,
              value: item.value,
              primaryImageUrl: withCacheBust(
                bucket.getPublicUrl(item.primary_image_path).data.publicUrl,
                item.updated_at
              ),
              hoverImageUrl: item.hover_image_path
                ? withCacheBust(
                    bucket.getPublicUrl(item.hover_image_path).data
                      .publicUrl,
                    item.updated_at
                  )
                : null,
            }}
            valueLabel={item.value != null ? String(item.value) : null}
          />
        ))}
      </SpaceGrid>
    ) : (
      <div className="rounded border border-dashed border-neutral-300 p-8 text-center">
        <p className="text-sm text-neutral-500">No items yet.</p>
        <Link
          href={`/dashboard/${spaceId}/items/new`}
          className="mt-3 inline-block text-sm font-medium underline"
        >
          Add your first item
        </Link>
      </div>
    );

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-10 p-8 lg:max-w-6xl">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-neutral-500 underline">
          ← Back
        </Link>
        <Link
          href={`/dashboard/${spaceId}/settings`}
          aria-label="Space settings"
          title="Settings"
          className="rounded p-1.5 text-neutral-400 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
          </svg>
        </Link>
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <EditableSpaceName spaceId={space.id} initialName={space.name} />
        <p className="text-sm text-neutral-500">
          {templates[space.template as keyof typeof templates]?.label ??
            space.template}{" "}
          · /{space.slug}
          {space.status === "draft" && (
            <>
              {" "}
              · <span className="font-medium text-neutral-600">Draft</span>
            </>
          )}
        </p>
      </div>

      <ExpandingToolbar>
        <Link
          href={`/dashboard/${spaceId}/items/new`}
          className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          Add item
        </Link>
        {profile && (
          <PublishToggle
            spaceId={space.id}
            status={space.status as "draft" | "published"}
            slug={space.slug}
            username={profile.username}
            hasEverPublished={space.first_published_at != null}
            hasItems={!!items && items.length > 0}
          />
        )}
        {profile && (
          <Link
            href={`/${profile.username}/${space.slug}`}
            target="_blank"
            className="rounded border border-neutral-300 px-3 py-1.5 text-sm font-medium"
          >
            Preview
          </Link>
        )}
        {space.status === "published" && publicUrl && (
          <CopyLinkButton url={publicUrl} />
        )}
      </ExpandingToolbar>

      <hr className="border-t border-neutral-200" />

      {profile ? (
        <DevicePreview url={`/${profile.username}/${space.slug}`}>
          {gridContent}
        </DevicePreview>
      ) : (
        gridContent
      )}
    </main>
  );
}

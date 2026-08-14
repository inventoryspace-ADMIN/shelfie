import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { templates } from "@/lib/templates";
import { EditableSpaceName } from "@/components/dashboard/EditableSpaceName";
import { DashboardItemCard } from "@/components/dashboard/DashboardItemCard";
import { PublishToggle } from "@/components/dashboard/PublishToggle";
import { CopyLinkButton } from "@/components/dashboard/CopyLinkButton";
import { DevicePreview } from "@/components/dashboard/DevicePreview";
import { SpaceGrid } from "@/components/space/SpaceGrid";
import { withCacheBust } from "@/lib/images/uploadItemImage";
import { getSiteOrigin } from "@/lib/site";
import { isGridDensityKey } from "@/lib/themes/tokens";

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
    .select("id, name, slug, template, status, owner_id, created_at, grid_density")
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

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-10 p-8 lg:max-w-6xl">
      <Link href="/dashboard" className="text-sm text-neutral-500 underline">
        ← Back
      </Link>

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

      <div className="flex flex-wrap items-start justify-center gap-3">
        <Link
          href={`/dashboard/${spaceId}/items/new`}
          className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          Add item
        </Link>
        <PublishToggle spaceId={space.id} status={space.status as "draft" | "published"} />
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
      </div>

      {profile && (
        <DevicePreview url={`/${profile.username}/${space.slug}`} />
      )}

      <hr className="border-t border-neutral-200" />

      {items && items.length > 0 ? (
        <SpaceGrid gridDensity={gridDensityKey}>
          {items.map((item) => (
            <DashboardItemCard
              key={item.id}
              spaceId={spaceId}
              item={{
                id: item.id,
                title: item.title,
                category: item.category,
                value: item.value,
                primaryImageUrl: withCacheBust(
                  bucket.getPublicUrl(item.primary_image_path).data
                    .publicUrl,
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
      )}
    </main>
  );
}

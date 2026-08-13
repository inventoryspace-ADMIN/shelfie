import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { templates } from "@/lib/templates";
import { EditableSpaceName } from "@/components/dashboard/EditableSpaceName";
import { ItemCard } from "@/components/space/ItemCard";
import { DeleteItemButton } from "@/components/dashboard/DeleteItemButton";
import { withCacheBust } from "@/lib/images/uploadItemImage";

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
    .select("id, name, slug, template, status, owner_id, created_at")
    .eq("id", spaceId)
    .single();

  // A published space is publicly readable via RLS, but this dashboard
  // view is owner-only — so we check ownership explicitly rather than
  // trusting "a row came back" the way the public page will in Phase 5.
  if (!space || space.owner_id !== user.id) {
    notFound();
  }

  const { data: items } = await supabase
    .from("items")
    .select(
      "id, title, category, value, primary_image_path, hover_image_path, updated_at"
    )
    .eq("space_id", spaceId)
    .order("sort_order", { ascending: true });

  const bucket = supabase.storage.from("space-images");

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

      <div className="flex justify-center">
        <Link
          href={`/dashboard/${spaceId}/items/new`}
          className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          Add item
        </Link>
      </div>

      <hr className="border-t border-neutral-200" />

      {items && items.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => (
            <div key={item.id}>
              <ItemCard
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
              <div className="mt-2 flex justify-center gap-3">
                <Link
                  href={`/dashboard/${spaceId}/items/${item.id}/edit`}
                  className="text-xs underline"
                >
                  Edit
                </Link>
                <DeleteItemButton
                  itemId={item.id}
                  spaceId={spaceId}
                  itemTitle={item.title}
                />
              </div>
            </div>
          ))}
        </div>
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

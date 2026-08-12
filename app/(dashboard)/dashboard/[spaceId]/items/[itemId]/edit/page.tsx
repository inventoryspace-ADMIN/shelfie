import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ItemForm } from "@/components/dashboard/ItemForm";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ spaceId: string; itemId: string }>;
}) {
  const { spaceId, itemId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: space } = await supabase
    .from("spaces")
    .select("id, name, owner_id, value_display_mode, value_currency")
    .eq("id", spaceId)
    .single();

  if (!space || space.owner_id !== user.id) {
    notFound();
  }

  const { data: item } = await supabase
    .from("items")
    .select(
      "id, title, description, category, value, outbound_url, primary_image_path, hover_image_path, attributes"
    )
    .eq("id", itemId)
    .eq("space_id", spaceId)
    .single();

  if (!item) {
    notFound();
  }

  const bucket = supabase.storage.from("space-images");

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col gap-6 p-8 lg:max-w-3xl">
      <div>
        <Link
          href={`/dashboard/${spaceId}`}
          className="text-sm text-neutral-500 underline"
        >
          ← Back to {space.name}
        </Link>
        <h1 className="mt-2 text-2xl font-medium tracking-wide">Edit item</h1>
      </div>
      <ItemForm
        spaceId={space.id}
        ownerId={user.id}
        valueDisplayMode={
          space.value_display_mode as "hidden" | "currency" | "number"
        }
        valueCurrency={space.value_currency}
        existingItem={{
          id: item.id,
          title: item.title,
          description: item.description,
          category: item.category,
          value: item.value,
          outboundUrl: item.outbound_url,
          primaryImagePath: item.primary_image_path,
          hoverImagePath: item.hover_image_path,
          primaryImageUrl: bucket.getPublicUrl(item.primary_image_path).data
            .publicUrl,
          hoverImageUrl: item.hover_image_path
            ? bucket.getPublicUrl(item.hover_image_path).data.publicUrl
            : null,
          attributes: item.attributes,
        }}
      />
    </main>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ItemForm } from "@/components/dashboard/ItemForm";

export default async function NewItemPage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = await params;
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

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col gap-6 p-8 lg:max-w-3xl">
      <div>
        <Link
          href={`/dashboard/${spaceId}`}
          className="text-sm text-neutral-500 underline"
        >
          ← Back to {space.name}
        </Link>
        <h1 className="mt-2 text-2xl font-medium tracking-wide">Add item</h1>
      </div>
      <ItemForm
        spaceId={space.id}
        ownerId={user.id}
        valueDisplayMode={
          space.value_display_mode as "hidden" | "currency" | "number"
        }
        valueCurrency={space.value_currency}
      />
    </main>
  );
}

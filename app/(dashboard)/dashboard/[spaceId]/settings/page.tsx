import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SpaceSettingsForm } from "@/components/dashboard/SpaceSettingsForm";

export default async function SpaceSettingsPage({
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
    .select("id, name, slug, owner_id, value_display_mode, value_currency")
    .eq("id", spaceId)
    .single();

  if (!space || space.owner_id !== user.id) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  const valueDisplayMode =
    space.value_display_mode === "currency" || space.value_display_mode === "number"
      ? space.value_display_mode
      : "hidden";

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col gap-6 p-8">
      <div>
        <Link
          href={`/dashboard/${spaceId}`}
          className="text-sm text-neutral-500 underline"
        >
          ← Back to {space.name}
        </Link>
        <h1 className="mt-2 text-2xl font-medium tracking-wide">Settings</h1>
      </div>
      <SpaceSettingsForm
        spaceId={space.id}
        username={profile?.username ?? "yourname"}
        initialSlug={space.slug}
        initialValueDisplayMode={valueDisplayMode}
        initialValueCurrency={space.value_currency}
      />
    </main>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { templates } from "@/lib/templates";
import { RenameSpaceForm } from "@/components/dashboard/RenameSpaceForm";

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

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col gap-6 p-8">
      <div>
        <Link href="/dashboard" className="text-sm text-neutral-500 underline">
          ← Back
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <h1 className="text-2xl font-medium tracking-wide">{space.name}</h1>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              space.status === "published"
                ? "bg-green-100 text-green-800"
                : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {space.status}
          </span>
        </div>
        <p className="text-sm text-neutral-500">
          {templates[space.template as keyof typeof templates]?.label ??
            space.template}{" "}
          · /{space.slug}
        </p>
      </div>

      <RenameSpaceForm spaceId={space.id} initialName={space.name} />

      <p className="rounded border border-dashed border-neutral-300 p-4 text-center text-sm text-neutral-500">
        No items yet — that&apos;s Phase 4.
      </p>
    </main>
  );
}

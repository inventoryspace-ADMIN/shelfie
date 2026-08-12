import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { templates } from "@/lib/templates";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const [{ data: profile }, { data: spaces }] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", user.id)
      .single(),
    supabase
      .from("spaces")
      .select("id, name, slug, template, status")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">Signed in as</p>
          <h1 className="text-xl font-medium tracking-wide">
            {profile?.display_name || profile?.username || user.email}
          </h1>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded border border-neutral-300 px-3 py-1.5 text-sm font-medium"
          >
            Sign out
          </button>
        </form>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Your spaces</h2>
        <Link
          href="/dashboard/new"
          className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          New space
        </Link>
      </div>

      {spaces && spaces.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {spaces.map((space) => (
            <li key={space.id}>
              <Link
                href={`/dashboard/${space.id}`}
                className="flex items-center justify-between rounded border border-neutral-200 px-4 py-3 hover:bg-neutral-50"
              >
                <div>
                  <p className="font-medium">{space.name}</p>
                  <p className="text-xs text-neutral-500">
                    {templates[space.template as keyof typeof templates]
                      ?.label ?? space.template}{" "}
                    · /{space.slug}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    space.status === "published"
                      ? "bg-green-100 text-green-800"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {space.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded border border-dashed border-neutral-300 p-8 text-center">
          <p className="text-sm text-neutral-500">
            You don&apos;t have any spaces yet.
          </p>
          <Link
            href="/dashboard/new"
            className="mt-3 inline-block text-sm font-medium underline"
          >
            Create your first space
          </Link>
        </div>
      )}
    </main>
  );
}

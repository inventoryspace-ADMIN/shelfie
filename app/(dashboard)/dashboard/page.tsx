import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .single();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-sm text-neutral-500">Signed in as</p>
      <h1 className="text-2xl font-medium tracking-wide">
        {profile?.display_name || profile?.username || user.email}
      </h1>
      <p className="text-sm text-neutral-500">
        No spaces yet — that&apos;s Phase 3.
      </p>
      <form action={signOut}>
        <button
          type="submit"
          className="mt-4 rounded border border-neutral-300 px-4 py-2 text-sm font-medium"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}

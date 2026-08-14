"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createSpaceSchema,
  renameSpaceSchema,
  spaceSlugSchema,
  updateSpaceSettingsSchema,
  type CreateSpaceInput,
  type RenameSpaceInput,
  type UpdateSpaceSettingsInput,
} from "@/lib/validations/space";

// excludeSpaceId lets the settings form check "is this slug free" without
// the space's own current row counting as a conflict against itself.
export async function checkSlugAvailable(
  rawSlug: string,
  excludeSpaceId?: string
): Promise<boolean> {
  const parsed = spaceSlugSchema.safeParse(rawSlug);
  if (!parsed.success) return false;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  let query = supabase
    .from("spaces")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id)
    .eq("slug", parsed.data);

  if (excludeSpaceId) {
    query = query.neq("id", excludeSpaceId);
  }

  const { count } = await query;

  return count === 0;
}

export async function createSpace(
  input: CreateSpaceInput
): Promise<{ error: string } | undefined> {
  const parsed = createSpaceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { data, error } = await supabase
    .from("spaces")
    .insert({ ...parsed.data, owner_id: user.id })
    .select("id")
    .single();

  if (error) {
    if (error.message.toLowerCase().includes("duplicate key")) {
      return { error: "You already have a space with that URL." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard/${data.id}`);
}

export async function renameSpace(
  input: RenameSpaceInput
): Promise<{ error: string } | undefined> {
  const parsed = renameSpaceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("spaces")
    .update({ name: parsed.data.name })
    .eq("id", parsed.data.spaceId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${parsed.data.spaceId}`);
}

export async function setSpaceStatus(
  spaceId: string,
  status: "draft" | "published"
): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: space } = await supabase
    .from("spaces")
    .select("owner_id, slug")
    .eq("id", spaceId)
    .single();

  if (!space || space.owner_id !== user.id) {
    return { error: "Space not found." };
  }

  // Enforced here, not just in the UI — see docs/ROADMAP.md Phase 3: a
  // space can never be published with zero items.
  if (status === "published") {
    const { count } = await supabase
      .from("items")
      .select("id", { count: "exact", head: true })
      .eq("space_id", spaceId);

    if (!count) {
      return { error: "Add at least one item before publishing." };
    }
  }

  const { error } = await supabase
    .from("spaces")
    .update({ status })
    .eq("id", spaceId);

  if (error) {
    return { error: error.message };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  revalidatePath(`/dashboard/${spaceId}`);
  if (profile) {
    revalidatePath(`/${profile.username}/${space.slug}`);
  }
}

export async function updateSpaceSettings(
  input: UpdateSpaceSettingsInput
): Promise<{ error: string } | undefined> {
  const parsed = updateSpaceSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { spaceId, slug, valueDisplayMode, valueCurrency } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: space } = await supabase
    .from("spaces")
    .select("owner_id, slug")
    .eq("id", spaceId)
    .single();

  if (!space || space.owner_id !== user.id) {
    return { error: "Space not found." };
  }

  if (slug !== space.slug && !(await checkSlugAvailable(slug, spaceId))) {
    return { error: "You already have a space with that URL." };
  }

  const { error } = await supabase
    .from("spaces")
    .update({
      slug,
      value_display_mode: valueDisplayMode,
      value_currency: valueDisplayMode === "currency" ? valueCurrency : null,
    })
    .eq("id", spaceId);

  if (error) {
    if (error.message.toLowerCase().includes("duplicate key")) {
      return { error: "You already have a space with that URL." };
    }
    return { error: error.message };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  revalidatePath(`/dashboard/${spaceId}`);
  revalidatePath(`/dashboard/${spaceId}/settings`);
  if (profile) {
    // Both the old and new slug's public routes need revalidating when
    // the slug changed — the old one now 404s, the new one now resolves.
    revalidatePath(`/${profile.username}/${space.slug}`);
    if (slug !== space.slug) {
      revalidatePath(`/${profile.username}/${slug}`);
    }
  }
}

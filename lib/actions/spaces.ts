"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createSpaceSchema,
  renameSpaceSchema,
  spaceSlugSchema,
  type CreateSpaceInput,
  type RenameSpaceInput,
} from "@/lib/validations/space";

export async function checkSlugAvailable(rawSlug: string): Promise<boolean> {
  const parsed = spaceSlugSchema.safeParse(rawSlug);
  if (!parsed.success) return false;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { count } = await supabase
    .from("spaces")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id)
    .eq("slug", parsed.data);

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

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { itemBaseSchema, updateItemBaseSchema } from "@/lib/validations/item";
import { templates, type TemplateKey } from "@/lib/templates";
import type { Json } from "@/types/supabase";

async function getOwnedSpaceTemplate(
  spaceId: string,
  userId: string
): Promise<TemplateKey | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("spaces")
    .select("template, owner_id")
    .eq("id", spaceId)
    .single();

  if (!data || data.owner_id !== userId) return null;
  return data.template as TemplateKey;
}

export async function createItem(
  input: unknown,
  itemId: string,
  rawAttributes: unknown
): Promise<{ error: string } | undefined> {
  const parsed = itemBaseSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const template = await getOwnedSpaceTemplate(parsed.data.spaceId, user.id);
  if (!template) {
    return { error: "Space not found." };
  }

  const attributesResult =
    templates[template].attributesSchema.safeParse(rawAttributes);
  if (!attributesResult.success) {
    return {
      error: attributesResult.error.issues[0]?.message ?? "Invalid fields",
    };
  }

  const { data: maxSortRow } = await supabase
    .from("items")
    .select("sort_order")
    .eq("space_id", parsed.data.spaceId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSortOrder = (maxSortRow?.sort_order ?? -1) + 1;
  const { spaceId, title, value, description, category, outboundUrl } =
    parsed.data;

  const { error } = await supabase.from("items").insert({
    id: itemId,
    space_id: spaceId,
    title,
    value: value ?? null,
    description: description || null,
    category: category || null,
    outbound_url: outboundUrl || null,
    primary_image_path: parsed.data.primaryImagePath,
    hover_image_path: parsed.data.hoverImagePath || null,
    attributes: attributesResult.data as Json,
    sort_order: nextSortOrder,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/${spaceId}`);
  redirect(`/dashboard/${spaceId}`);
}

export async function updateItem(
  input: unknown,
  rawAttributes: unknown
): Promise<{ error: string } | undefined> {
  const parsed = updateItemBaseSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const template = await getOwnedSpaceTemplate(parsed.data.spaceId, user.id);
  if (!template) {
    return { error: "Space not found." };
  }

  const attributesResult =
    templates[template].attributesSchema.safeParse(rawAttributes);
  if (!attributesResult.success) {
    return {
      error: attributesResult.error.issues[0]?.message ?? "Invalid fields",
    };
  }

  const { itemId, spaceId, title, value, description, category, outboundUrl } =
    parsed.data;

  const { error } = await supabase
    .from("items")
    .update({
      title,
      value: value ?? null,
      description: description || null,
      category: category || null,
      outbound_url: outboundUrl || null,
      primary_image_path: parsed.data.primaryImagePath,
      hover_image_path: parsed.data.hoverImagePath || null,
      attributes: attributesResult.data as Json,
    })
    .eq("id", itemId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/${spaceId}`);
  redirect(`/dashboard/${spaceId}`);
}

export async function deleteItem(
  itemId: string,
  spaceId: string
): Promise<{ error: string } | undefined> {
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("items")
    .select("primary_image_path, hover_image_path")
    .eq("id", itemId)
    .single();

  const { error } = await supabase.from("items").delete().eq("id", itemId);
  if (error) {
    return { error: error.message };
  }

  if (item) {
    const paths = [item.primary_image_path, item.hover_image_path].filter(
      (p): p is string => !!p
    );
    if (paths.length > 0) {
      await supabase.storage.from("space-images").remove(paths);
    }
  }

  revalidatePath(`/dashboard/${spaceId}`);
}

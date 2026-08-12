import { createClient } from "@/lib/supabase/client";

// Uploads happen directly from the browser to Supabase Storage (not
// through a Server Action) — the Storage RLS policies already scope
// writes to the signed-in owner's own folder, so there's no reason to
// relay the image bytes through our server twice.
export async function uploadItemImage(params: {
  ownerId: string;
  spaceId: string;
  itemId: string;
  slot: "primary" | "hover";
  dataUrl: string;
}): Promise<string> {
  const supabase = createClient();
  const blob = await (await fetch(params.dataUrl)).blob();
  const path = `${params.ownerId}/${params.spaceId}/${params.itemId}/${params.slot}.png`;

  const { error } = await supabase.storage
    .from("space-images")
    .upload(path, blob, { contentType: "image/png", upsert: true });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  return path;
}

export function getItemImageUrl(path: string): string {
  const supabase = createClient();
  return supabase.storage.from("space-images").getPublicUrl(path).data
    .publicUrl;
}

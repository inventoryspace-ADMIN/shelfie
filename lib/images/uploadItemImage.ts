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

// Item images live at a stable, predictable path per item+slot (see
// `path` above) and get overwritten in place (`upsert: true`) on every
// re-save, so the public URL never changes even when the underlying file
// does. Browsers — and Supabase's own CDN in front of Storage — cache by
// URL, so without this, a freshly re-processed photo can keep showing
// stale, cached bytes for a while after saving, even though the database
// row and page HTML are already up to date. Appending the row's
// `updated_at` as a query param gives every real change a new URL, so
// every cache treats it as a different resource, without needing to
// change the storage path itself.
export function withCacheBust(url: string, updatedAt: string): string {
  return `${url}?v=${new Date(updatedAt).getTime()}`;
}

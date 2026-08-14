import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublicSpace } from "@/lib/spaces/getPublicSpace";
import { resolveSpaceTheme } from "@/lib/themes/resolveSpaceTheme";
import { withCacheBust } from "@/lib/images/uploadItemImage";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type PageParams = { username: string; slug: string };

// Rendered by Next.js's file-convention (see docs/ARCHITECTURE.md
// "Generated share images") and wired into the page's og:image /
// twitter:image meta tags automatically — nothing in generateMetadata
// needs to point at this manually. Uses each space's own accent and
// background colors so the share card visually matches the space it
// links to. No custom font pairing here (satori, the renderer behind
// ImageResponse, needs font bytes loaded explicitly, not a next/font
// className) — the default sans is a deliberate simplification, not a
// gap in the six-axis theme system itself.
export default async function Image({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { username, slug } = await params;
  const result = await getPublicSpace(username, slug);
  if (!result) notFound();
  const { profile, space } = result;

  const supabase = await createClient();
  const [{ data: items }, { count: itemCount }] = await Promise.all([
    supabase
      .from("items")
      .select("primary_image_path, updated_at")
      .eq("space_id", space.id)
      .order("sort_order", { ascending: true })
      .limit(3),
    supabase
      .from("items")
      .select("id", { count: "exact", head: true })
      .eq("space_id", space.id),
  ]);

  const bucket = supabase.storage.from("space-images");
  const previewUrls = (items ?? []).map((item) =>
    withCacheBust(
      bucket.getPublicUrl(item.primary_image_path).data.publicUrl,
      item.updated_at
    )
  );

  const theme = resolveSpaceTheme(space);
  const ownerName = profile.display_name ?? profile.username;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          backgroundColor: theme.background,
          color: theme.foreground,
        }}
      >
        <div
          style={{ width: 56, height: 6, borderRadius: 3, backgroundColor: theme.accentHex, display: "flex" }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 64, fontWeight: 600, display: "flex" }}>
            {space.name}
          </div>
          <div style={{ fontSize: 28, opacity: 0.7, display: "flex" }}>
            {ownerName} · {itemCount ?? 0} {itemCount === 1 ? "item" : "items"}
          </div>
        </div>

        {previewUrls.length > 0 && (
          <div style={{ display: "flex", gap: 24 }}>
            {previewUrls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                width={180}
                height={180}
                style={{ objectFit: "contain" }}
              />
            ))}
          </div>
        )}
      </div>
    ),
    size
  );
}

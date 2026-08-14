import { headers } from "next/headers";

// No custom domain yet (the free *.vercel.app subdomain, per Phase 0) —
// reading the actual request host means this works unchanged in local
// dev, every Vercel preview deployment, and production, with nothing to
// configure or keep in sync.
export async function getSiteOrigin(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

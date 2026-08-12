import type { NextConfig } from "next";

// Item photos are served from Supabase Storage's public URL — next/image
// needs the host allow-listed before it will optimize a remote image.
// Derived from the env var rather than hardcoded so this keeps working if
// the Supabase project ever changes.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;

import { execSync } from "node:child_process";
import type { NextConfig } from "next";

function buildId() {
  // Vercel exposes the commit; elsewhere fall back to git, then "dev".
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "dev";
  }
}

/** Baseline security headers. A Content-Security-Policy is not set yet: see PRODUCTION-READINESS.md. */
const security = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

const documentCache = [
  { key: "Cache-Control", value: "private, no-cache, no-store, max-age=0, must-revalidate" },
  { key: "Pragma", value: "no-cache" },
  { key: "Expires", value: "0" },
  { key: "CDN-Cache-Control", value: "no-store" },
  { key: "Cloudflare-CDN-Cache-Control", value: "no-store" },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_BUILD_ID: buildId(),
  },
  async headers() {
    return [
      {
        source: "/",
        headers: documentCache,
      },
      {
        // HTML and other unhashed routes. Hashed /_next/static files keep
        // Next's own immutable cache header.
        source: "/((?!_next/static|_next/image).*)",
        headers: documentCache,
      },
      {
        source: "/:path*",
        headers: security,
      },
    ];
  },
};

export default nextConfig;

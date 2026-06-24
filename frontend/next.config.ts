import { config as loadEnv } from "dotenv";
import path from "node:path";
import type { NextConfig } from "next";

// Load the single shared root .env so NEXT_PUBLIC_* vars are available to the
// build and dev server without duplicating the file in /frontend.
loadEnv({ path: path.resolve(process.cwd(), "../.env") });

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // We intentionally keep the monorepo root .env at the repo root; pin the
  // file-tracing root so Next doesn't guess (it warns about multiple lockfiles).
  outputFileTracingRoot: path.resolve(process.cwd(), ".."),
  // Type errors still fail the build (tsc is run separately); ESLint config is
  // minimal here so don't let it block production builds.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;

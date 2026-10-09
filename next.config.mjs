/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The E2E suite builds into its own folder (NEXT_DIST_DIR=.next-e2e) so running tests can never
  // overwrite the `.next` folder a running `pnpm dev` is using.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;

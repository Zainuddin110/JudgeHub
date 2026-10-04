/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@judgehub/schemas",
    "@judgehub/policy",
    "@judgehub/scoring",
    "@judgehub/registry",
    "@judgehub/ui",
    "@judgehub/db",
  ],
};

export default nextConfig;

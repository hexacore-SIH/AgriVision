import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@agrivision/shared-types"],
  agentRules: false,
};

export default nextConfig;

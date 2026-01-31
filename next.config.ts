import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // Mantém o limite de upload alto
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Aceita links externos (Google, etc)
      },
    ],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const allowedImageHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

const remotePatterns = isProd
  ? allowedImageHosts.map((hostname) => ({
      protocol: "https" as const,
      hostname,
    }))
  : [
      {
        protocol: "https",
        hostname: "**",
      },
    ];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns,
  },
};

export default nextConfig;

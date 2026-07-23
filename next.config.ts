import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the Next.js “N” indicator off lesson controls (Study/Paint toolbar).
  devIndicators: {
    position: "bottom-left",
  },
  images: {
    // AppImage uses unoptimized for remote/blob fidelity; patterns cover
    // optional optimized loads (homepage inspiration, etc.).
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
    ],
  },
};

export default nextConfig;

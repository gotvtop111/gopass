import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  workboxOptions: {
    runtimeCaching: [],
  },
});

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: false,
  images: { unoptimized: true },
};

export default withPWA(nextConfig);

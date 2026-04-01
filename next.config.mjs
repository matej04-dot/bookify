import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Optimized package imports za brže buildovanje
    optimizePackageImports: ["@/components", "@/services"],
  },
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
        port: "",
        pathname: "/b/**",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        port: "",
        pathname: "/api/**",
      },
    ],
    // Optimizacija slika
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Kompresija za brže učitavanje
  compress: true,
  // Powered by header
  poweredByHeader: false,
  // Reaktivnost
  reactStrictMode: true,
  // Generiranje static exporta gdje je moguće
  trailingSlash: false,
};

export default nextConfig;

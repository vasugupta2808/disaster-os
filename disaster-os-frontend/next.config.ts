import type { NextConfig } from "next";

/**
 * Next.js configuration.
 *
 * Why explicit `images.remotePatterns` matters here:
 * Disaster Image Analysis (Feature 2) lets users view images they've
 * uploaded, which we may serve back via Firebase Storage URLs. Next.js's
 * <Image> component refuses to optimize images from domains it doesn't
 * know about, by default - this allowlist is what makes that work instead
 * of silently failing in production.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Firebase Auth profile photos (Google sign-in)
      },
    ],
  },

  // Fail the production build on TypeScript errors rather than shipping
  // broken code - "build it right from day 1" applies to CI as much as code.
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;

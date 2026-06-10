import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.123.88.37'],
  compress: true, // Gzip compression — improves TTFB which affects Core Web Vitals
  poweredByHeader: false, // Remove X-Powered-By header (security + minor perf)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Security headers improve Google trust signals
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // Locale signal — boosts rankings on Google India
          { key: "Content-Language", value: "en-IN" },
        ],
      },
      {
        // Cache static assets aggressively
        source: "/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/packages",
        destination: "/profiles",
        permanent: true,
      },
      {
        source: "/packages/:path*",
        destination: "/profiles/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;


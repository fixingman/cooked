import withPWA from "@ducanh2912/next-pwa";

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  experimental: {
    outputFileTracingIncludes: {
      "/api/flavor/pairings": ["./src/data/flavor/**"],
    },
  },
};

export default withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    // App shell pages — NetworkFirst so users get fresh data when online,
    // cached copy when offline
    {
      urlPattern: /^https?:\/\/[^/]+\/(|recipes|settings)\/?$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "cooked-pages",
        expiration: { maxEntries: 20, maxAgeSeconds: 7 * 24 * 60 * 60 },
        networkTimeoutSeconds: 3,
      },
    },
    // Recipe detail pages
    {
      urlPattern: /^https?:\/\/[^/]+\/recipes\/[^/]+\/?$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "cooked-recipe-pages",
        expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
        networkTimeoutSeconds: 3,
      },
    },
    // All remote images (replaces the old Unsplash-only rule)
    {
      urlPattern: /^https:\/\/.+\.(jpe?g|png|webp|avif|gif|svg)(\?.*)?$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "cooked-images",
        expiration: { maxEntries: 300, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
  ],
})(nextConfig);

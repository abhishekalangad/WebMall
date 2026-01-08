/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',  <-- comment this out for SSR
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Allow both local and external domains
    domains: [],
  },
  transpilePackages: ['@supabase/supabase-js', '@supabase/realtime-js'],
  turbopack: {},
  experimental: {
    workerThreads: false,
    cpus: 1
  },
  webpack: (config) => {
    config.module.exprContextCritical = false;
    return config;
  },
};

module.exports = nextConfig;

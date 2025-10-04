/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',  <-- comment this out for SSR
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  transpilePackages: ['@supabase/supabase-js', '@supabase/realtime-js'],
  webpack: (config) => {
    config.module.exprContextCritical = false;
    return config;
  },
};

module.exports = nextConfig;

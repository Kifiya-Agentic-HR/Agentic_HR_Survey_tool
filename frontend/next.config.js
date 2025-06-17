/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Mock Node.js modules for client-side builds
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, // Mock fs as empty module
        'node:fs/promises': false, // Explicitly mock node:fs/promises
        path: false, // Mock path (used by pptxgenjs)
      };
    }
    return config;
  },
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;

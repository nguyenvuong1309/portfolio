/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',
  // trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  experimental: {
    serverActions: true, // Enable server actions
  },
};

module.exports = nextConfig;

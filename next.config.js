/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Static export for Cloudflare Pages
  output: 'export',
  trailingSlash: true,
}

module.exports = nextConfig

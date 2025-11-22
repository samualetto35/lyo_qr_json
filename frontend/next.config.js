/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [],
  },
  // Netlify için
  trailingSlash: false,
  // Netlify için output
  output: 'standalone',
}

module.exports = nextConfig


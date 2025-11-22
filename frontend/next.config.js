/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [],
  },
  trailingSlash: false,
  // Netlify plugin için output ayarı
  output: 'standalone',
}

module.exports = nextConfig


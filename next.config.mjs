/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    STRAPI_API_URL: process.env.STRAPI_API_URL,
    STRAPI_API_TOKEN: process.env.STRAPI_API_TOKEN,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.eliteseller.app',
      },
    ],
  },
};

export default nextConfig;

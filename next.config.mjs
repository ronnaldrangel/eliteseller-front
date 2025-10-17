/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    STRAPI_API_URL: process.env.STRAPI_API_URL,
    STRAPI_API_TOKEN: process.env.STRAPI_API_TOKEN,
  },
};

export default nextConfig;

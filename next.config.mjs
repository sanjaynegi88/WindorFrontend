import withSerwistInit from "@serwist/next";

process.env.SERWIST_SUPPRESS_TURBOPACK_WARNING = "1";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  // Automatically register the service worker
  register: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },  
    middlewareClientMaxBodySize: "100mb",
  },
  output: 'standalone',
};

export default withSerwist(nextConfig);

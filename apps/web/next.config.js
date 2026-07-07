/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from MAL/Jikan CDN and YouTube thumbnails
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.myanimelist.net',
      },
      {
        protocol: 'https',
        hostname: 'img1.ak.crunchyroll.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
    ],
  },
  // Transpile workspace packages
  transpilePackages: [
    '@omozoku/types',
    '@omozoku/api-clients',
    '@omozoku/transformers',
    '@omozoku/db',
  ],
};

module.exports = nextConfig;

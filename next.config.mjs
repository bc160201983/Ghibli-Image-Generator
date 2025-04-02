/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'imgen.x.ai',
          },
        ],
      },
};

export default nextConfig;

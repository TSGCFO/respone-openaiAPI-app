/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  // Allow requests from Replit's preview domain
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Content-Type, Authorization'
          }
        ]
      }
    ];
  },
  // Allow all Replit domains in development
  experimental: {
    allowedDevOrigins: ['*']
  }
};

export default nextConfig;

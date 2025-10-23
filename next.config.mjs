import withPWA from 'next-pwa';

const pwaConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 86400, // 24 hours
        },
      },
    },
  ],
  buildExcludes: [/middleware-manifest\.json$/],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  // Security headers including CORS and CSP
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    
    // Define allowed origins based on environment
    const allowedOrigins = isDev 
      ? '*' // Allow all in development for Replit preview
      : process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).join(', ')
        : 'https://your-production-domain.com'; // Replace with actual production domain
    
    // Content Security Policy configuration
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://api.openai.com https://www.googleapis.com https://accounts.google.com https://oauth2.googleapis.com wss: ws:",
      "media-src 'self' blob:",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests"
    ];
    
    // In development, relax CSP for hot reload
    if (isDev) {
      cspDirectives[1] = "script-src 'self' 'unsafe-inline' 'unsafe-eval'"; // Allow eval for hot reload
      cspDirectives[4] = "connect-src 'self' https: wss: ws: http://localhost:* http://0.0.0.0:*"; // Allow local connections
    }
    
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: allowedOrigins
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Content-Type, Authorization'
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          },
          {
            key: 'Content-Security-Policy',
            value: cspDirectives.join('; ')
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=()'
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

export default pwaConfig(nextConfig);

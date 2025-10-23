import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting configuration
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // Max requests per window

// Security headers that should be applied to all responses
const securityHeaders = {
  'X-DNS-Prefetch-Control': 'off',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Download-Options': 'noopen',
  'X-Permitted-Cross-Domain-Policies': 'none',
};

// Helper function to get client identifier
function getClientId(request: NextRequest): string {
  return request.headers.get('x-forwarded-for') || 
         request.headers.get('x-real-ip') || 
         'unknown';
}

// Check rate limit
function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientId);
  
  if (!clientData || now > clientData.resetTime) {
    rateLimitMap.set(clientId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return true;
  }
  
  if (clientData.count >= MAX_REQUESTS) {
    return false;
  }
  
  clientData.count++;
  return true;
}

// Allowed origins for CORS
const getAllowedOrigins = (): string[] => {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    return [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://0.0.0.0:5000',
      // Add Replit domain if available
      ...(process.env.REPLIT_DEV_DOMAIN ? [`https://${process.env.REPLIT_DEV_DOMAIN}`] : [])
    ];
  }
  
  // Production origins from environment variable
  const prodOrigins = process.env.ALLOWED_ORIGINS || '';
  return prodOrigins.split(',').map(o => o.trim()).filter(o => o.length > 0);
};

// Clean up old entries on each request (passive cleanup)
function cleanupRateLimitMap() {
  const now = Date.now();
  // Limit cleanup to prevent performance impact
  let cleaned = 0;
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
      cleaned++;
      if (cleaned >= 10) break; // Clean max 10 entries per request
    }
  }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip middleware for static assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('/favicon') ||
    pathname.includes('/icon-') ||
    pathname.includes('/manifest') ||
    pathname.includes('/sw.js') ||
    pathname.includes('/workbox-')
  ) {
    return NextResponse.next();
  }

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const clientId = getClientId(request);
    
    // Stricter rate limits for sensitive endpoints
    const sensitiveEndpoints = [
      '/api/google/auth',
      '/api/google/callback',
      '/api/files/upload',
      '/api/vector_stores/upload_file'
    ];
    
    if (sensitiveEndpoints.some(endpoint => pathname.startsWith(endpoint))) {
      // Stricter rate limit for sensitive endpoints
      const strictLimit = rateLimitMap.get(`strict:${clientId}`);
      const strictNow = Date.now();
      
      if (!strictLimit || strictNow > strictLimit.resetTime) {
        rateLimitMap.set(`strict:${clientId}`, {
          count: 1,
          resetTime: strictNow + RATE_LIMIT_WINDOW
        });
      } else if (strictLimit.count >= 10) { // Only 10 requests per minute for sensitive endpoints
        return new NextResponse('Too many requests', {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((strictLimit.resetTime - strictNow) / 1000)),
            ...securityHeaders
          }
        });
      } else {
        strictLimit.count++;
      }
    }
    
    // General rate limiting
    if (!checkRateLimit(clientId)) {
      return new NextResponse('Too many requests', {
        status: 429,
        headers: {
          'Retry-After': '60',
          ...securityHeaders
        }
      });
    }
    
    // Validate API key for OpenAI endpoints if needed
    if (pathname.startsWith('/api/turn_response') || 
        pathname.startsWith('/api/transcribe') || 
        pathname.startsWith('/api/embeddings')) {
      // Ensure OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY) {
        return new NextResponse('Service not configured', { 
          status: 503,
          headers: securityHeaders 
        });
      }
    }
  }
  
  // Passive cleanup of old rate limit entries
  cleanupRateLimitMap();
  
  // Add security headers to response
  const response = NextResponse.next();
  
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Handle CORS dynamically based on origin
  const origin = request.headers.get('origin');
  if (origin) {
    const allowedOrigins = getAllowedOrigins();
    
    // Check if the origin is allowed
    if (allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
    }
    // In development, be more permissive for Replit and local hosts
    else if (process.env.NODE_ENV === 'development' && 
             (origin.includes('localhost') || origin.includes('0.0.0.0') || origin.includes('replit'))) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
    }
  }
  
  // Add additional security for authenticated endpoints
  if (pathname.startsWith('/api/google/')) {
    // Ensure proper referrer for OAuth endpoints
    const referrer = request.headers.get('referer');
    const requestOrigin = request.headers.get('origin');
    
    if (pathname === '/api/google/auth' || pathname === '/api/google/callback') {
      // These should only be accessed from our own domain
      if (requestOrigin && !requestOrigin.includes(request.nextUrl.hostname)) {
        return new NextResponse('Forbidden', { 
          status: 403,
          headers: securityHeaders 
        });
      }
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
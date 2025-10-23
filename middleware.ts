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
         request.ip || 
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

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

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
  
  // Add security headers to response
  const response = NextResponse.next();
  
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Add additional security for authenticated endpoints
  if (pathname.startsWith('/api/google/')) {
    // Ensure proper referrer for OAuth endpoints
    const referrer = request.headers.get('referer');
    const origin = request.headers.get('origin');
    
    if (pathname === '/api/google/auth' || pathname === '/api/google/callback') {
      // These should only be accessed from our own domain
      if (origin && !origin.includes(request.nextUrl.hostname)) {
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
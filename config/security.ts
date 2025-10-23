/**
 * Security Configuration
 * Centralizes all security-related settings and constants
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * CORS Configuration
 */
export const CORS_CONFIG = {
  // In production, replace with actual domain(s)
  allowedOrigins: isDevelopment 
    ? '*' // Allow all in development for Replit preview
    : (process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [
        'https://your-production-domain.com',
        'https://www.your-production-domain.com'
      ]),
  
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['X-Requested-With', 'Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

/**
 * Content Security Policy Directives
 */
export const CSP_DIRECTIVES = {
  development: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
    'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
    'font-src': ["'self'", "https://fonts.gstatic.com", "data:"],
    'img-src': ["'self'", "data:", "blob:", "https:"],
    'connect-src': ["'self'", "https:", "wss:", "ws:", "http://localhost:*", "http://0.0.0.0:*"],
    'media-src': ["'self'", "blob:"],
    'object-src': ["'none'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'upgrade-insecure-requests': [],
  },
  production: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
    'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
    'font-src': ["'self'", "https://fonts.gstatic.com", "data:"],
    'img-src': ["'self'", "data:", "blob:", "https:"],
    'connect-src': [
      "'self'",
      "https://api.openai.com",
      "https://www.googleapis.com",
      "https://accounts.google.com", 
      "https://oauth2.googleapis.com",
      "wss:",
      "ws:"
    ],
    'media-src': ["'self'", "blob:"],
    'object-src': ["'none'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'upgrade-insecure-requests': [],
  }
};

/**
 * Security Headers
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(self), geolocation=()',
  'X-DNS-Prefetch-Control': 'off',
  'X-Download-Options': 'noopen',
  'X-Permitted-Cross-Domain-Policies': 'none',
  ...(isProduction && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  })
};

/**
 * Rate Limiting Configuration
 */
export const RATE_LIMIT_CONFIG = {
  // General API rate limit
  general: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  // Strict rate limit for sensitive endpoints
  strict: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
  // File upload rate limit
  upload: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
  },
  // Auth endpoints rate limit
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  }
};

/**
 * File Upload Configuration
 */
export const FILE_UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFilesPerRequest: 10,
  allowedMimeTypes: [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ],
  allowedExtensions: [
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
    'pdf', 'txt', 'csv',
    'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'
  ],
  // Upload directory path
  uploadDir: 'public/uploads',
  // Clean filenames regex - only allow alphanumeric, dots, hyphens, underscores
  filenamePattern: /^[a-zA-Z0-9._-]+$/
};

/**
 * Session Configuration
 */
export const SESSION_CONFIG = {
  cookieName: 'gc_session_id',
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'strict' : 'lax' as const,
  encryptionAlgorithm: 'aes-256-cbc',
  // In production, this should come from environment variable
  encryptionKey: process.env.SESSION_ENCRYPTION_KEY || 'dev-key-32-chars-long-for-aes256',
};

/**
 * API Security Configuration
 */
export const API_SECURITY = {
  // Require API key for certain endpoints
  requireApiKey: isProduction,
  // API key header name
  apiKeyHeader: 'X-API-Key',
  // CSRF token header name
  csrfHeader: 'X-CSRF-Token',
  // Maximum request body size
  maxBodySize: '10mb',
  // Request timeout
  requestTimeout: 30000, // 30 seconds
};

/**
 * Authentication Configuration
 */
export const AUTH_CONFIG = {
  // OAuth state cookie settings
  stateCookie: {
    name: 'gc_oauth_state',
    maxAge: 10 * 60, // 10 minutes
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
  },
  // PKCE verifier cookie settings
  verifierCookie: {
    name: 'gc_oauth_verifier',
    maxAge: 10 * 60, // 10 minutes
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
  },
  // Token expiry buffer (refresh tokens 5 minutes before expiry)
  tokenExpiryBuffer: 5 * 60 * 1000, // 5 minutes
};

/**
 * Database Security Configuration
 */
export const DATABASE_SECURITY = {
  // Enable SSL in production
  ssl: isProduction,
  // Connection pool settings
  connectionPool: {
    max: 20,
    min: 2,
    acquireTimeout: 60000,
    idleTimeout: 10000,
  },
  // Query timeout
  queryTimeout: 30000, // 30 seconds
};

/**
 * Logging Configuration
 */
export const LOGGING_CONFIG = {
  // Log level
  level: isDevelopment ? 'debug' : 'info',
  // Sensitive fields to redact from logs
  redactFields: [
    'password',
    'token',
    'access_token',
    'refresh_token',
    'api_key',
    'secret',
    'authorization',
    'cookie',
    'session'
  ],
  // Enable audit logging in production
  auditLog: isProduction,
};

/**
 * Input Validation Limits
 */
export const VALIDATION_LIMITS = {
  maxMessageLength: 100000, // 100K characters
  maxArrayLength: 1000,
  maxFilenameLeng.th: 255,
  maxPathLength: 4096,
  maxUrlLength: 2048,
  maxEmailLength: 254,
  maxUsernameLength: 50,
  maxPasswordLength: 128,
};

/**
 * Security Recommendations for Production
 */
export const PRODUCTION_CHECKLIST = `
PRODUCTION SECURITY CHECKLIST:
□ Set strong SESSION_ENCRYPTION_KEY environment variable (32+ random bytes)
□ Configure ALLOWED_ORIGINS environment variable with production domains
□ Enable SSL/TLS for all connections
□ Set up Redis or database-backed session storage (not in-memory)
□ Implement proper virus scanning for file uploads
□ Set up rate limiting with Redis or similar
□ Enable audit logging and monitoring
□ Configure Web Application Firewall (WAF)
□ Implement DDoS protection (Cloudflare, AWS Shield)
□ Set up security headers via CDN or reverse proxy
□ Enable automatic security updates
□ Implement proper backup and disaster recovery
□ Configure intrusion detection system (IDS)
□ Set up log aggregation and analysis
□ Implement security incident response plan
□ Regular security audits and penetration testing
□ Implement proper secrets management (AWS Secrets Manager, HashiCorp Vault)
□ Enable database encryption at rest
□ Implement API versioning and deprecation strategy
□ Set up proper CI/CD with security scanning
□ Configure container security scanning if using containers
`;

export default {
  CORS_CONFIG,
  CSP_DIRECTIVES,
  SECURITY_HEADERS,
  RATE_LIMIT_CONFIG,
  FILE_UPLOAD_CONFIG,
  SESSION_CONFIG,
  API_SECURITY,
  AUTH_CONFIG,
  DATABASE_SECURITY,
  LOGGING_CONFIG,
  VALIDATION_LIMITS,
  PRODUCTION_CHECKLIST
};
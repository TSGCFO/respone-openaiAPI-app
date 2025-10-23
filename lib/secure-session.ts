import { cookies } from "next/headers";
import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import type { OAuthTokens } from "./session";

// Environment-based configuration
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ENCRYPTION_KEY = process.env.SESSION_ENCRYPTION_KEY || 'dev-key-32-chars-long-for-aes256';

// Ensure the encryption key is 32 bytes for AES-256
const getEncryptionKey = (): Buffer => {
  const key = ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32);
  return Buffer.from(key);
};

// Session configuration
const SESSION_COOKIE = "gc_session_id";
const ENCRYPTED_DATA_COOKIE = "gc_session_data";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

// Encryption/Decryption functions
function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', getEncryptionKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText: string): string {
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) return '';
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = createDecipheriv('aes-256-cbc', getEncryptionKey(), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
}

// In-memory cache with TTL (for development/demo)
// In production, use Redis or a database
interface CachedSession {
  data: OAuthTokens;
  expiresAt: number;
}

const sessionCache = new Map<string, CachedSession>();

// Cleanup expired sessions periodically
if (typeof global !== 'undefined' && !global.sessionCleanupInterval) {
  global.sessionCleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, session] of sessionCache.entries()) {
      if (now > session.expiresAt) {
        sessionCache.delete(key);
      }
    }
  }, 60 * 60 * 1000); // Clean up every hour
}

// Enhanced cookie options with security best practices
export function getSecureCookieOptions(maxAge: number = SESSION_MAX_AGE) {
  return {
    httpOnly: true as const,
    secure: IS_PRODUCTION,
    sameSite: (IS_PRODUCTION ? 'strict' : 'lax') as const,
    path: '/',
    maxAge,
  };
}

// Create a new secure session
export async function createSecureSession(): Promise<string> {
  const sessionId = randomBytes(32).toString('hex');
  const jar = await cookies();
  
  jar.set(SESSION_COOKIE, sessionId, getSecureCookieOptions());
  
  // Initialize empty session in cache
  sessionCache.set(sessionId, {
    data: {},
    expiresAt: Date.now() + (SESSION_MAX_AGE * 1000)
  });
  
  return sessionId;
}

// Get current session ID
export async function getSecureSessionId(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value;
}

// Get or create session ID
export async function getOrCreateSecureSession(): Promise<string> {
  const existing = await getSecureSessionId();
  if (existing && sessionCache.has(existing)) {
    return existing;
  }
  return createSecureSession();
}

// Save encrypted tokens to session
export async function saveSecureTokens(
  sessionId: string, 
  tokens: OAuthTokens
): Promise<void> {
  // Store in memory cache (for development)
  sessionCache.set(sessionId, {
    data: tokens,
    expiresAt: Date.now() + (SESSION_MAX_AGE * 1000)
  });
  
  // Also store encrypted version in cookie for persistence
  // This provides double protection: httpOnly cookie + encryption
  const jar = await cookies();
  const encrypted = encrypt(JSON.stringify(tokens));
  
  // Split encrypted data into chunks if needed (cookies have size limits)
  const MAX_COOKIE_SIZE = 4000; // Leave some buffer from 4096 limit
  
  if (encrypted.length <= MAX_COOKIE_SIZE) {
    jar.set(ENCRYPTED_DATA_COOKIE, encrypted, getSecureCookieOptions());
  } else {
    // For large data, split into multiple cookies
    const chunks = Math.ceil(encrypted.length / MAX_COOKIE_SIZE);
    for (let i = 0; i < chunks; i++) {
      const chunk = encrypted.slice(i * MAX_COOKIE_SIZE, (i + 1) * MAX_COOKIE_SIZE);
      jar.set(`${ENCRYPTED_DATA_COOKIE}_${i}`, chunk, getSecureCookieOptions());
    }
    jar.set(`${ENCRYPTED_DATA_COOKIE}_count`, String(chunks), getSecureCookieOptions());
  }
}

// Retrieve and decrypt tokens from session
export async function getSecureTokens(sessionId?: string): Promise<OAuthTokens | undefined> {
  if (!sessionId) return undefined;
  
  // Check memory cache first
  const cached = sessionCache.get(sessionId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }
  
  // Fall back to encrypted cookie
  const jar = await cookies();
  
  // Check if we have chunked data
  const chunkCount = jar.get(`${ENCRYPTED_DATA_COOKIE}_count`)?.value;
  let encrypted: string;
  
  if (chunkCount) {
    // Reassemble chunked data
    const chunks: string[] = [];
    const count = parseInt(chunkCount, 10);
    for (let i = 0; i < count; i++) {
      const chunk = jar.get(`${ENCRYPTED_DATA_COOKIE}_${i}`)?.value;
      if (!chunk) return undefined;
      chunks.push(chunk);
    }
    encrypted = chunks.join('');
  } else {
    // Single cookie
    encrypted = jar.get(ENCRYPTED_DATA_COOKIE)?.value || '';
  }
  
  if (!encrypted) return undefined;
  
  const decrypted = decrypt(encrypted);
  if (!decrypted) return undefined;
  
  try {
    const tokens = JSON.parse(decrypted) as OAuthTokens;
    
    // Update cache
    sessionCache.set(sessionId, {
      data: tokens,
      expiresAt: Date.now() + (SESSION_MAX_AGE * 1000)
    });
    
    return tokens;
  } catch (error) {
    console.error('Failed to parse session tokens:', error);
    return undefined;
  }
}

// Clear session data
export async function clearSecureSession(sessionId?: string): Promise<void> {
  if (!sessionId) return;
  
  // Clear from cache
  sessionCache.delete(sessionId);
  
  // Clear cookies
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(ENCRYPTED_DATA_COOKIE);
  
  // Clear any chunked cookies
  const chunkCount = jar.get(`${ENCRYPTED_DATA_COOKIE}_count`)?.value;
  if (chunkCount) {
    const count = parseInt(chunkCount, 10);
    for (let i = 0; i < count; i++) {
      jar.delete(`${ENCRYPTED_DATA_COOKIE}_${i}`);
    }
    jar.delete(`${ENCRYPTED_DATA_COOKIE}_count`);
  }
}

// Validate session is still active
export async function validateSession(sessionId: string): Promise<boolean> {
  const cached = sessionCache.get(sessionId);
  if (!cached) return false;
  
  const now = Date.now();
  if (now > cached.expiresAt) {
    sessionCache.delete(sessionId);
    return false;
  }
  
  return true;
}

// Refresh session expiry
export async function refreshSessionExpiry(sessionId: string): Promise<void> {
  const cached = sessionCache.get(sessionId);
  if (cached) {
    cached.expiresAt = Date.now() + (SESSION_MAX_AGE * 1000);
  }
  
  // Also refresh cookie expiry
  const jar = await cookies();
  const existing = jar.get(SESSION_COOKIE)?.value;
  if (existing === sessionId) {
    jar.set(SESSION_COOKIE, sessionId, getSecureCookieOptions());
  }
}

// Production recommendation comment
/**
 * PRODUCTION RECOMMENDATIONS:
 * 
 * 1. Replace in-memory sessionCache with Redis or database-backed storage
 * 2. Set SESSION_ENCRYPTION_KEY environment variable with a secure 32-byte key
 * 3. Consider implementing session rotation for enhanced security
 * 4. Add session activity logging for audit trails
 * 5. Implement distributed session management for multi-instance deployments
 * 6. Consider using iron-session or next-auth for production-ready session management
 * 7. Add CSRF token validation for state-changing operations
 * 8. Implement session timeout based on user activity
 * 
 * Example Redis implementation:
 * ```typescript
 * import Redis from 'ioredis';
 * const redis = new Redis(process.env.REDIS_URL);
 * 
 * async function saveToRedis(sessionId: string, data: OAuthTokens) {
 *   await redis.setex(
 *     `session:${sessionId}`,
 *     SESSION_MAX_AGE,
 *     JSON.stringify(data)
 *   );
 * }
 * ```
 */

export default {
  getSecureCookieOptions,
  createSecureSession,
  getSecureSessionId,
  getOrCreateSecureSession,
  saveSecureTokens,
  getSecureTokens,
  clearSecureSession,
  validateSession,
  refreshSessionExpiry,
};
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

const SESSION_COOKIE = "gc_session_id";

/**
 * ⚠️ SECURITY WARNING: IN-MEMORY SESSION STORAGE ⚠️
 * 
 * This implementation uses an in-memory Map for session storage which is:
 * - NOT suitable for production use
 * - Sessions are LOST on server restart
 * - Sessions are NOT shared across server instances
 * - This creates security vulnerabilities and poor user experience
 * 
 * For production, you MUST replace this with:
 * - Redis for session storage
 * - Database-backed sessions  
 * - Or use secure, encrypted cookies for session data
 * 
 * This is for development purposes only!
 */
export interface OAuthTokens {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  token_type?: string;
  scope?: string;
  // epoch milliseconds when the access token expires
  expires_at?: number;
}

const sessionStore = new Map<string, OAuthTokens>();

export async function getOrCreateSessionId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(SESSION_COOKIE)?.value;
  if (existing) return existing;

  const sessionId = randomBytes(16).toString("hex");
  // Set httpOnly cookie for session id
  jar.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return sessionId;
}

export async function getSessionId(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value;
}

export function saveTokenSet(sessionId: string, tokenSet: OAuthTokens) {
  sessionStore.set(sessionId, tokenSet);
}

export function getTokenSet(sessionId?: string): OAuthTokens | undefined {
  if (!sessionId) return undefined;
  return sessionStore.get(sessionId);
}

export function clearSession(sessionId?: string) {
  if (!sessionId) return;
  sessionStore.delete(sessionId);
}

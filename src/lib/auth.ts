/**
 * GhostWire Authentication & Session Management
 * Uses HMAC-SHA256 signed session tokens stored in secure HTTP-only cookies.
 */

import crypto from 'crypto';
import { cookies } from 'next/headers';
import { getUserById, UserRecord } from './db';

const SESSION_SECRET = process.env.SESSION_SECRET || 'ghostwire-enterprise-zero-knowledge-session-secret-2026';
export const SESSION_COOKIE_NAME = 'gw_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  expiresAt: number;
}

/**
 * Creates a signed session token: base64(payload).signature
 */
export function createSessionToken(user: { id: string; email: string; role: string }): string {
  const payload: SessionData = {
    userId: user.id,
    email: user.email,
    role: user.role,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies and decodes a signed session token
 */
export function verifySessionToken(token: string): SessionData | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [encodedPayload, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(encodedPayload)
      .digest('base64url');

    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload: SessionData = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Reads the current session from incoming request cookies
 */
export async function getCurrentUser(): Promise<UserRecord | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gw_session') || cookieStore.get('ghostwire_session');
    if (!sessionCookie?.value) return null;

    const session = verifySessionToken(sessionCookie.value);
    if (!session) return null;

    const user = getUserById(session.userId);
    return user || null;
  } catch {
    return null;
  }
}

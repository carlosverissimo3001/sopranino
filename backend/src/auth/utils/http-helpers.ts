import { CookieOptions } from 'express';

export interface SessionCookieConfig {
  sessionMaxAge: number;
  sameSiteOverride?: 'lax' | 'none' | 'strict';
}

/** Both helpers read this: a cookie only clears when the domain matches. */
function cookieDomain(): string | undefined {
  return process.env.COOKIE_DOMAIN || undefined;
}

/**
 * Generate cookie options for session management
 * @param config - Configuration for session cookies
 * @returns Cookie options for Express response
 */
export function getCookieOptions(config: SessionCookieConfig): CookieOptions {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: config.sameSiteOverride ?? 'lax',
    maxAge: config.sessionMaxAge * 1000,
    path: '/',
    domain: cookieDomain(),
  };
}

export function getClearCookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    domain: cookieDomain(),
  };
}

/**
 * Build error redirect URL for OAuth failures
 * @param frontendUrl - Base frontend URL
 * @param error - Error code or message
 * @returns Complete redirect URL with error parameter
 */
export function buildErrorRedirect(frontendUrl: string, error: string): string {
  return `${frontendUrl}?error=${encodeURIComponent(error)}`;
}

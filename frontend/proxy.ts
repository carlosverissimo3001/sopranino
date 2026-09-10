import { NextRequest, NextResponse } from 'next/server';
import {
  SITE_ACCESS_COOKIE,
  SPOTIFY_RETURN_COOKIE,
  isAccessTokenValid,
  readSpotifyReturnToken,
} from '@/lib/site-access';

import { SESSION_COOKIE_NAME as SESSION_COOKIE } from '@/lib/cookies';
const SHUFFLE_ROUTE = '/shuffle';

// Presence only; the backend validates. Multiplayer join is absent on purpose:
// it routes signed out visitors through login itself.
const NEEDS_SESSION = [
  '/daily',
  '/playlist',
  '/history',
  '/preferences',
  '/admin',
];

function needsSession(pathname: string): boolean {
  if (pathname.startsWith('/multiplayer/join')) return false;
  // Playing without an account is the whole point of the shuffle.
  if (pathname === SHUFFLE_ROUTE) return false;
  if (pathname.startsWith('/multiplayer')) return true;
  return NEEDS_SESSION.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/** Separate deployment, proxied in here. Path lives in an env var, not the repo. */
function isPrivateZone(pathname: string): boolean {
  const zone = process.env.PRIVATE_ZONE_PATH;
  if (!zone) return false;
  return pathname === zone || pathname.startsWith(`${zone}/`);
}

async function hasAccess(request: NextRequest): Promise<boolean> {
  return isAccessTokenValid(request.cookies.get(SITE_ACCESS_COOKIE)?.value);
}

/**
 * The Spotify account this browser has signed in with before, if any. Only as
 * good as the signature: the id travels in the cookie because nothing at the
 * edge can look it up.
 */
async function returningSpotifyUser(
  request: NextRequest,
): Promise<string | null> {
  return readSpotifyReturnToken(
    request.cookies.get(SPOTIFY_RETURN_COOKIE)?.value,
  );
}

/** Spotify ids that reach the private zone without the password*/
function isZoneGuest(spotifyUserId: string | null): boolean {
  if (!spotifyUserId) return false;
  const allowed = process.env.PRIVATE_ZONE_SPOTIFY_IDS;
  if (!allowed) return false;
  return allowed
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .includes(spotifyUserId);
}

/** The site is public; the password buys sign in and the private zone. */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // The disabled button is a hint, not the enforcement. A browser that has
  // done this before is let through without the password: the cap it protects
  // has already made room for whoever is on the other side of it.
  if (pathname === '/api/auth/login') {
    const allowed =
      (await hasAccess(request)) || !!(await returningSpotifyUser(request));
    return allowed
      ? NextResponse.next()
      : NextResponse.redirect(new URL('/', request.url));
  }

  if (needsSession(pathname) && !request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (!isPrivateZone(pathname)) {
    return NextResponse.next();
  }

  // Signing in as a listed account is a stronger claim than the password,
  // which is only ever handed to the same people by hand.
  if (
    (await hasAccess(request)) ||
    isZoneGuest(await returningSpotifyUser(request))
  ) {
    return NextResponse.next();
  }

  // Not a 404: that leaves a valid password holder nothing to type it into.
  const gate = new URL('/gate', request.url);
  gate.searchParams.set('next', pathname + search);
  return NextResponse.redirect(gate);
}

export const config = {
  matcher: ['/((?!_next|api/auth/gate|gate|.*\\.).*)'],
};

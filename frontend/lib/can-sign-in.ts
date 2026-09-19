import { cookies } from 'next/headers';
import {
  SITE_ACCESS_COOKIE,
  SPOTIFY_RETURN_COOKIE,
  isAccessTokenValid,
  readSpotifyReturnToken,
} from '@/lib/site-access';

/**
 * Whether this browser may start a Spotify login: the same two answers the
 * proxy accepts on /api/auth/login, or the button would lie one way or the
 * other. Both cookies are httpOnly, so only the server can say.
 */
export async function canSignInWithSpotify(): Promise<boolean> {
  const jar = await cookies();
  return (
    (await isAccessTokenValid(jar.get(SITE_ACCESS_COOKIE)?.value)) ||
    !!(await readSpotifyReturnToken(jar.get(SPOTIFY_RETURN_COOKIE)?.value))
  );
}

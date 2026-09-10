import { cookies } from 'next/headers';
import { HomeClient } from './HomeClient';
import { StructuredData } from '@/components/seo/StructuredData';
import { SESSION_COOKIE_NAME } from '@/lib/cookies';
import {
  SITE_ACCESS_COOKIE,
  SPOTIFY_RETURN_COOKIE,
  isAccessTokenValid,
  readSpotifyReturnToken,
} from '@/lib/site-access';

export default async function Home() {
  // Both cookies are httpOnly, so the client cannot answer this for itself.
  const jar = await cookies();

  // Same two answers the proxy accepts on /api/auth/login. If they disagreed,
  // the button would lie in one direction or the other.
  const canSignIn =
    (await isAccessTokenValid(jar.get(SITE_ACCESS_COOKIE)?.value)) ||
    !!(await readSpotifyReturnToken(jar.get(SPOTIFY_RETURN_COOKIE)?.value));

  // No session cookie means a stranger, and the server can answer that without
  // waiting on a query the way the client must. Knowing it here is what lets
  // the landing copy render into the HTML instead of a spinner.
  const hasSession = jar.has(SESSION_COOKIE_NAME);

  return (
    <>
      <StructuredData />
      <HomeClient canSignIn={canSignIn} hasSession={hasSession} />
    </>
  );
}

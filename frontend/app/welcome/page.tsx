import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { UnauthenticatedView } from '@/components/features/UnauthenticatedView';
import { AppFooter } from '@/components/features/AppFooter';
import {
  SITE_ACCESS_COOKIE,
  SPOTIFY_RETURN_COOKIE,
  isAccessTokenValid,
  readSpotifyReturnToken,
} from '@/lib/site-access';

export const metadata: Metadata = { alternates: { canonical: '/' } };

/** The pitch page the home used to be, kept for links that want it. */
export default async function WelcomePage() {
  const jar = await cookies();
  const canSignIn =
    (await isAccessTokenValid(jar.get(SITE_ACCESS_COOKIE)?.value)) ||
    !!(await readSpotifyReturnToken(jar.get(SPOTIFY_RETURN_COOKIE)?.value));

  return (
    <main className="flex min-h-screen flex-col text-fg">
      <div className="flex flex-1 flex-col px-4 py-8 sm:px-6">
        <UnauthenticatedView canSignIn={canSignIn} />
      </div>
      <AppFooter />
    </main>
  );
}

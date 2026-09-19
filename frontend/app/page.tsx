import { cookies } from 'next/headers';
import { HomeClient } from './HomeClient';
import { StructuredData } from '@/components/seo/StructuredData';
import { SESSION_COOKIE_NAME } from '@/lib/cookies';
import { canSignInWithSpotify } from '@/lib/can-sign-in';

export default async function Home() {
  const jar = await cookies();

  const canSignIn = await canSignInWithSpotify();

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

import { cookies } from 'next/headers';
import { GamePage } from '@/components/game/GamePage';
import { SITE_ACCESS_COOKIE, isAccessTokenValid } from '@/lib/site-access';

export default async function ShufflePage() {
  // The access cookie is httpOnly, so the client cannot answer this for itself.
  const canSignIn = await isAccessTokenValid(
    (await cookies()).get(SITE_ACCESS_COOKIE)?.value,
  );

  return <GamePage canSignIn={canSignIn} syncUrl />;
}

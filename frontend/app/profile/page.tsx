import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { ProfilePage } from '@/components/profile/ProfilePage';
import { SITE_ACCESS_COOKIE, isAccessTokenValid } from '@/lib/site-access';

export const metadata: Metadata = {
  title: 'Profile',
};

export default async function Page() {
  // The access cookie is httpOnly, so the client cannot answer this for itself.
  const canSignIn = await isAccessTokenValid(
    (await cookies()).get(SITE_ACCESS_COOKIE)?.value,
  );

  return <ProfilePage canSignIn={canSignIn} />;
}

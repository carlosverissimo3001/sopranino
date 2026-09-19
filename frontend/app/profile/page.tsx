import type { Metadata } from 'next';
import { ProfilePage } from '@/components/profile/ProfilePage';
import { canSignInWithSpotify } from '@/lib/can-sign-in';

export const metadata: Metadata = {
  title: 'Profile',
};

export default async function Page() {
  const canSignIn = await canSignInWithSpotify();

  return <ProfilePage canSignIn={canSignIn} />;
}

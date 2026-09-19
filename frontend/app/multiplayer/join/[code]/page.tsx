import { JoinByCodeClient } from '@/components/multiplayer/JoinByCodeClient';
import { canSignInWithSpotify } from '@/lib/can-sign-in';

export default async function JoinByCodePage() {
  const canSignIn = await canSignInWithSpotify();

  return <JoinByCodeClient canSignIn={canSignIn} />;
}

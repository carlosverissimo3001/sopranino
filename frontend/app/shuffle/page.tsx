import { GamePage } from '@/components/game/GamePage';
import { canSignInWithSpotify } from '@/lib/can-sign-in';

export default async function ShufflePage() {
  const canSignIn = await canSignInWithSpotify();

  return <GamePage canSignIn={canSignIn} syncUrl />;
}

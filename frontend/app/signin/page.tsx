import { SignInClient } from './SignInClient';
import { canSignInWithSpotify } from '@/lib/can-sign-in';

export default async function SignInPage() {
  const canSignIn = await canSignInWithSpotify();

  return <SignInClient canSignIn={canSignIn} />;
}

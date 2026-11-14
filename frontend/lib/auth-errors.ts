const MESSAGES: Record<string, string> = {
  spotify_invite_only:
    "Connecting Spotify is limited to a handful of invited accounts, by Spotify's rules. Every other mode works without it.",
  // Either provider sends this when the consent screen is closed.
  access_denied: 'Sign-in was cancelled.',
  google_in_use:
    'That Google account already signs in to a different account. Sign in with it there, or link another Google account.',
};

const FALLBACK = 'Sign-in did not go through. Try again.';

/** The ?error= a sign-in redirect carries, as something a player can read. */
export function authErrorMessage(code: string): string {
  return MESSAGES[code] ?? FALLBACK;
}

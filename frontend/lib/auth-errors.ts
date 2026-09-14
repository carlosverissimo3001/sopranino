const MESSAGES: Record<string, string> = {
  spotify_invite_only:
    "Connecting Spotify is limited to a handful of invited accounts, by Spotify's rules. Every other mode works without it.",
  access_denied: 'Spotify sign-in was cancelled.',
};

const FALLBACK = 'Sign-in did not go through. Try again.';

/** The ?error= a sign-in redirect carries, as something a player can read. */
export function authErrorMessage(code: string): string {
  return MESSAGES[code] ?? FALLBACK;
}

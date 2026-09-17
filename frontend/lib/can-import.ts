import type { AuthMeResponseDto } from '@/sdk';

/** A linked player already plays their Spotify playlists, so importing one is moot. */
export function spotifyIsLinked(
  user?: AuthMeResponseDto | null
): boolean {
  return !!user?.hasLinkedAccount;
}

/** Mirrors the server's SignedUpGuard: Spotify, or a password account with a proved address. */
export function canImport(user: AuthMeResponseDto | null | undefined): boolean {
  return (
    !!user && (user.hasLinkedAccount || (!!user.email && user.emailVerified))
  );
}

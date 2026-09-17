import type { AuthMeResponseDto } from '@/sdk';

/** Mirrors the server's SignedUpGuard: Spotify, or a password account with a proved address. */
export function canImport(user: AuthMeResponseDto | null | undefined): boolean {
  return (
    !!user && (user.hasLinkedAccount || (!!user.email && user.emailVerified))
  );
}

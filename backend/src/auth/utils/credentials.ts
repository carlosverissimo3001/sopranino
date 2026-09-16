import { UserEntity } from '../entities/user.entity';

/**
 * Whether a row is an account rather than an anonymous player. Either
 * credential counts, and neither is required: a row may have both.
 */
export function hasCredential(
  user:
    | Partial<Pick<UserEntity, 'spotifyUserId' | 'email' | 'passwordHash'>>
    | null
    | undefined,
): boolean {
  // email, not just passwordHash: a session blob carries the former and never
  // the latter, and both guards and the merge path ask this of a session.
  return !!user?.spotifyUserId || !!user?.email || !!user?.passwordHash;
}

/** Signing up only claims an address; proving it is what finishes the flow. */
export function hasCompletedSignup(
  user:
    | Partial<
        Pick<UserEntity, 'spotifyUserId' | 'passwordHash' | 'emailVerifiedAt'>
      >
    | null
    | undefined,
): boolean {
  return (
    !!user?.spotifyUserId || (!!user?.passwordHash && !!user?.emailVerifiedAt)
  );
}

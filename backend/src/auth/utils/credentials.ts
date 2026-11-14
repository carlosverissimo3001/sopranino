import { UserEntity } from '../entities/user.entity';

/**
 * Whether a row is an account rather than an anonymous player. Any credential
 * counts, and none is required: a row may have several.
 */
export function hasCredential(
  user:
    | Partial<
        Pick<
          UserEntity,
          'spotifyUserId' | 'googleUserId' | 'email' | 'passwordHash'
        >
      >
    | null
    | undefined,
): boolean {
  // email, not just passwordHash: a session blob carries the former and never
  // the latter, and both guards and the merge path ask this of a session.
  return (
    !!user?.spotifyUserId ||
    !!user?.googleUserId ||
    !!user?.email ||
    !!user?.passwordHash
  );
}

/**
 * Signing up only claims an address; proving it is what finishes the flow. An
 * OAuth sign-in is proof on its own: the provider vouched for the person.
 */
export function hasCompletedSignup(
  user:
    | Partial<
        Pick<
          UserEntity,
          'spotifyUserId' | 'googleUserId' | 'passwordHash' | 'emailVerifiedAt'
        >
      >
    | null
    | undefined,
): boolean {
  return (
    !!user?.spotifyUserId ||
    !!user?.googleUserId ||
    (!!user?.passwordHash && !!user?.emailVerifiedAt)
  );
}

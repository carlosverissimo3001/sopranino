export const USER_RENAMED = 'user.renamed';

/** Somebody's name changed, for whatever shows it to other people. */
export class UserRenamedEvent {
  constructor(
    readonly userId: string,
    readonly displayName: string,
  ) {}
}

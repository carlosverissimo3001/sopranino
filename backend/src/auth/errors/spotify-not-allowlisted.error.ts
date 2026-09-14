import { ForbiddenException } from '@nestjs/common';

/** Spotify's Development Mode admits only the accounts on the app's allowlist. */
export class SpotifyNotAllowlistedError extends ForbiddenException {
  constructor() {
    super('This Spotify account is not on the app allowlist');
  }
}

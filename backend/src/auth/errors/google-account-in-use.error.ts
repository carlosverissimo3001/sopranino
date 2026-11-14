import { ConflictException } from '@nestjs/common';

/** Linking a Google account that already signs in to a different account. */
export class GoogleAccountInUseError extends ConflictException {
  constructor() {
    super('This Google account is already linked to another account');
  }
}

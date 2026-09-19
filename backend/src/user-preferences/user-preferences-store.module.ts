import { Module } from '@nestjs/common';
import { UserPreferencesRepository } from './repositories/user-preferences.repository';

/**
 * The stored preferences alone, with no session handling, so auth can put
 * them on /auth/me without the two modules importing each other.
 */
@Module({
  providers: [UserPreferencesRepository],
  exports: [UserPreferencesRepository],
})
export class UserPreferencesStoreModule {}

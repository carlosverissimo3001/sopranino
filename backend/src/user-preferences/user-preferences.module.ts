import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UserPreferencesController } from './controllers/user-preferences.controller';
import { UserPreferencesService } from './services/user-preferences.service';
import { UserPreferencesStoreModule } from './user-preferences-store.module';

@Module({
  imports: [AuthModule, UserPreferencesStoreModule],
  controllers: [UserPreferencesController],
  providers: [UserPreferencesService],
  exports: [UserPreferencesService],
})
export class UserPreferencesModule {}

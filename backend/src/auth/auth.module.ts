import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { AccountMergeService } from './services/account-merge.service';
import { SpotifyService } from './services/spotify.service';
import { SpotifyAuthService } from './services/spotify-auth.service';
import { SessionService } from './services/session.service';
import { UserRepository } from './repositories/user.repository';
import { ProvisioningSessionGuard } from '../utils/guards/provisioning-session.guard';
import { AuthTokenRepository } from './repositories/auth-token.repository';
import { EmailSendLimiter } from './services/email-send-limiter.service';
import { EmailVerificationService } from './services/email-verification.service';
import { PasswordResetService } from './services/password-reset.service';
import { EmailChangeService } from './services/email-change.service';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AccountMergeService,
    SpotifyService,
    SpotifyAuthService,
    SessionService,
    UserRepository,
    AuthTokenRepository,
    EmailSendLimiter,
    EmailVerificationService,
    PasswordResetService,
    EmailChangeService,
    ProvisioningSessionGuard,
  ],
  exports: [
    AuthService,
    AccountMergeService,
    SessionService,
    SpotifyAuthService,
    UserRepository,
    EmailVerificationService,
  ],
})
export class AuthModule {}

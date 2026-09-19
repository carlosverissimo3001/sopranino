import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthTokenType } from '@prisma/client';
import { AppLoggerService } from '../../logger/logger.service';
import { EmailService } from '../../email/services/email.service';
import { AuthTokenRepository } from '../repositories/auth-token.repository';
import { UserRepository } from '../repositories/user.repository';
import { EMAIL_VERIFICATION_TTL_SECONDS } from '../consts';
import { createAuthToken, hashAuthToken } from '../utils/auth-token';
import { verificationEmail } from '../emails/verification.email';
import { EmailSendLimiter } from './email-send-limiter.service';

@Injectable()
export class EmailVerificationService {
  private readonly logger: AppLoggerService;
  private readonly frontendUrl: string;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenRepository: AuthTokenRepository,
    private readonly emailService: EmailService,
    private readonly limiter: EmailSendLimiter,
    configService: ConfigService,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.child(EmailVerificationService.name);
    this.frontendUrl =
      configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  /**
   * Sends a fresh link, if the address is allowed one right now. Says nothing
   * about whether it sent: the caller must answer the same way for an address
   * with an account and one without.
   */
  async send(userId: string, email: string): Promise<void> {
    if (!(await this.limiter.claim(email, 'verify'))) {
      return;
    }

    const { token, tokenHash } = createAuthToken();
    await this.tokenRepository.issue({
      userId,
      email,
      type: AuthTokenType.EMAIL_VERIFICATION,
      tokenHash,
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_SECONDS * 1000),
    });

    const link = `${this.frontendUrl}/verify?token=${token}`;
    await this.emailService.send(verificationEmail(email, link));
  }

  /**
   * Spends a link. False for anything that is not a live token, without
   * distinguishing wrong from expired from already used -- all three mean the
   * same thing to whoever is holding it.
   */
  async confirm(token: string): Promise<boolean> {
    const record = await this.tokenRepository.findByHash(
      hashAuthToken(token),
      AuthTokenType.EMAIL_VERIFICATION,
    );

    if (!record) {
      return false;
    }

    // Spend it either way: an expired link is used up, not retryable.
    await this.tokenRepository.consume(record.id);

    if (record.expiresAt.getTime() < Date.now()) {
      return false;
    }

    // A link for an address the account has since moved off verifies nothing.
    const user = await this.userRepository.findById(record.userId);
    if (user?.email !== record.email) {
      return false;
    }

    await this.userRepository.markEmailVerified(record.userId, record.email);
    this.logger.log(`Verified an address for user ${record.userId}`);
    return true;
  }
}

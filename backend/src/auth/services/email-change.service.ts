import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthTokenType } from '@prisma/client';
import { AppLoggerService } from '../../logger/logger.service';
import { EmailService } from '../../email/services/email.service';
import { AuthTokenRepository } from '../repositories/auth-token.repository';
import { UserRepository } from '../repositories/user.repository';
import { EMAIL_CHANGE_TTL_SECONDS } from '../consts';
import { createAuthToken, hashAuthToken } from '../utils/auth-token';
import { verifyPassword } from '../utils/password';
import {
  emailChangeConfirmEmail,
  emailChangeNoticeEmail,
} from '../emails/email-change.email';
import { EmailSendLimiter } from './email-send-limiter.service';

/**
 * A new address is only a request until its inbox answers. The old one stays
 * the account's email, and where a reset goes, until then: a straight switch
 * would leave a mistyped address as the only way back in.
 */
@Injectable()
export class EmailChangeService {
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
    this.logger = appLogger.child(EmailChangeService.name);
    this.frontendUrl =
      configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  async request(params: {
    userId: string;
    currentPassword: string;
    newEmail: string;
  }): Promise<void> {
    const { userId, currentPassword, newEmail } = params;
    const user = await this.userRepository.findById(userId);

    const failed = new UnauthorizedException('Current password is incorrect');
    if (!user?.passwordHash) {
      throw failed;
    }
    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      throw failed;
    }

    if (newEmail === user.email) {
      throw new BadRequestException('That is already your email');
    }
    // The signed in owner learns nothing new here: sign-up says the same.
    if (await this.userRepository.findByEmail(newEmail)) {
      throw new ConflictException('That email is already registered');
    }

    if ((await this.pendingFor(user.id)) === newEmail) {
      await this.sendConfirmation(user.id, newEmail, user.displayName);
      return;
    }
    if (!(await this.sendConfirmation(user.id, newEmail, user.displayName))) {
      throw new HttpException(
        'Too many emails to that address. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Only a proven address hears about it. An unverified one may be the very
    // typo being fixed, and would tell a stranger this account exists.
    if (
      user.email &&
      user.emailVerifiedAt &&
      (await this.limiter.claim(user.email, 'change'))
    ) {
      const { token, tokenHash } = createAuthToken();
      await this.tokenRepository.issue({
        userId: user.id,
        email: user.email,
        type: AuthTokenType.EMAIL_CHANGE_CANCEL,
        tokenHash,
        expiresAt: this.expiry(),
      });
      await this.emailService.send(
        emailChangeNoticeEmail({
          to: user.email,
          newEmail,
          cancelLink: `${this.frontendUrl}/email-change/cancel?token=${token}`,
          displayName: user.displayName,
        }),
      );
    }
  }

  /** A fresh link to the address already waiting, if the limiter allows one. */
  async resend(userId: string): Promise<void> {
    const pending = await this.pendingFor(userId);
    const user = pending ? await this.userRepository.findById(userId) : null;
    if (!pending || !user) {
      return;
    }
    await this.sendConfirmation(user.id, pending, user.displayName);
  }

  async pendingFor(userId: string): Promise<string | null> {
    const record = await this.tokenRepository.findLive(
      userId,
      AuthTokenType.EMAIL_CHANGE,
    );
    return record?.email ?? null;
  }

  async cancelFor(userId: string): Promise<void> {
    await this.tokenRepository.retire(userId, [
      AuthTokenType.EMAIL_CHANGE,
      AuthTokenType.EMAIL_CHANGE_CANCEL,
    ]);
  }

  /**
   * Spends a link from the new inbox. The address becomes the email and is
   * verified in one step, since reading the link is the proof.
   */
  async confirm(token: string): Promise<boolean> {
    const record = await this.spend(token, AuthTokenType.EMAIL_CHANGE);
    if (!record) {
      return false;
    }

    // Taken by a proven account since the request. An unproven claim loses it
    // to this one, as it would to any verification.
    const holder = await this.userRepository.findByEmail(record.email);
    if (holder && holder.id !== record.userId && holder.emailVerifiedAt) {
      return false;
    }

    await this.userRepository.markEmailVerified(record.userId, record.email);

    // Every link still out was sent to the old address or for it; spending
    // one now would act on an address that is no longer the account's.
    await this.tokenRepository.retire(record.userId, [
      AuthTokenType.EMAIL_VERIFICATION,
      AuthTokenType.PASSWORD_RESET,
      AuthTokenType.EMAIL_CHANGE,
      AuthTokenType.EMAIL_CHANGE_CANCEL,
    ]);

    this.logger.log(`Changed the email of user ${record.userId}`);
    return true;
  }

  /** Spends the link sent to the old address. */
  async cancel(token: string): Promise<boolean> {
    const record = await this.spend(token, AuthTokenType.EMAIL_CHANGE_CANCEL);
    if (!record) {
      return false;
    }
    await this.cancelFor(record.userId);
    this.logger.log(`Cancelled an email change for user ${record.userId}`);
    return true;
  }

  private async sendConfirmation(
    userId: string,
    email: string,
    displayName: string,
  ): Promise<boolean> {
    if (!(await this.limiter.claim(email, 'change'))) {
      return false;
    }

    const { token, tokenHash } = createAuthToken();
    await this.tokenRepository.issue({
      userId,
      email,
      type: AuthTokenType.EMAIL_CHANGE,
      tokenHash,
      expiresAt: this.expiry(),
    });
    await this.emailService.send(
      emailChangeConfirmEmail(
        email,
        `${this.frontendUrl}/email-change?token=${token}`,
        displayName,
      ),
    );
    return true;
  }

  /** Wrong, expired and already used are one answer, as with every link. */
  private async spend(token: string, type: AuthTokenType) {
    const record = await this.tokenRepository.findByHash(
      hashAuthToken(token),
      type,
    );
    if (!record) {
      return null;
    }
    await this.tokenRepository.consume(record.id);
    return record.expiresAt.getTime() < Date.now() ? null : record;
  }

  private expiry(): Date {
    return new Date(Date.now() + EMAIL_CHANGE_TTL_SECONDS * 1000);
  }
}

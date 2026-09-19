import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthTokenType } from '@prisma/client';
import { AppLoggerService } from '../../logger/logger.service';
import { EmailService } from '../../email/services/email.service';
import { AuthTokenRepository } from '../repositories/auth-token.repository';
import { UserRepository } from '../repositories/user.repository';
import { EmailSendLimiter } from './email-send-limiter.service';
import { EmailChangeService } from './email-change.service';
import { hashAuthToken } from '../utils/auth-token';
import { verifyPassword } from '../utils/password';

jest.mock('../utils/password', () => ({
  ...jest.requireActual('../utils/password'),
  verifyPassword: jest.fn(),
}));

const mockTokenRepository = {
  issue: jest.fn(),
  findByHash: jest.fn(),
  findLive: jest.fn(),
  retire: jest.fn(),
  consume: jest.fn(),
};
const mockUserRepository = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  markEmailVerified: jest.fn(),
};
const mockEmailService = { send: jest.fn() };
const mockLimiter = { claim: jest.fn() };

const player = {
  id: 'user-1',
  email: 'old@example.com',
  emailVerifiedAt: new Date(),
  passwordHash: 'hash',
  displayName: 'Charly',
};

async function build() {
  const logger = new AppLoggerService();
  jest.spyOn(logger, 'log').mockImplementation(() => {});

  const module = await Test.createTestingModule({
    providers: [
      EmailChangeService,
      { provide: AuthTokenRepository, useValue: mockTokenRepository },
      { provide: UserRepository, useValue: mockUserRepository },
      { provide: EmailService, useValue: mockEmailService },
      { provide: EmailSendLimiter, useValue: mockLimiter },
      {
        provide: ConfigService,
        useValue: { get: () => 'https://unpaused.test' },
      },
      { provide: AppLoggerService, useValue: logger },
    ],
  }).compile();

  return module.get(EmailChangeService);
}

const tokenIn = (text: string) => /token=([^\s"<]+)/.exec(text)?.[1];

describe('EmailChangeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLimiter.claim.mockResolvedValue(true);
    mockEmailService.send.mockResolvedValue(true);
    mockUserRepository.findById.mockResolvedValue(player);
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockTokenRepository.findLive.mockResolvedValue(null);
    (verifyPassword as jest.Mock).mockResolvedValue(true);
  });

  describe('request', () => {
    const ask = (service: EmailChangeService, newEmail = 'new@example.com') =>
      service.request({ userId: 'user-1', currentPassword: 'pw', newEmail });

    it('mails the new address a link, storing only its hash', async () => {
      const service = await build();
      await ask(service);

      const change = mockTokenRepository.issue.mock.calls.find(
        ([params]) => params.type === AuthTokenType.EMAIL_CHANGE,
      )![0];
      const message = mockEmailService.send.mock.calls.find(
        ([m]) => m.to === 'new@example.com',
      )![0];

      expect(change.email).toBe('new@example.com');
      expect(message.text).toContain(
        'https://unpaused.test/email-change?token=',
      );
      expect(change.tokenHash).toBe(hashAuthToken(tokenIn(message.text)!));
    });

    it('leaves the email alone until the link is clicked', async () => {
      const service = await build();
      await ask(service);

      expect(mockUserRepository.markEmailVerified).not.toHaveBeenCalled();
    });

    it('tells a verified old address, with a way to cancel', async () => {
      const service = await build();
      await ask(service);

      const notice = mockEmailService.send.mock.calls.find(
        ([m]) => m.to === 'old@example.com',
      )![0];
      expect(notice.text).toContain('new@example.com');
      expect(notice.text).toContain(
        'https://unpaused.test/email-change/cancel?token=',
      );
      expect(mockTokenRepository.issue).toHaveBeenCalledWith(
        expect.objectContaining({
          type: AuthTokenType.EMAIL_CHANGE_CANCEL,
          email: 'old@example.com',
          tokenHash: hashAuthToken(tokenIn(notice.text)!),
        }),
      );
    });

    // It may be the typo being fixed, and would tell a stranger the account exists.
    it('does not mail an old address that was never confirmed', async () => {
      mockUserRepository.findById.mockResolvedValue({
        ...player,
        emailVerifiedAt: null,
      });
      const service = await build();
      await ask(service);

      expect(mockEmailService.send).toHaveBeenCalledTimes(1);
      expect(mockEmailService.send.mock.calls[0][0].to).toBe('new@example.com');
    });

    it('refuses a wrong password', async () => {
      (verifyPassword as jest.Mock).mockResolvedValue(false);
      const service = await build();

      await expect(ask(service)).rejects.toThrow(UnauthorizedException);
      expect(mockEmailService.send).not.toHaveBeenCalled();
    });

    it('refuses an account without a password', async () => {
      mockUserRepository.findById.mockResolvedValue({
        ...player,
        passwordHash: null,
      });
      const service = await build();

      await expect(ask(service)).rejects.toThrow(UnauthorizedException);
    });

    it('refuses the address the account already has', async () => {
      const service = await build();
      await expect(ask(service, 'old@example.com')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('refuses an address another account holds, as sign-up does', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({ id: 'someone-else' });
      const service = await build();

      await expect(ask(service)).rejects.toThrow(
        new ConflictException('That email is already registered'),
      );
    });

    it('says so when the new address has been mailed too often', async () => {
      mockLimiter.claim.mockResolvedValue(false);
      const service = await build();

      await expect(ask(service)).rejects.toThrow(HttpException);
      expect(mockTokenRepository.issue).not.toHaveBeenCalled();
    });

    // A second click must not kill the link already in the inbox.
    it('treats asking for the pending address again as a resend', async () => {
      mockTokenRepository.findLive.mockResolvedValue({
        email: 'new@example.com',
      });
      mockLimiter.claim.mockResolvedValue(false);
      const service = await build();

      await expect(ask(service)).resolves.toBeUndefined();
      expect(mockTokenRepository.issue).not.toHaveBeenCalled();
    });
  });

  describe('confirm', () => {
    const live = {
      id: 'token-row',
      userId: 'user-1',
      email: 'new@example.com',
      expiresAt: new Date(Date.now() + 60_000),
    };

    it('makes the new address the email, verified', async () => {
      mockTokenRepository.findByHash.mockResolvedValue(live);
      const service = await build();

      await expect(service.confirm('a-token')).resolves.toBe(true);
      expect(mockTokenRepository.findByHash).toHaveBeenCalledWith(
        hashAuthToken('a-token'),
        AuthTokenType.EMAIL_CHANGE,
      );
      expect(mockUserRepository.markEmailVerified).toHaveBeenCalledWith(
        'user-1',
        'new@example.com',
      );
    });

    it('retires every link sent for the old address', async () => {
      mockTokenRepository.findByHash.mockResolvedValue(live);
      const service = await build();

      await service.confirm('a-token');

      expect(mockTokenRepository.retire).toHaveBeenCalledWith(
        'user-1',
        expect.arrayContaining([
          AuthTokenType.EMAIL_VERIFICATION,
          AuthTokenType.PASSWORD_RESET,
          AuthTokenType.EMAIL_CHANGE_CANCEL,
        ]),
      );
    });

    it('refuses when a proven account took the address meanwhile', async () => {
      mockTokenRepository.findByHash.mockResolvedValue(live);
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'someone-else',
        emailVerifiedAt: new Date(),
      });
      const service = await build();

      await expect(service.confirm('a-token')).resolves.toBe(false);
      expect(mockUserRepository.markEmailVerified).not.toHaveBeenCalled();
    });

    it('refuses and spends an expired link', async () => {
      mockTokenRepository.findByHash.mockResolvedValue({
        ...live,
        expiresAt: new Date(Date.now() - 1),
      });
      const service = await build();

      await expect(service.confirm('a-token')).resolves.toBe(false);
      expect(mockTokenRepository.consume).toHaveBeenCalledWith('token-row');
      expect(mockUserRepository.markEmailVerified).not.toHaveBeenCalled();
    });

    it('refuses a link that was replaced or cancelled', async () => {
      mockTokenRepository.findByHash.mockResolvedValue(null);
      const service = await build();

      await expect(service.confirm('gone')).resolves.toBe(false);
    });
  });

  describe('cancel', () => {
    it('drops the pending change from the old inbox', async () => {
      mockTokenRepository.findByHash.mockResolvedValue({
        id: 'cancel-row',
        userId: 'user-1',
        email: 'old@example.com',
        expiresAt: new Date(Date.now() + 60_000),
      });
      const service = await build();

      await expect(service.cancel('a-token')).resolves.toBe(true);
      expect(mockTokenRepository.findByHash).toHaveBeenCalledWith(
        hashAuthToken('a-token'),
        AuthTokenType.EMAIL_CHANGE_CANCEL,
      );
      expect(mockTokenRepository.retire).toHaveBeenCalledWith('user-1', [
        AuthTokenType.EMAIL_CHANGE,
        AuthTokenType.EMAIL_CHANGE_CANCEL,
      ]);
    });
  });
});

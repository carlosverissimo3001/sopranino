import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthTokenType } from '@prisma/client';
import { AppLoggerService } from '../../logger/logger.service';
import { EmailService } from '../../email/services/email.service';
import { AuthTokenRepository } from '../repositories/auth-token.repository';
import { UserRepository } from '../repositories/user.repository';
import { EmailSendLimiter } from './email-send-limiter.service';
import { EmailVerificationService } from './email-verification.service';
import { hashAuthToken } from '../utils/auth-token';

const mockTokenRepository = {
  issue: jest.fn(),
  findByHash: jest.fn(),
  consume: jest.fn(),
};
const mockUserRepository = {
  markEmailVerified: jest.fn(),
  findById: jest.fn(),
};
const mockEmailService = { send: jest.fn() };
const mockLimiter = { claim: jest.fn() };

async function build() {
  const logger = new AppLoggerService();
  jest.spyOn(logger, 'log').mockImplementation(() => {});

  const module = await Test.createTestingModule({
    providers: [
      EmailVerificationService,
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

  return module.get(EmailVerificationService);
}

describe('EmailVerificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLimiter.claim.mockResolvedValue(true);
    mockEmailService.send.mockResolvedValue(true);
    mockUserRepository.findById.mockResolvedValue({
      id: 'user-1',
      email: 'player@example.com',
    });
  });

  describe('send', () => {
    it('mails a link, and stores only the hash of what it mailed', async () => {
      const service = await build();
      await service.send('user-1', 'player@example.com');

      const [{ tokenHash }] = mockTokenRepository.issue.mock.calls[0];
      const [message] = mockEmailService.send.mock.calls[0];

      const token = /token=([^\s"<]+)/.exec(message.text)?.[1];
      expect(token).toBeTruthy();
      expect(tokenHash).toBe(hashAuthToken(token!));
      expect(tokenHash).not.toBe(token);
      expect(message.to).toBe('player@example.com');
    });

    it('sends nothing when the address has been mailed too recently', async () => {
      mockLimiter.claim.mockResolvedValue(false);
      const service = await build();

      await service.send('user-1', 'player@example.com');

      expect(mockTokenRepository.issue).not.toHaveBeenCalled();
      expect(mockEmailService.send).not.toHaveBeenCalled();
    });

    it('records the address the link was sent to, not just the user', async () => {
      const service = await build();
      await service.send('user-1', 'player@example.com');

      expect(mockTokenRepository.issue).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          email: 'player@example.com',
          type: AuthTokenType.EMAIL_VERIFICATION,
        }),
      );
    });
  });

  describe('confirm', () => {
    const live = {
      id: 'token-row',
      userId: 'user-1',
      email: 'player@example.com',
      expiresAt: new Date(Date.now() + 60_000),
    };

    it('verifies the address the link was issued for', async () => {
      mockTokenRepository.findByHash.mockResolvedValue(live);
      const service = await build();

      await expect(service.confirm('a-token')).resolves.toBe(true);
      expect(mockUserRepository.markEmailVerified).toHaveBeenCalledWith(
        'user-1',
        'player@example.com',
      );
    });

    it('looks the token up by its hash, never by the token', async () => {
      mockTokenRepository.findByHash.mockResolvedValue(live);
      const service = await build();

      await service.confirm('a-token');

      expect(mockTokenRepository.findByHash).toHaveBeenCalledWith(
        hashAuthToken('a-token'),
        AuthTokenType.EMAIL_VERIFICATION,
      );
    });

    it('spends the link, so a second click does nothing', async () => {
      mockTokenRepository.findByHash.mockResolvedValue(live);
      const service = await build();

      await service.confirm('a-token');

      expect(mockTokenRepository.consume).toHaveBeenCalledWith('token-row');
    });

    it('refuses an expired link and verifies nobody', async () => {
      mockTokenRepository.findByHash.mockResolvedValue({
        ...live,
        expiresAt: new Date(Date.now() - 1),
      });
      const service = await build();

      await expect(service.confirm('a-token')).resolves.toBe(false);
      expect(mockUserRepository.markEmailVerified).not.toHaveBeenCalled();
    });

    it('spends an expired link too, rather than leaving it to be retried', async () => {
      mockTokenRepository.findByHash.mockResolvedValue({
        ...live,
        expiresAt: new Date(Date.now() - 1),
      });
      const service = await build();

      await service.confirm('a-token');

      expect(mockTokenRepository.consume).toHaveBeenCalledWith('token-row');
    });

    it('refuses a link for an address the account has moved off', async () => {
      mockTokenRepository.findByHash.mockResolvedValue(live);
      mockUserRepository.findById.mockResolvedValue({
        id: 'user-1',
        email: 'new@example.com',
      });
      const service = await build();

      await expect(service.confirm('a-token')).resolves.toBe(false);
      expect(mockUserRepository.markEmailVerified).not.toHaveBeenCalled();
    });

    it('refuses a token nobody issued', async () => {
      mockTokenRepository.findByHash.mockResolvedValue(null);
      const service = await build();

      await expect(service.confirm('made-up')).resolves.toBe(false);
      expect(mockUserRepository.markEmailVerified).not.toHaveBeenCalled();
    });
  });
});

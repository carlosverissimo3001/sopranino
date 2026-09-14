import { Test } from '@nestjs/testing';
import { FeedbackKind } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../auth/services/auth.service';
import { EmailService } from '../../email/services/email.service';
import { AppLoggerService } from '../../logger/logger.service';
import { RedisService } from '../../redis/redis.service';
import { FEEDBACK_NOTIFY_DAILY_LIMIT } from '../consts';
import { CreateFeedbackControllerDto } from '../dto/create-feedback-controller.dto';
import { GetFeedbackDto } from '../dto/get-feedback.dto';
import { FeedbackRepository } from '../repositories/feedback.repository';
import { FeedbackService } from './feedback.service';

describe('FeedbackService', () => {
  let service: FeedbackService;

  const repository = {
    create: jest.fn(),
    findPage: jest.fn(),
    setResolved: jest.fn(),
  };
  const auth = { getUserBySessionId: jest.fn() };
  const email = { send: jest.fn() };
  const env: Record<string, string | undefined> = {};
  const redisClient = { incr: jest.fn(), expire: jest.fn() };
  const flush = () => new Promise((resolve) => setImmediate(resolve));

  const body = (
    overrides: Partial<CreateFeedbackControllerDto> = {},
  ): CreateFeedbackControllerDto => ({
    kind: FeedbackKind.BUG,
    message: 'The snippet plays silence',
    ...overrides,
  });

  const row = {
    id: 'report-1',
    kind: FeedbackKind.BUG,
    message: 'The snippet plays silence',
    email: null,
    userId: 'user-1',
    user: { displayName: 'Ana' },
    pagePath: '/shuffle',
    userAgent: 'iPhone',
    resolvedAt: null,
    createdAt: new Date('2026-09-13'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    auth.getUserBySessionId.mockResolvedValue({
      id: 'user-1',
      displayName: 'Ana',
    });
    email.send.mockResolvedValue(true);
    redisClient.incr.mockResolvedValue(1);
    Object.assign(env, {
      INBOUND_FORWARD_TO: 'inbox@example.com',
      FRONTEND_URL: 'https://sopranino.app',
    });

    const module = await Test.createTestingModule({
      providers: [
        FeedbackService,
        { provide: FeedbackRepository, useValue: repository },
        { provide: AuthService, useValue: auth },
        { provide: EmailService, useValue: email },
        { provide: ConfigService, useValue: { get: (k: string) => env[k] } },
        { provide: RedisService, useValue: { getClient: () => redisClient } },
        {
          provide: AppLoggerService,
          useValue: { child: () => ({ warn: jest.fn(), log: jest.fn() }) },
        },
      ],
    }).compile();

    service = module.get(FeedbackService);
  });

  describe('submit', () => {
    it('stores the report with what the server knows about it', async () => {
      await service.submit({
        body: body({
          email: 'ana@example.com',
          pagePath: '/shuffle',
          appVersion: '1.2.0',
        }),
        sessionId: 'session-1',
        userAgent: 'iPhone',
      });

      expect(repository.create).toHaveBeenCalledWith({
        appVersion: '1.2.0',
        kind: FeedbackKind.BUG,
        message: 'The snippet plays silence',
        email: 'ana@example.com',
        pagePath: '/shuffle',
        userAgent: 'iPhone',
        userId: 'user-1',
      });
    });

    it('takes a report from a guest', async () => {
      await service.submit({ body: body() });

      expect(auth.getUserBySessionId).not.toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: undefined }),
      );
    });

    // Losing the report over a stale cookie would lose the one thing asked for.
    it('keeps the report, unattributed, when the session has expired', async () => {
      auth.getUserBySessionId.mockRejectedValue(new Error('Session expired'));

      await service.submit({ body: body(), sessionId: 'stale' });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: undefined }),
      );
    });

    it('stores nothing when the honeypot was filled', async () => {
      await expect(
        service.submit({ body: body({ website: 'http://spam.example' }) }),
      ).resolves.toBeUndefined();

      expect(repository.create).not.toHaveBeenCalled();
    });

    it('caps a user agent that is longer than any real one', async () => {
      await service.submit({ body: body(), userAgent: 'x'.repeat(2000) });

      expect(repository.create.mock.calls[0][0].userAgent).toHaveLength(512);
    });
  });

  describe('notifying the support inbox', () => {
    it('mails the report, answerable to the player, once it is stored', async () => {
      await service.submit({
        body: body({ email: 'ana@example.com', pagePath: '/shuffle' }),
        sessionId: 'session-1',
        userAgent: 'iPhone',
      });
      await flush();

      expect(repository.create).toHaveBeenCalled();
      expect(email.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'inbox@example.com',
          replyTo: 'ana@example.com',
          subject: 'Bug report: The snippet plays silence',
        }),
      );
      expect(email.send.mock.calls[0][0].text).toContain(
        'https://sopranino.app/admin/reports',
      );
      expect(email.send.mock.calls[0][0].text).toContain(
        'From: Ana <ana@example.com>',
      );
    });

    it('does not hold the report for the mail', async () => {
      email.send.mockReturnValue(new Promise(() => {}));

      await expect(service.submit({ body: body() })).resolves.toBeUndefined();
      expect(repository.create).toHaveBeenCalled();
    });

    it('keeps the report when the mail fails', async () => {
      redisClient.incr.mockRejectedValue(new Error('redis down'));

      await expect(service.submit({ body: body() })).resolves.toBeUndefined();
      await flush();
      expect(repository.create).toHaveBeenCalled();
    });

    // Shared with sign-in mail; a flood of reports must not spend it.
    it('stores but does not mail past the daily limit', async () => {
      redisClient.incr.mockResolvedValue(FEEDBACK_NOTIFY_DAILY_LIMIT + 1);

      await service.submit({ body: body() });
      await flush();

      expect(repository.create).toHaveBeenCalled();
      expect(email.send).not.toHaveBeenCalled();
    });

    it('mails nothing for a honeypot hit', async () => {
      await service.submit({ body: body({ website: 'http://spam' }) });
      await flush();

      expect(email.send).not.toHaveBeenCalled();
    });

    it('does nothing until an inbox is configured', async () => {
      env.INBOUND_FORWARD_TO = undefined;

      await service.submit({ body: body() });
      await flush();

      expect(repository.create).toHaveBeenCalled();
      expect(email.send).not.toHaveBeenCalled();
    });
  });

  it('lists reports on the shared page contract', async () => {
    repository.findPage.mockResolvedValue({ items: [row], total: 11 });

    const page = await service.list({ page: 2, limit: 10 } as GetFeedbackDto);

    expect(page.items).toEqual([
      expect.objectContaining({
        id: 'report-1',
        userDisplayName: 'Ana',
        email: undefined,
        resolvedAt: undefined,
      }),
    ]);
    expect(page.meta).toMatchObject({ totalItems: 11, totalPages: 2 });
  });

  it('resolves a report', async () => {
    const resolvedAt = new Date();
    repository.setResolved.mockResolvedValue({ ...row, resolvedAt });

    const report = await service.setResolved('report-1', true);

    expect(repository.setResolved).toHaveBeenCalledWith('report-1', true);
    expect(report.resolvedAt).toBe(resolvedAt);
  });
});

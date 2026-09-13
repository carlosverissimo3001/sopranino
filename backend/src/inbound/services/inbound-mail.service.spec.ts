import { createHmac, randomBytes } from 'crypto';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Resend } from 'resend';
import { AppLoggerService } from '../../logger/logger.service';
import { RedisService } from '../../redis/redis.service';
import { INBOUND_FORWARD_DAILY_LIMIT, RESEND_CLIENT } from '../consts';
import { InboundMailService, SignedWebhook } from './inbound-mail.service';

const SECRET_BYTES = randomBytes(24);
const SECRET = `whsec_${SECRET_BYTES.toString('base64')}`;

/** Signed the way Resend signs, so verification runs for real. */
function signed(event: unknown, secretBytes = SECRET_BYTES): SignedWebhook {
  const payload = JSON.stringify(event);
  const id = `msg_${randomBytes(6).toString('hex')}`;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHmac('sha256', secretBytes)
    .update(`${id}.${timestamp}.${payload}`)
    .digest('base64');
  return { payload, id, timestamp, signature: `v1,${signature}` };
}

const received = (to: string[], emailId = 'email-1') => ({
  type: 'email.received',
  created_at: new Date().toISOString(),
  data: {
    email_id: emailId,
    created_at: new Date().toISOString(),
    from: 'Player <player@example.com>',
    to,
    bcc: [],
    cc: [],
    received_for: to,
    message_id: '<m@example.com>',
    subject: 'Help',
    attachments: [],
  },
});

describe('InboundMailService', () => {
  let service: InboundMailService;
  let resend: Resend;

  const env: Record<string, string | undefined> = {};
  const redisClient = {
    set: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
  };

  const build = async (client: Resend | null) => {
    const module = await Test.createTestingModule({
      providers: [
        InboundMailService,
        { provide: RESEND_CLIENT, useValue: client },
        {
          provide: ConfigService,
          useValue: { get: (key: string) => env[key] },
        },
        { provide: RedisService, useValue: { getClient: () => redisClient } },
        {
          provide: AppLoggerService,
          useValue: { child: () => ({ warn: jest.fn(), log: jest.fn() }) },
        },
      ],
    }).compile();
    return module.get(InboundMailService);
  };

  let getEmail: jest.SpyInstance;
  let listAttachments: jest.SpyInstance;
  let send: jest.SpyInstance;

  beforeEach(async () => {
    jest.clearAllMocks();
    Object.assign(env, {
      RESEND_WEBHOOK_SECRET: SECRET,
      INBOUND_ADDRESSES: 'support@mail.sopranino.app, hello@mail.sopranino.app',
      INBOUND_FORWARD_TO: 'inbox@example.com',
      EMAIL_FROM: 'sopranino <noreply@mail.sopranino.app>',
    });
    redisClient.set.mockResolvedValue('OK');
    redisClient.incr.mockResolvedValue(1);

    resend = new Resend('re_test');
    getEmail = jest.spyOn(resend.emails.receiving, 'get').mockResolvedValue({
      data: {
        object: 'email',
        id: 'email-1',
        to: ['support@mail.sopranino.app'],
        from: 'Player <player@example.com>',
        created_at: '',
        subject: 'The round\r\nwill not load',
        bcc: null,
        cc: null,
        reply_to: null,
        received_for: [],
        html: '<p>It spins forever</p>',
        text: 'It spins forever',
        headers: null,
        message_id: '<m@example.com>',
        attachments: [],
      },
      error: null,
      headers: null,
    } as never);
    listAttachments = jest.spyOn(resend.emails.receiving.attachments, 'list');
    send = jest
      .spyOn(resend.emails, 'send')
      .mockResolvedValue({ data: { id: 'sent-1' }, error: null } as never);

    service = await build(resend);
  });

  it('forwards mail to an allowed address, answerable to its sender', async () => {
    await expect(
      service.handle(
        signed(received(['Support <support@mail.sopranino.app>'])),
      ),
    ).resolves.toBe('forwarded');

    expect(getEmail).toHaveBeenCalledWith('email-1');
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'sopranino <noreply@mail.sopranino.app>',
        to: 'inbox@example.com',
        replyTo: 'Player <player@example.com>',
        subject: '[support@mail.sopranino.app] The round will not load',
        html: '<p>It spins forever</p>',
        text: 'It spins forever',
      }),
      { idempotencyKey: 'inbound-forward/email-1' },
    );
  });

  it('carries attachments across by their download links', async () => {
    getEmail.mockResolvedValueOnce({
      data: {
        ...(await getEmail.getMockImplementation()!()).data,
        attachments: [{ id: 'att-1' }],
      },
      error: null,
    });
    listAttachments.mockResolvedValue({
      data: {
        object: 'list',
        has_more: false,
        data: [
          {
            id: 'att-1',
            filename: 'screenshot.png',
            size: 10,
            content_type: 'image/png',
            content_disposition: 'attachment',
            download_url: 'https://files.example/att-1',
            expires_at: '',
          },
        ],
      },
      error: null,
    } as never);

    await service.handle(signed(received(['support@mail.sopranino.app'])));

    expect(send.mock.calls[0][0].attachments).toEqual([
      expect.objectContaining({
        filename: 'screenshot.png',
        path: 'https://files.example/att-1',
        contentType: 'image/png',
      }),
    ]);
  });

  it('rejects a payload signed with another secret', async () => {
    await expect(
      service.handle(
        signed(received(['support@mail.sopranino.app']), randomBytes(24)),
      ),
    ).rejects.toThrow(BadRequestException);
    expect(send).not.toHaveBeenCalled();
  });

  it('rejects a payload altered after signing', async () => {
    const webhook = signed(received(['support@mail.sopranino.app']));
    webhook.payload = webhook.payload.replace('support@', 'billing@');

    await expect(service.handle(webhook)).rejects.toThrow(BadRequestException);
  });

  it('rejects a request with no signature at all', async () => {
    await expect(
      service.handle({ payload: JSON.stringify(received([])) }),
    ).rejects.toThrow(BadRequestException);
  });

  it('ignores mail to an address that is not on the list', async () => {
    await expect(
      service.handle(signed(received(['random@mail.sopranino.app']))),
    ).resolves.toBe('ignored-recipient');
    expect(send).not.toHaveBeenCalled();
  });

  it('ignores events other than received mail', async () => {
    await expect(
      service.handle(signed({ ...received([]), type: 'email.delivered' })),
    ).resolves.toBe('ignored-event');
  });

  // The allowance is shared with sign-in mail; spam must not spend it.
  it('stops forwarding past the daily limit', async () => {
    redisClient.incr.mockResolvedValue(INBOUND_FORWARD_DAILY_LIMIT + 1);

    await expect(
      service.handle(signed(received(['support@mail.sopranino.app']))),
    ).resolves.toBe('over-daily-limit');
    expect(send).not.toHaveBeenCalled();
  });

  // A retried webhook is the same email, not another one against the limit.
  it('counts a retried email once', async () => {
    redisClient.set.mockResolvedValue(null);

    await service.handle(signed(received(['support@mail.sopranino.app'])));

    expect(redisClient.incr).not.toHaveBeenCalled();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('fails loudly when the forward is refused, so Resend retries', async () => {
    send.mockResolvedValue({ data: null, error: { message: 'quota' } });

    await expect(
      service.handle(signed(received(['support@mail.sopranino.app']))),
    ).rejects.toThrow('Could not forward email-1: quota');
  });

  it('answers 503 until it is configured', async () => {
    env.INBOUND_FORWARD_TO = undefined;
    service = await build(resend);

    await expect(
      service.handle(signed(received(['support@mail.sopranino.app']))),
    ).rejects.toThrow(ServiceUnavailableException);
  });
});

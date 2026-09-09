import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../../logger/logger.service';
import { EmailService } from './email.service';
import { EMAIL_FROM, EMAIL_REPLY_TO, RESEND_API_KEY } from '../consts';
import { ResendEmailTransport } from '../transports/resend.transport';

// The package too, not just our wrapper: automock still loads the module to
// read its shape, and the SDK leaves a handle open that outlives the suite.
jest.mock('resend', () => ({ Resend: jest.fn() }));
jest.mock('../transports/resend.transport');

const MESSAGE = {
  to: 'someone@example.com',
  subject: 'Confirm your address',
  html: '<p>link</p>',
  text: 'link',
};

function buildService(config: Record<string, string | undefined>) {
  const logger = new AppLoggerService();
  jest.spyOn(logger, 'log').mockImplementation(() => {});
  jest.spyOn(logger, 'error').mockImplementation(() => {});

  return Test.createTestingModule({
    providers: [
      EmailService,
      {
        provide: ConfigService,
        useValue: { get: (key: string) => config[key] },
      },
      { provide: AppLoggerService, useValue: logger },
    ],
  })
    .compile()
    .then((module: TestingModule) => module.get(EmailService));
}

describe('EmailService', () => {
  const send = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (ResendEmailTransport as jest.Mock).mockImplementation(() => ({
      name: 'resend',
      send,
    }));
  });

  it('writes to the log when there is no provider to send with', async () => {
    const service = await buildService({});

    expect(service.canSend).toBe(false);
    expect(await service.send(MESSAGE)).toBe(true);
    expect(ResendEmailTransport).not.toHaveBeenCalled();
  });

  it('sends through Resend once a key is configured', async () => {
    send.mockResolvedValue(undefined);
    const service = await buildService({
      [RESEND_API_KEY]: 'a-sending-key',
      [EMAIL_FROM]: 'sopranino <sopranino@example.com>',
      [EMAIL_REPLY_TO]: 'carlos@example.com',
    });

    expect(service.canSend).toBe(true);
    expect(await service.send(MESSAGE)).toBe(true);
    expect(send).toHaveBeenCalledWith(MESSAGE, {
      from: 'sopranino <sopranino@example.com>',
      replyTo: 'carlos@example.com',
    });
  });

  it('falls back to a from address rather than sending without one', async () => {
    send.mockResolvedValue(undefined);
    const service = await buildService({ [RESEND_API_KEY]: 'a-sending-key' });

    await service.send(MESSAGE);
    expect(send).toHaveBeenCalledWith(
      MESSAGE,
      expect.objectContaining({ from: expect.stringContaining('@') }),
    );
  });

  it('answers false instead of throwing, so a caller cannot leak the failure', async () => {
    send.mockRejectedValue(new Error('rate_limit_exceeded'));
    const service = await buildService({ [RESEND_API_KEY]: 'a-sending-key' });

    await expect(service.send(MESSAGE)).resolves.toBe(false);
  });

  it('sends no replyTo when none is configured, rather than an empty one', async () => {
    send.mockResolvedValue(undefined);
    const service = await buildService({ [RESEND_API_KEY]: 'a-sending-key' });

    await service.send(MESSAGE);

    expect(send.mock.calls[0][1].replyTo).toBeUndefined();
  });

  it('keeps the recipient out of the log when a send fails', async () => {
    send.mockRejectedValue(new Error('rate_limit_exceeded'));
    const logger = new AppLoggerService();
    const error = jest.spyOn(logger, 'error').mockImplementation(() => {});
    jest.spyOn(logger, 'log').mockImplementation(() => {});

    const module = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: { get: (key: string) => ({ [RESEND_API_KEY]: 'k' })[key] },
        },
        { provide: AppLoggerService, useValue: logger },
      ],
    }).compile();

    await module.get(EmailService).send(MESSAGE);

    const logged = error.mock.calls.flat().join(' ');
    expect(logged).not.toContain(MESSAGE.to);
  });
});

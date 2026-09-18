import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ModerationService } from './moderation.service';
import { AppLoggerService } from '../../logger/logger.service';

describe('ModerationService', () => {
  let service: ModerationService;
  let fetchMock: jest.Mock;

  const build = async (apiKey?: string) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModerationService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(apiKey) },
        },
        {
          provide: AppLoggerService,
          useValue: { child: () => ({ warn: jest.fn(), debug: jest.fn() }) },
        },
      ],
    }).compile();

    return module.get(ModerationService);
  };

  const answering = (scores: Record<string, number>) => {
    const answers = Object.fromEntries(
      Object.entries(scores).map(([name, noul]) => [name, { noul }]),
    );
    return {
      ok: true,
      json: () => Promise.resolve({ answers }),
    };
  };

  beforeEach(async () => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    service = await build('a-key');
  });

  it('allows a line that scores low everywhere', async () => {
    fetchMock.mockResolvedValue(answering({ harassment: 0.04, spam: 0.01 }));

    expect(await service.judge('gg wp')).toMatchObject({ verdict: 'allow' });
  });

  it('blocks a line that scores high', async () => {
    fetchMock.mockResolvedValue(answering({ harassment: 0.96, spam: 0.02 }));

    expect(await service.judge('kill yourself')).toMatchObject({
      verdict: 'block',
      worst: 'harassment',
    });
  });

  // Where an insult aimed at a person starts, well above any banter measured.
  it('blocks a line just over the bar', async () => {
    fetchMock.mockResolvedValue(answering({ hate: 0.41 }));

    expect(await service.judge('that song is gay')).toMatchObject({
      verdict: 'block',
    });
  });

  it('allows banter well under it', async () => {
    fetchMock.mockResolvedValue(answering({ harassment: 0.26 }));

    expect(await service.judge('ur mum listens to better music')).toMatchObject(
      { verdict: 'allow' },
    );
  });

  it('judges on the worst question, not the first', async () => {
    fetchMock.mockResolvedValue(
      answering({ harassment: 0.02, threat: 0.91, spam: 0.1 }),
    );

    expect(await service.judge('i will find you')).toMatchObject({
      verdict: 'block',
      worst: 'threat',
    });
  });

  describe('failing closed', () => {
    it('when the call errors', async () => {
      fetchMock.mockRejectedValue(new Error('timed out'));

      expect(await service.judge('hello')).toEqual({ verdict: 'unavailable' });
    });

    it('when the api refuses', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 429 });

      expect(await service.judge('hello')).toEqual({ verdict: 'unavailable' });
    });

    it('when no key is configured', async () => {
      service = await build(undefined);

      expect(await service.judge('hello')).toEqual({ verdict: 'unavailable' });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { AppLoggerService } from '../../logger/logger.service';
import { ChartRepository } from '../repositories/chart.repository';
import { ChartService } from './chart.service';
import { CHARTS } from '../chart.constants';

const mockLogger = {
  child: () => ({ log: jest.fn(), warn: jest.fn(), error: jest.fn() }),
};

const track = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  title: `Song ${id}`,
  isrc: `ISRC${id}`,
  rank: 500_000,
  preview: 'https://example.test/p.mp3',
  artist: { name: 'Artist' },
  album: { id: 9, title: 'Album', cover_xl: 'https://example.test/a.jpg' },
  ...overrides,
});

describe('ChartService', () => {
  let service: ChartService;
  const repository = {
    poolIdsByIsrc: jest.fn(),
    replaceChart: jest.fn(),
    countMembers: jest.fn(),
  };
  let fetchMock: jest.Mock;

  const respond = (body: unknown) => ({ ok: true, json: async () => body });

  beforeEach(async () => {
    jest.clearAllMocks();
    repository.poolIdsByIsrc.mockResolvedValue(new Map<string, string>());
    repository.replaceChart.mockImplementation((_c, members: unknown[]) =>
      Promise.resolve(members.length),
    );

    fetchMock = jest.fn(async (url: string) => {
      if (url.includes('/playlist/')) {
        return respond({ data: [track(1), track(2)] });
      }
      return respond({ release_date: '2024-03-01' });
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChartService,
        { provide: ChartRepository, useValue: repository },
        { provide: AppLoggerService, useValue: mockLogger },
      ],
    }).compile();
    service = module.get(ChartService);
  });

  it('replaces every chart', async () => {
    const result = await service.refreshAll();

    expect(Object.keys(result)).toHaveLength(CHARTS.length);
    expect(repository.replaceChart).toHaveBeenCalledTimes(CHARTS.length);
  });

  it("takes fame from the chart's own rank", async () => {
    await service.refreshAll();

    const [, members] = repository.replaceChart.mock.calls[0] as [
      unknown,
      { create?: { fame: number } }[],
    ];
    expect(members[0].create?.fame).toBe(500_000);
  });

  // A year costs a request each, and the pool already knows the year of
  // anything it has seen. Only a genuinely new track is worth asking about.
  it('asks for a year only for a track the pool has never seen', async () => {
    repository.poolIdsByIsrc.mockResolvedValue(new Map([['ISRC1', 'dz:999']]));

    await service.refreshAll();

    const lookups = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes('/track/'),
    );
    expect(lookups).toHaveLength(CHARTS.length);
  });

  // The pool is ISRC-deduped and canonicalises to the most-streamed upload, so
  // the chart's copy of a song it already holds arrives under a different id.
  // Inserting it would break the unique ISRC; the entry plays as the pool's row.
  it('plays a song the pool already holds as the row the pool already has', async () => {
    repository.poolIdsByIsrc.mockResolvedValue(new Map([['ISRC1', 'dz:777']]));

    await service.refreshAll();

    const [, members] = repository.replaceChart.mock.calls[0] as [
      unknown,
      { trackId: string; create?: unknown }[],
    ];
    const reused = members.find((m) => m.trackId === 'dz:777');
    expect(reused).toBeDefined();
    expect(reused?.create).toBeUndefined();
  });

  it('holds a song once when the chart lists two uploads of it', async () => {
    repository.poolIdsByIsrc.mockResolvedValue(
      new Map([
        ['ISRC1', 'dz:777'],
        ['ISRC2', 'dz:777'],
      ]),
    );

    await service.refreshAll();

    const [, members] = repository.replaceChart.mock.calls[0] as [
      unknown,
      unknown[],
    ];
    expect(members).toHaveLength(1);
  });

  it('drops a track with no ISRC, since the pool could not dedupe it', async () => {
    fetchMock.mockImplementation(async (url: string) =>
      String(url).includes('/playlist/')
        ? respond({ data: [track(1), track(2, { isrc: '' })] })
        : respond({ release_date: '2024-01-01' }),
    );

    await service.refreshAll();

    const [, members] = repository.replaceChart.mock.calls[0] as [
      unknown,
      unknown[],
    ];
    expect(members).toHaveLength(1);
  });

  it('keeps a chart that answered with nothing rather than emptying it', async () => {
    fetchMock.mockImplementation(async (url: string) =>
      String(url).includes('/playlist/')
        ? respond({ data: [] })
        : respond({ release_date: '2024-01-01' }),
    );

    await expect(service.refreshAll()).rejects.toThrow();
    expect(repository.replaceChart).not.toHaveBeenCalled();
  });

  // Throwing is what makes the queue retry; swallowing would leave a chart a
  // week stale with nothing to say so.
  it('throws when a chart fails for good, so the queue backs off and retries', async () => {
    const doomed = CHARTS[1];
    fetchMock.mockImplementation(async (url: string) => {
      const target = String(url);
      if (target.includes(`/playlist/${doomed.playlistId}/`)) {
        // Deezer answers 200 with an error body when it throttles.
        return respond({ error: { code: 4 } });
      }
      return target.includes('/playlist/')
        ? respond({ data: [track(1)] })
        : respond({ release_date: '2024-01-01' });
    });

    await expect(service.refreshAll()).rejects.toThrow(doomed.slug);
    // Four attempts against a throttling API, backing off 1s at a time: the
    // wait is the behaviour under test, so the test waits for it.
  }, 20_000);

  it('recovers when a throttled call succeeds on retry', async () => {
    let first = true;
    fetchMock.mockImplementation(async (url: string) => {
      if (String(url).includes('/playlist/') && first) {
        first = false;
        return respond({ error: { code: 4 } });
      }
      return String(url).includes('/playlist/')
        ? respond({ data: [track(1)] })
        : respond({ release_date: '2024-01-01' });
    });

    await expect(service.refreshAll()).resolves.toBeDefined();
  });

  it('drops a track with no playable preview', async () => {
    fetchMock.mockImplementation(async (url: string) =>
      String(url).includes('/playlist/')
        ? respond({ data: [track(1), track(2, { preview: '' })] })
        : respond({ release_date: '2024-01-01' }),
    );

    await service.refreshAll();

    const [, members] = repository.replaceChart.mock.calls[0] as [
      unknown,
      unknown[],
    ];
    expect(members).toHaveLength(1);
  });

  it('needs seeding while any chart has no members', async () => {
    repository.countMembers.mockResolvedValueOnce(100).mockResolvedValue(0);

    await expect(service.needsSeeding()).resolves.toBe(true);
  });

  it('does not need seeding once every chart has members', async () => {
    repository.countMembers.mockResolvedValue(100);

    await expect(service.needsSeeding()).resolves.toBe(false);
  });
});

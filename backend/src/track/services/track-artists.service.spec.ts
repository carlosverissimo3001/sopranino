import { Test, TestingModule } from '@nestjs/testing';
import { TrackArtistsService } from './track-artists.service';
import { RedisService } from '@redis/redis.service';
import { AppLoggerService } from '../../logger/logger.service';
import { TRACK_ARTISTS_TTL } from '../../consts';

describe('TrackArtistsService', () => {
  let service: TrackArtistsService;
  let redis: { get: jest.Mock; set: jest.Mock };
  let fetchMock: jest.Mock;

  const answering = (body: unknown, ok = true) => ({
    ok,
    json: () => Promise.resolve(body),
  });

  beforeEach(async () => {
    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackArtistsService,
        { provide: RedisService, useValue: redis },
        {
          provide: AppLoggerService,
          useValue: { child: () => ({ warn: jest.fn() }) },
        },
      ],
    }).compile();

    service = module.get(TrackArtistsService);
  });

  const creepin = {
    artist: { name: 'Metro Boomin' },
    contributors: [
      { name: 'Metro Boomin' },
      { name: 'The Weeknd' },
      { name: '21 Savage' },
    ],
  };

  it('reads everybody credited on a Deezer track', async () => {
    fetchMock.mockResolvedValue(answering(creepin));

    await expect(
      service.artistsOf({ id: 'dz:1', artistName: 'Metro Boomin' }),
    ).resolves.toEqual(['Metro Boomin', 'The Weeknd', '21 Savage']);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.deezer.com/track/1',
      expect.anything(),
    );
  });

  it('takes a bare Deezer id as it comes from search', async () => {
    fetchMock.mockResolvedValue(answering(creepin));

    await service.artistsOf({ id: '1' });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.deezer.com/track/1',
      expect.anything(),
    );
  });

  // A Spotify answer has no Deezer id, but Deezer finds a recording by ISRC.
  it('looks a track up by its ISRC when it has no Deezer id', async () => {
    fetchMock.mockResolvedValue(answering(creepin));

    await service.artistsOf({ id: 'spotify-abc', isrc: 'us-um7-22-12345' });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.deezer.com/track/isrc:USUM72212345',
      expect.anything(),
    );
  });

  it('caches what it read, keyed by what it asked for', async () => {
    fetchMock.mockResolvedValue(answering(creepin));

    await service.artistsOf({ id: 'dz:1' });
    expect(redis.set).toHaveBeenCalledWith(
      'track:artists:1',
      JSON.stringify(['Metro Boomin', 'The Weeknd', '21 Savage']),
      TRACK_ARTISTS_TTL,
    );
  });

  it('answers from the cache without asking Deezer', async () => {
    redis.get.mockResolvedValue(JSON.stringify(['A', 'B']));

    await expect(service.artistsOf({ id: 'dz:1' })).resolves.toEqual([
      'A',
      'B',
    ]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  describe('falls back to the main artist', () => {
    const track = { id: 'dz:1', artistName: 'Metro Boomin' };

    it('when the call errors', async () => {
      fetchMock.mockRejectedValue(new Error('timed out'));
      await expect(service.artistsOf(track)).resolves.toEqual(['Metro Boomin']);
    });

    it('when Deezer refuses', async () => {
      fetchMock.mockResolvedValue(answering({}, false));
      await expect(service.artistsOf(track)).resolves.toEqual(['Metro Boomin']);
    });

    // Deezer answers 200 with an error body when a track does not exist.
    it('when Deezer answers with an error body', async () => {
      fetchMock.mockResolvedValue(answering({ error: { code: 800 } }));
      await expect(service.artistsOf(track)).resolves.toEqual(['Metro Boomin']);
    });

    it('without caching the failure, so the next guess tries again', async () => {
      fetchMock.mockRejectedValue(new Error('timed out'));
      await service.artistsOf(track);
      expect(redis.set).not.toHaveBeenCalled();
    });

    it('when there is nothing to look a track up by', async () => {
      await expect(
        service.artistsOf({ id: 'spotify-abc', artistName: 'Metro Boomin' }),
      ).resolves.toEqual(['Metro Boomin']);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});

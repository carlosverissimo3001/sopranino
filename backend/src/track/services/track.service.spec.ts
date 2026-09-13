import { Test } from '@nestjs/testing';
import { AppLoggerService } from '../../logger/logger.service';
import { TrackEntity } from '../entities/track.entity';
import { TrackRepository } from '../repositories/track.repository';
import { LastfmService } from './lastfm.service';
import { PreviewLookupService } from './preview-lookup.service';
import { TrackService } from './track.service';

describe('TrackService', () => {
  let service: TrackService;

  const lastfm = { tags: [], playcount: 2_300_000, fetchedAt: 'now' };
  const flush = () => new Promise((resolve) => setImmediate(resolve));

  const trackRepository = { updateMetadata: jest.fn() };
  const lastfmService = { getTrackInfo: jest.fn() };

  const track = (overrides: Partial<TrackEntity> = {}) =>
    new TrackEntity({
      id: 'track-1',
      name: 'Track',
      artistName: 'Artist',
      allArtists: ['Artist'],
      lastScrapedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });

  beforeEach(async () => {
    jest.clearAllMocks();
    trackRepository.updateMetadata.mockResolvedValue(undefined);
    lastfmService.getTrackInfo.mockResolvedValue(lastfm);

    const module = await Test.createTestingModule({
      providers: [
        TrackService,
        { provide: TrackRepository, useValue: trackRepository },
        { provide: PreviewLookupService, useValue: {} },
        { provide: LastfmService, useValue: lastfmService },
        {
          provide: AppLoggerService,
          useValue: { child: () => ({ warn: jest.fn(), log: jest.fn() }) },
        },
      ],
    }).compile();

    service = module.get(TrackService);
  });

  describe('enrichInBackground', () => {
    it('saves what Last.fm returns alongside the metadata already held', async () => {
      service.enrichInBackground(track({ metadata: { lastfm: undefined } }));
      await flush();

      expect(lastfmService.getTrackInfo).toHaveBeenCalledWith(
        'Track',
        'Artist',
      );
      expect(trackRepository.updateMetadata).toHaveBeenCalledWith('track-1', {
        lastfm,
      });
    });

    it('returns before Last.fm answers', () => {
      lastfmService.getTrackInfo.mockReturnValue(new Promise(() => {}));

      expect(service.enrichInBackground(track())).toBeUndefined();
    });

    it('writes nothing when Last.fm has no record', async () => {
      lastfmService.getTrackInfo.mockResolvedValue(null);

      service.enrichInBackground(track());
      await flush();

      expect(trackRepository.updateMetadata).not.toHaveBeenCalled();
    });

    it('swallows a failed write', async () => {
      trackRepository.updateMetadata.mockRejectedValue(new Error('db down'));

      service.enrichInBackground(track());

      await expect(flush()).resolves.toBeUndefined();
    });

    it('reuses fame fetched within the month', async () => {
      service.enrichInBackground(
        track({
          metadata: {
            lastfm: { ...lastfm, fetchedAt: new Date().toISOString() },
          },
        }),
      );
      await flush();

      expect(lastfmService.getTrackInfo).not.toHaveBeenCalled();
    });
  });
});

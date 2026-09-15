import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FameTier } from '@prisma/client';
import { DailyTrackService } from './daily-track.service';
import { DailyTrackRepository } from '../repositories/daily-track.repository';
import { PoolService } from '../../pool/services/pool.service';
import { TrackService } from '../../track/services/track.service';
import { TrackRepository } from '../../track/repositories/track.repository';
import { AppLoggerService } from '../../logger/logger.service';
import { TrackEntity } from '../../track/entities/track.entity';
import { DAILY_TRACK_EXCLUSION_DAYS } from '../consts';

const track = (id: string) => ({ id, name: id }) as TrackEntity;

describe('DailyTrackService', () => {
  let service: DailyTrackService;

  const repository = {
    findTrackIdForDay: jest.fn(),
    trackIdsSince: jest.fn(),
    claimDay: jest.fn(),
  };
  const poolService = { pickTrack: jest.fn() };
  const trackService = { resolvePreview: jest.fn() };
  const trackRepository = { findById: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    repository.trackIdsSince.mockResolvedValue([]);
    trackRepository.findById.mockImplementation((id: string) =>
      Promise.resolve(track(id)),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyTrackService,
        { provide: DailyTrackRepository, useValue: repository },
        { provide: PoolService, useValue: poolService },
        { provide: TrackService, useValue: trackService },
        { provide: TrackRepository, useValue: trackRepository },
        { provide: AppLoggerService, useValue: new AppLoggerService() },
      ],
    }).compile();

    service = module.get(DailyTrackService);
  });

  const day = new Date(Date.UTC(2026, 7, 26));

  describe('trackForDay', () => {
    it('gives everyone the track the day already has', async () => {
      repository.findTrackIdForDay.mockResolvedValue('dz:1');

      const result = await service.trackForDay(day);

      expect(result.id).toBe('dz:1');
      // Nothing was drawn: a day that is already decided stays decided.
      expect(poolService.pickTrack).not.toHaveBeenCalled();
    });

    it('fills a day the job never got to, rather than failing', async () => {
      repository.findTrackIdForDay
        .mockResolvedValueOnce(null)
        .mockResolvedValue('dz:2');
      poolService.pickTrack.mockResolvedValue(track('dz:2'));
      trackService.resolvePreview.mockResolvedValue('https://audio');

      const result = await service.trackForDay(day);

      expect(result.id).toBe('dz:2');
      expect(repository.claimDay).toHaveBeenCalledWith(day, 'dz:2');
    });

    it('keeps the day a writer that got there first won', async () => {
      // Two instances fill the same empty day; the row is the primary key, so
      // the loser has to play the winner's song, not its own.
      repository.findTrackIdForDay
        .mockResolvedValueOnce(null)
        .mockResolvedValue('dz:winner');
      poolService.pickTrack.mockResolvedValue(track('dz:loser'));
      trackService.resolvePreview.mockResolvedValue('https://audio');

      const result = await service.trackForDay(day);

      expect(result.id).toBe('dz:winner');
    });

    it('will not commit a track whose audio does not resolve', async () => {
      repository.findTrackIdForDay
        .mockResolvedValueOnce(null)
        .mockResolvedValue('dz:playable');
      poolService.pickTrack
        .mockResolvedValueOnce(track('dz:silent'))
        .mockResolvedValue(track('dz:playable'));
      trackService.resolvePreview
        .mockResolvedValueOnce(null)
        .mockResolvedValue('https://audio');

      await service.trackForDay(day);

      expect(repository.claimDay).toHaveBeenCalledTimes(1);
      expect(repository.claimDay).toHaveBeenCalledWith(day, 'dz:playable');
      // The dead one is not offered again on the retry.
      expect(poolService.pickTrack).toHaveBeenLastCalledWith(
        ['dz:silent'],
        undefined,
        expect.anything(),
      );
    });

    it('gives up rather than committing a day nobody can play', async () => {
      repository.findTrackIdForDay.mockResolvedValue(null);
      poolService.pickTrack.mockResolvedValue(track('dz:silent'));
      trackService.resolvePreview.mockResolvedValue(null);

      await expect(service.trackForDay(day)).rejects.toThrow(NotFoundException);
      expect(repository.claimDay).not.toHaveBeenCalled();
    });

    it('keeps a song out of the recent fortnight', async () => {
      repository.findTrackIdForDay
        .mockResolvedValueOnce(null)
        .mockResolvedValue('dz:fresh');
      repository.trackIdsSince.mockResolvedValue(['dz:heard', 'dz:also']);
      poolService.pickTrack.mockResolvedValue(track('dz:fresh'));
      trackService.resolvePreview.mockResolvedValue('https://audio');

      await service.trackForDay(day);

      const since = repository.trackIdsSince.mock.calls[0][0] as Date;
      const daysBack =
        (day.getTime() - since.getTime()) / (24 * 60 * 60 * 1000);
      expect(daysBack).toBe(DAILY_TRACK_EXCLUSION_DAYS);
      expect(poolService.pickTrack).toHaveBeenCalledWith(
        ['dz:heard', 'dz:also'],
        undefined,
        expect.anything(),
      );
    });

    it.each([
      [0.1, FameTier.EASY],
      [0.9, FameTier.MEDIUM],
    ])('draws a %s roll from %s', async (roll, tier) => {
      repository.findTrackIdForDay
        .mockResolvedValueOnce(null)
        .mockResolvedValue('dz:fresh');
      repository.trackIdsSince.mockResolvedValue([]);
      poolService.pickTrack.mockResolvedValue(track('dz:fresh'));
      trackService.resolvePreview.mockResolvedValue('https://audio');
      const random = jest.spyOn(Math, 'random').mockReturnValue(roll);

      await service.trackForDay(day);

      expect(poolService.pickTrack).toHaveBeenCalledWith([], undefined, {
        tier,
      });
      random.mockRestore();
    });
  });

  describe('fillTomorrow', () => {
    it('does nothing when tomorrow is already decided', async () => {
      repository.findTrackIdForDay.mockResolvedValue('dz:1');

      await service.fillTomorrow();

      expect(poolService.pickTrack).not.toHaveBeenCalled();
      expect(repository.claimDay).not.toHaveBeenCalled();
    });

    it('fills the day after today, not today', async () => {
      repository.findTrackIdForDay.mockResolvedValue(null);
      poolService.pickTrack.mockResolvedValue(track('dz:1'));
      trackService.resolvePreview.mockResolvedValue('https://audio');

      await service.fillTomorrow();

      const [filled] = repository.claimDay.mock.calls[0] as [Date, string];
      const midnightToday = new Date(
        Date.UTC(
          new Date().getUTCFullYear(),
          new Date().getUTCMonth(),
          new Date().getUTCDate(),
        ),
      );
      expect(filled.getTime() - midnightToday.getTime()).toBe(
        24 * 60 * 60 * 1000,
      );
    });
  });
});

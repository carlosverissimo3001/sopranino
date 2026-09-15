import { Injectable, NotFoundException } from '@nestjs/common';
import { FameTier } from '@prisma/client';
import { PoolService } from '../../pool/services/pool.service';
import { TrackService } from '../../track/services/track.service';
import { TrackEntity } from '../../track/entities/track.entity';
import { TrackRepository } from '../../track/repositories/track.repository';
import { AppLoggerService } from '../../logger/logger.service';
import { DailyTrackRepository } from '../repositories/daily-track.repository';
import { addDays, startOfDay, subDays } from 'date-fns';
import { TZDate } from '@date-fns/tz';
import {
  DAILY_TRACK_EASY_SHARE,
  DAILY_TRACK_EXCLUSION_DAYS,
  DAILY_TRACK_PICK_ATTEMPTS,
} from '../consts';

/** Midnight UTC today: the key the whole table is written against. */
function utcDay(): Date {
  return startOfDay(new TZDate(new Date(), 'UTC'));
}

@Injectable()
export class DailyTrackService {
  private readonly logger: AppLoggerService;

  constructor(
    private readonly dailyTrackRepository: DailyTrackRepository,
    private readonly poolService: PoolService,
    private readonly trackService: TrackService,
    private readonly trackRepository: TrackRepository,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.child(DailyTrackService.name);
  }

  /**
   * The song for a UTC day, filling it if the job has not. The fill is a
   * fallback, not the plan: it exists so a missed night is a slow first round
   * rather than no daily at all.
   */
  async trackForDay(day: Date): Promise<TrackEntity> {
    const existing = await this.dailyTrackRepository.findTrackIdForDay(day);
    const trackId = existing ?? (await this.fill(day));

    const track = await this.trackRepository.findById(trackId);
    if (!track) {
      throw new NotFoundException(`Daily track ${trackId} is missing`);
    }
    return track;
  }

  async today(): Promise<TrackEntity> {
    return this.trackForDay(utcDay());
  }

  /** What the job does: tomorrow, a day ahead of anyone needing it. */
  async fillTomorrow(): Promise<void> {
    const day = addDays(utcDay(), 1);
    if (await this.dailyTrackRepository.findTrackIdForDay(day)) {
      return;
    }
    await this.fill(day);
  }

  async hasToday(): Promise<boolean> {
    const day = utcDay();
    return (await this.dailyTrackRepository.findTrackIdForDay(day)) !== null;
  }

  /**
   * Draws from the pool, avoiding the recent fortnight, and only commits a
   * track once its audio has resolved — a dead preview would otherwise become
   * everybody's day.
   */
  private async fill(day: Date): Promise<string> {
    const recent = await this.dailyTrackRepository.trackIdsSince(
      subDays(day, DAILY_TRACK_EXCLUSION_DAYS),
    );
    const tried = [...recent];
    const tier =
      Math.random() < DAILY_TRACK_EASY_SHARE ? FameTier.EASY : FameTier.MEDIUM;

    for (let attempt = 0; attempt < DAILY_TRACK_PICK_ATTEMPTS; attempt++) {
      const track = await this.poolService.pickTrack(tried, undefined, {
        tier,
      });
      try {
        const previewUrl = await this.trackService.resolvePreview(track);
        if (previewUrl) {
          await this.dailyTrackRepository.claimDay(day, track.id);
          this.logger.log(
            `Daily track for ${day.toISOString().slice(0, 10)}: ${track.id}`,
          );
          // Re-read: a racing writer may have won, and its answer is the one
          // everyone else will already be playing.
          return (
            (await this.dailyTrackRepository.findTrackIdForDay(day)) ?? track.id
          );
        }
      } catch (err) {
        this.logger.warn(
          `Preview failed for ${track.id}: ${(err as Error).message}`,
        );
      }
      tried.push(track.id);
    }

    throw new NotFoundException(
      'No pool track with preview audio available for the daily.',
    );
  }
}

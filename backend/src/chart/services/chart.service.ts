import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../../logger/logger.service';
import { CHARTS, CHART_SIZE, type ChartSource } from '../chart.constants';
import { ChartRepository } from '../repositories/chart.repository';
import { DeezerClient } from '../../playlist-import/providers/deezer/client';
import { DeezerMembersService } from '../../playlist-import/providers/deezer/members.service';
import { TrackGroupService } from '../../track-group/services/track-group.service';
import type { SetMemberDto } from '../../track-group/dto/set-member.dto';
import { Transactional } from '@transaction/transactional.decorator';

@Injectable()
export class ChartService {
  private readonly logger: AppLoggerService;

  constructor(
    private readonly repository: ChartRepository,
    private readonly deezer: DeezerClient,
    private readonly deezerMembers: DeezerMembersService,
    private readonly trackGroupService: TrackGroupService,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.child(ChartService.name);
  }

  /** Refreshes every chart. Called by the scheduled job. */
  async refreshAll(): Promise<Record<string, number>> {
    const results: Record<string, number> = {};
    const failed: string[] = [];

    // Sequential rather than parallel: five charts against a rate-limited API
    // is not worth the concurrency, and a throttle costs the whole refresh.
    for (const chart of CHARTS) {
      try {
        const written = await this.refresh(chart);
        results[chart.slug] = written;
        if (written === 0) {
          failed.push(chart.slug);
        }
      } catch (error) {
        this.logger.warn(
          `Refresh failed for ${chart.slug}: ${(error as Error).message}`,
        );
        results[chart.slug] = 0;
        failed.push(chart.slug);
      }
    }

    if (failed.length) {
      // Throwing is what engages the queue's backoff. Retrying re-fetches the
      // charts that already succeeded, which is harmless: replaceChart is a
      // whole replacement inside a transaction.
      this.logger.error(
        `Chart refresh incomplete, retrying: ${JSON.stringify(results)}`,
      );
      throw new Error(`Chart refresh failed for: ${failed.join(', ')}`);
    }

    this.logger.log(`Chart refresh complete: ${JSON.stringify(results)}`);
    return results;
  }

  private async refresh(chart: ChartSource): Promise<number> {
    const tracks = await this.deezer.playlistTracks(
      chart.playlistId,
      CHART_SIZE,
    );
    const members = tracks.ok
      ? await this.deezerMembers.resolve(tracks.body)
      : [];

    if (!members.length) {
      this.logger.warn(`No tracks for ${chart.slug}; keeping the previous set`);
      return 0;
    }

    await this.store(chart, members);
    return members.length;
  }

  /** Replaced whole, so a retry never layers last week under this week. */
  @Transactional({ timeout: 60_000 })
  private async store(
    chart: ChartSource,
    members: SetMemberDto[],
  ): Promise<void> {
    const groupId = await this.repository.upsertChart({
      slug: chart.slug,
      name: chart.name,
    });
    await this.trackGroupService.replaceMembers(groupId, members);
  }

  /** Whether a refresh should run at boot rather than waiting for Monday. */
  async needsSeeding(): Promise<boolean> {
    const counts = await Promise.all(
      CHARTS.map((chart) => this.repository.countMembers(chart.name)),
    );
    return counts.some((count) => count === 0);
  }
}

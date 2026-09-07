import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { RedisService } from '@redis/redis.service';
import { AppLoggerService } from '../../logger/logger.service';
import { ChartRepository } from '../../chart/repositories/chart.repository';
import { TrackService } from '../../track/services/track.service';
import { TrackEntity } from '../../track/entities/track.entity';
import {
  DEMO_OPTION_COUNT,
  DEMO_PLAYLISTS,
  DEMO_PREVIEW_ATTEMPTS,
  DEMO_ROUND_PREFIX,
  DEMO_ROUND_TTL_SECONDS,
  DEMO_SNIPPET_STEPS,
} from '../demo.constants';
import { DemoPlaylistEntity } from '../entities/demo-playlist.entity';

import {
  DemoGuessResultDto,
  DemoRoundDto,
  DemoRoundStatus,
} from '../dto/demo-round.dto';

/**
 * Only what a reveal needs, and a minted preview URL rather than a stored one.
 */
type RoundAnswer = {
  id: string;
  name: string;
  artistName: string;
  albumImageUrl: string;
  previewUrl: string;
};

type RoundState = {
  playlistSlug: string;
  answer: RoundAnswer;
  optionIds: string[];
  attempt: number;
  wrongIds: string[];
  status: DemoRoundStatus;
};

@Injectable()
export class DemoService {
  private readonly logger: AppLoggerService;

  constructor(
    private readonly redis: RedisService,
    private readonly charts: ChartRepository,
    private readonly trackService: TrackService,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.child(DemoService.name);
  }

  /**
   * The slugs are the portfolio's contract, so they come from the configured
   * list; only the cover comes from the chart group, and a chart with no cover
   * still lists rather than disappearing.
   */
  async getPlaylists(): Promise<DemoPlaylistEntity[]> {
    const images = await this.charts.imageUrlsByName();
    return DEMO_PLAYLISTS.map(({ slug, name, chart }) => ({
      slug,
      name,
      imageUrl: images.get(chart) ?? '',
      description: null,
    }));
  }

  async createRound(playlistSlug: string): Promise<DemoRoundDto> {
    const playlist = DEMO_PLAYLISTS.find((p) => p.slug === playlistSlug);
    if (!playlist) {
      throw new NotFoundException(`Unknown playlist: ${playlistSlug}`);
    }

    const tracks = await this.charts.members(playlist.chart);
    if (tracks.length < DEMO_OPTION_COUNT) {
      // The weekly refresh has not populated this chart yet, or it failed on an
      // empty table. The client falls back to its offline round.
      throw new ServiceUnavailableException('Demo tracks are not ready yet');
    }

    // Charts store no audio: Deezer's links expire in minutes, so the answer's
    // preview is minted per round. A dead one costs a redraw, not the round.
    for (const candidate of this.shuffle(tracks).slice(
      0,
      DEMO_PREVIEW_ATTEMPTS,
    )) {
      const previewUrl = await this.preview(candidate);
      if (!previewUrl) {
        continue;
      }

      const decoys = this.shuffle(
        tracks.filter((track) => track.id !== candidate.id),
      ).slice(0, DEMO_OPTION_COUNT - 1);
      const options = this.shuffle([candidate, ...decoys]);

      const roundId = uuidv4();
      await this.save(roundId, {
        playlistSlug,
        answer: {
          id: candidate.id,
          name: candidate.name,
          artistName: candidate.artistName,
          albumImageUrl: candidate.albumImageUrl ?? '',
          previewUrl,
        },
        optionIds: options.map((option) => option.id),
        attempt: 0,
        wrongIds: [],
        status: DemoRoundStatus.PLAYING,
      });

      return {
        roundId,
        previewUrl,
        attempt: 1,
        totalAttempts: DEMO_SNIPPET_STEPS.length,
        snippetDuration: DEMO_SNIPPET_STEPS[0],
        snippetSteps: DEMO_SNIPPET_STEPS,
        options: options.map((option) => ({
          id: option.id,
          name: option.name,
          artistName: option.artistName,
        })),
      };
    }

    throw new ServiceUnavailableException('No demo track has playable audio');
  }

  async guess(roundId: string, trackId: string): Promise<DemoGuessResultDto> {
    const state = await this.load(roundId);

    if (state.status !== DemoRoundStatus.PLAYING) {
      return this.toResult(state);
    }

    // Only the four options are valid, so the answer cannot be brute-forced
    // with arbitrary track ids.
    if (!state.optionIds.includes(trackId)) {
      throw new BadRequestException('That track is not one of the options');
    }

    if (trackId === state.answer.id) {
      state.status = DemoRoundStatus.WON;
    } else {
      state.wrongIds.push(trackId);
      state.attempt += 1;
      if (state.attempt >= DEMO_SNIPPET_STEPS.length) {
        state.status = DemoRoundStatus.LOST;
      }
    }

    await this.save(roundId, state);
    return this.toResult(state);
  }

  private async preview(track: TrackEntity): Promise<string | null> {
    try {
      return await this.trackService.resolvePreview(track);
    } catch (error) {
      this.logger.warn(
        `Preview failed for ${track.id}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  private toResult(state: RoundState): DemoGuessResultDto {
    const resolved = state.status !== DemoRoundStatus.PLAYING;
    return {
      correct: state.status === DemoRoundStatus.WON,
      status: state.status,
      attempt: Math.min(state.attempt + 1, DEMO_SNIPPET_STEPS.length),
      totalAttempts: DEMO_SNIPPET_STEPS.length,
      snippetDuration:
        DEMO_SNIPPET_STEPS[
          Math.min(state.attempt, DEMO_SNIPPET_STEPS.length - 1)
        ],
      wrongIds: state.wrongIds,
      // Revealed only once the round is over: until then the client never
      // holds the answer.
      answer: resolved
        ? {
            id: state.answer.id,
            name: state.answer.name,
            artistName: state.answer.artistName,
            albumImageUrl: state.answer.albumImageUrl,
          }
        : undefined,
    };
  }

  private async save(roundId: string, state: RoundState): Promise<void> {
    await this.redis.set(
      `${DEMO_ROUND_PREFIX}${roundId}`,
      JSON.stringify(state),
      DEMO_ROUND_TTL_SECONDS,
    );
  }

  private async load(roundId: string): Promise<RoundState> {
    const raw = await this.redis.get(`${DEMO_ROUND_PREFIX}${roundId}`);
    if (!raw) {
      throw new NotFoundException('Round not found or expired');
    }
    try {
      return JSON.parse(raw) as RoundState;
    } catch {
      throw new NotFoundException('Round state is corrupted');
    }
  }

  private shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}

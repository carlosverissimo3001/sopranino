import { Injectable } from '@nestjs/common';
import { POOL_PLAYLIST_ID } from '../../consts';
import { PoolService } from '../../pool/services/pool.service';
import { TrackOptionDto } from '../../track/dto/track-option.dto';
import { TrackEntity } from '../../track/entities/track.entity';
import { TrackRepository } from '../../track/repositories/track.repository';
import { normalizeText } from '../../utils/text';
import { GameSessionEntity } from '../entities/game-session.entity';
import { GameSessionRepository } from '../repositories/game-session.repository';
import { DECOY_COUNT, isSameSong, rankDecoyIds } from '../utils/decoys';
import { shuffleInPlace } from '../utils/utils';

/** Enough to survive a few same-song rejections without a second read. */
const DECOY_BATCH = DECOY_COUNT * 4;

@Injectable()
export class ChoiceService {
  constructor(
    private readonly gameSessionRepository: GameSessionRepository,
    private readonly poolService: PoolService,
    private readonly trackRepository: TrackRepository,
  ) {}

  /**
   * The answer and three decoys, shuffled, or none at all when three cannot be
   * found - a round with two wrong options would be easier than intended.
   */
  async pickChoiceIds(
    game: GameSessionEntity,
    answer: TrackEntity,
  ): Promise<string[]> {
    const isPool = game.playlistId === POOL_PLAYLIST_ID;
    const [own, pool] = await Promise.all([
      isPool
        ? Promise.resolve([])
        : this.gameSessionRepository.findPlayedTracks(
            game.userId,
            game.playlistId,
            answer.id,
          ),
      this.poolService.candidates(game.trackGroupId),
    ]);

    const ranked = rankDecoyIds({ answer, own, pool });
    const decoys: TrackEntity[] = [];

    for (
      let start = 0;
      start < ranked.length && decoys.length < DECOY_COUNT;
      start += DECOY_BATCH
    ) {
      const ids = ranked.slice(start, start + DECOY_BATCH);
      const byId = new Map(
        (await this.trackRepository.findMany(ids)).map((t) => [t.id, t]),
      );
      for (const id of ids) {
        const track = byId.get(id);
        if (
          track &&
          !isSameSong(track, answer) &&
          !decoys.some((d) => isSameSong(d, track))
        ) {
          decoys.push(track);
          if (decoys.length === DECOY_COUNT) break;
        }
      }
    }

    if (decoys.length < DECOY_COUNT) {
      return [];
    }

    const choiceIds = [answer.id, ...decoys.map((d) => d.id)];
    shuffleInPlace(choiceIds);
    return choiceIds;
  }

  /** In stored order. Only what a button needs - no cover to match against. */
  async loadChoices(choiceTrackIds: string[]): Promise<TrackOptionDto[]> {
    const byId = new Map(
      (await this.trackRepository.findMany(choiceTrackIds)).map((t) => [
        t.id,
        t,
      ]),
    );
    return choiceTrackIds
      .map((id) => byId.get(id))
      .filter((t): t is TrackEntity => !!t)
      .map((t) => ({
        id: t.id,
        name: t.name,
        normalizedName: normalizeText(t.name),
        artist: t.artistName,
        normalizedArtist: normalizeText(t.artistName),
      }));
  }
}

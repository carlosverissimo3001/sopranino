import { Injectable } from '@nestjs/common';
import { PoolService } from '../../../pool/services/pool.service';
import type { SetMemberDto } from '../../../track-group/dto/set-member.dto';
import { DeezerClient } from './client';
import type { DeezerPlaylistTrack } from './types';

@Injectable()
export class DeezerMembersService {
  constructor(
    private readonly deezer: DeezerClient,
    private readonly poolService: PoolService,
  ) {}

  async resolve(tracks: DeezerPlaylistTrack[]): Promise<SetMemberDto[]> {
    // No ISRC means no way to tell whether the pool already holds the song,
    // and the pool is deduped by ISRC. Better dropped than entered twice.
    const playable = tracks
      .filter((track) => track.id && track.preview && track.readable !== false)
      .map((track) => ({
        ...track,
        normIsrc: (track.isrc ?? '').replace(/[^a-z0-9]/gi, '').toUpperCase(),
      }))
      .filter((track) => track.normIsrc);

    if (!playable.length) {
      return [];
    }

    const existing = await this.poolService.idsByIsrc(
      playable.map((track) => track.normIsrc),
    );

    const members: SetMemberDto[] = [];
    const seen = new Set<string>();

    for (const track of playable) {
      const poolId = existing.get(track.normIsrc);
      const trackId = poolId ?? `dz:${track.id}`;

      // A playlist can list two uploads of one song; the set holds it once.
      if (seen.has(trackId)) {
        continue;
      }
      seen.add(trackId);

      if (poolId) {
        members.push({ trackId });
        continue;
      }

      // A year costs a request, so only a song the pool has never seen asks.
      members.push({
        trackId,
        create: {
          isrc: track.normIsrc,
          name: track.title ?? '',
          artistName: track.artist?.name ?? '',
          albumName: track.album?.title ?? '',
          albumUrl: `https://www.deezer.com/album/${track.album?.id}`,
          albumImageUrl: track.album?.cover_xl ?? track.album?.cover_big,
          fame: track.rank ?? 0,
          year: await this.deezer.releaseYear(track.id!),
        },
      });
    }

    return members;
  }
}

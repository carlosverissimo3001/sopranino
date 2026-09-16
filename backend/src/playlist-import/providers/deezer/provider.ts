import { Injectable } from '@nestjs/common';
import { PlaylistSource } from '@prisma/client';
import { DeezerClient } from './client';
import { DeezerMembersService } from './members.service';
import type { SetMemberDto } from '../../../track-group/dto/set-member.dto';
import { DEEZER_SHORT_HOSTS, parsePlaylistLink } from '../../links';
import {
  PlaylistUnavailableError,
  type PlaylistInfo,
  type PlaylistProvider,
} from '../playlist-provider';

@Injectable()
export class DeezerProvider implements PlaylistProvider {
  readonly source = PlaylistSource.DEEZER;

  constructor(
    private readonly deezer: DeezerClient,
    private readonly deezerMembers: DeezerMembersService,
  ) {}

  async resolveId(link: string): Promise<string | null> {
    const parsed = parsePlaylistLink(this.source, link);
    if (!parsed) return null;
    if ('externalId' in parsed) return parsed.externalId;

    // One hop, and only onto deezer.com: a short link is somewhere Deezer sends
    // us, not somewhere a player gets to point the server.
    try {
      const response = await fetch(parsed.shortUrl, {
        redirect: 'manual',
        signal: AbortSignal.timeout(5_000),
      });
      const location = response.headers.get('location');
      if (!location) return null;
      const target = new URL(location, parsed.shortUrl);
      if (DEEZER_SHORT_HOSTS.includes(target.hostname)) return null;
      const resolved = parsePlaylistLink(this.source, target.href);
      return resolved && 'externalId' in resolved ? resolved.externalId : null;
    } catch {
      return null;
    }
  }

  async info(externalId: string): Promise<PlaylistInfo> {
    const result = await this.deezer.playlist(externalId);
    if (!result.ok) {
      if (result.code === undefined) {
        throw new Error(`Deezer did not answer for playlist ${externalId}`);
      }
      throw new PlaylistUnavailableError(externalId);
    }
    const playlist = result.body;
    if (playlist.public === false) {
      throw new PlaylistUnavailableError(externalId);
    }
    return {
      title: playlist.title,
      imageUrl: playlist.picture_xl ?? playlist.picture_big,
      checksum: playlist.checksum,
      trackCount: playlist.nb_tracks ?? 0,
    };
  }

  async members(externalId: string, max: number): Promise<SetMemberDto[]> {
    const tracks = await this.deezer.playlistTracks(externalId, max);
    if (!tracks.ok) {
      if (tracks.code === undefined) {
        throw new Error(`Deezer did not answer for playlist ${externalId}`);
      }
      throw new PlaylistUnavailableError(externalId);
    }
    return this.deezerMembers.resolve(tracks.body);
  }
}

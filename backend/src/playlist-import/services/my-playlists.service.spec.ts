import { Test } from '@nestjs/testing';
import { PlaylistSource, TrackGroupType } from '@prisma/client';
import { AuthService } from '../../auth/services/auth.service';
import { AppLoggerService } from '../../logger/logger.service';
import { PLAYLIST_SORT_BY, SORT_ORDER } from '../../playlist/consts';
import { PlaylistService } from '../../playlist/services/playlist.service';
import { PlaylistItemKind } from '../dto/my-playlists.dto';
import { MyPlaylistsService } from './my-playlists.service';
import { PlaylistImportService } from './playlist-import.service';

const spotify = (id: string, name: string, totalTracks: number) => ({
  id,
  name,
  imageUrl: `https://img/${id}`,
  owner: 'Ana',
  totalTracks,
  isPublic: true,
  externalUrl: `https://open.spotify.com/playlist/${id}`,
});

const liked = spotify('user-1-liked-songs', 'Liked Songs', 300);

const imported = (id: string, name: string, trackCount: number) => ({
  id,
  type: TrackGroupType.IMPORTED,
  name,
  slug: `deezer-${id}`,
  trackCount,
  source: PlaylistSource.DEEZER,
  externalUrl: `https://www.deezer.com/playlist/${id}`,
  pending: false,
});

describe('MyPlaylistsService', () => {
  let service: MyPlaylistsService;
  const auth = { getUserBySessionId: jest.fn() };
  const playlists = { getMyPlaylists: jest.fn() };
  const imports = { list: jest.fn() };
  const warn = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    auth.getUserBySessionId.mockResolvedValue({
      id: 'user-1',
      spotifyUserId: 'spotify-1',
    });
    playlists.getMyPlaylists.mockResolvedValue([
      liked,
      spotify('s1', 'Zebra', 10),
      spotify('s2', 'Apple', 40),
    ]);
    imports.list.mockResolvedValue([
      imported('i1', 'Mango', 25),
      imported('i2', 'banana', 5),
    ]);

    const module = await Test.createTestingModule({
      providers: [
        MyPlaylistsService,
        { provide: AuthService, useValue: auth },
        { provide: PlaylistService, useValue: playlists },
        { provide: PlaylistImportService, useValue: imports },
        { provide: AppLoggerService, useValue: { child: () => ({ warn }) } },
      ],
    }).compile();
    service = module.get(MyPlaylistsService);
  });

  const names = async (sortBy: PLAYLIST_SORT_BY, order?: SORT_ORDER) =>
    (await service.list('session-1', { sortBy, order })).items.map(
      (item) => item.name,
    );

  it('leads with Liked Songs, then imports as listed, then Spotify', async () => {
    await expect(names(PLAYLIST_SORT_BY.DEFAULT)).resolves.toEqual([
      'Liked Songs',
      'Mango',
      'banana',
      'Zebra',
      'Apple',
    ]);
  });

  it('sorts both kinds together by name, ignoring case', async () => {
    await expect(names(PLAYLIST_SORT_BY.NAME)).resolves.toEqual([
      'Liked Songs',
      'Apple',
      'banana',
      'Mango',
      'Zebra',
    ]);
  });

  it('reverses the names on the way back, Liked Songs still first', async () => {
    await expect(
      names(PLAYLIST_SORT_BY.NAME, SORT_ORDER.DESC),
    ).resolves.toEqual(['Liked Songs', 'Zebra', 'Mango', 'banana', 'Apple']);
  });

  it('sorts by size smallest first when asked the other way', async () => {
    await expect(
      names(PLAYLIST_SORT_BY.TRACKS, SORT_ORDER.ASC),
    ).resolves.toEqual(['Liked Songs', 'banana', 'Zebra', 'Mango', 'Apple']);
  });

  it('sorts both kinds together by size, largest first', async () => {
    await expect(names(PLAYLIST_SORT_BY.TRACKS)).resolves.toEqual([
      'Liked Songs',
      'Apple',
      'Mango',
      'Zebra',
      'banana',
    ]);
  });

  it('says which kind each item is and how to play it', async () => {
    const { items } = await service.list('session-1', {
      sortBy: PLAYLIST_SORT_BY.DEFAULT,
    });

    expect(items[1]).toMatchObject({
      kind: PlaylistItemKind.IMPORTED,
      id: 'i1',
      slug: 'deezer-i1',
      source: PlaylistSource.DEEZER,
      trackCount: 25,
    });
    expect(items[3]).toMatchObject({
      kind: PlaylistItemKind.SPOTIFY,
      id: 's1',
      trackCount: 10,
      source: PlaylistSource.SPOTIFY,
    });
  });

  it('reads the first page of Spotify, so no extra Spotify calls', async () => {
    await service.list('session-1', { sortBy: PLAYLIST_SORT_BY.NAME });

    expect(playlists.getMyPlaylists).toHaveBeenCalledTimes(1);
    expect(playlists.getMyPlaylists).toHaveBeenCalledWith('session-1');
  });

  it('never asks Spotify for an account without it', async () => {
    auth.getUserBySessionId.mockResolvedValue({ id: 'user-1' });

    const result = await service.list('session-1');

    expect(playlists.getMyPlaylists).not.toHaveBeenCalled();
    expect(result.items.map((item) => item.name)).toEqual(['Mango', 'banana']);
    expect(result.spotifyUnavailable).toBe(false);
  });

  // One service being down should not blank the whole section.
  it('still lists imports when Spotify fails', async () => {
    playlists.getMyPlaylists.mockRejectedValue(new Error('429'));

    const result = await service.list('session-1');

    expect(result.items.map((item) => item.name)).toEqual(['Mango', 'banana']);
    expect(result.spotifyUnavailable).toBe(true);
    expect(warn).toHaveBeenCalled();
  });
});

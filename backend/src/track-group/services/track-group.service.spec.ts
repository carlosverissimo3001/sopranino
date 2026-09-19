import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TrackGroupType } from '@prisma/client';
import { TrackGroupRepository } from '../repositories/track-group.repository';
import { TrackGroupService } from './track-group.service';
import { TrackRepository } from '@tracks/repositories/track.repository';
import { PoolService } from '@/pool/services/pool.service';

jest.mock('@transaction/transaction.store', () => ({
  ...jest.requireActual('@transaction/transaction.store'),
  getBasePrismaClient: () => ({
    $transaction: (fn: (tx: unknown) => Promise<unknown>) => fn({}),
  }),
}));

const mockRepository = {
  listWithCounts: jest.fn(),
  findById: jest.fn(),
  findBySlugWithCount: jest.fn(),
  isMember: jest.fn(),
  replaceTracks: jest.fn(),
};
const mockTracks = { createMissing: jest.fn() };
const mockPool = { addGroupOnly: jest.fn(), forget: jest.fn() };

const EIGHTIES = {
  id: 'group-1',
  type: TrackGroupType.DECADE,
  name: '1980s',
  slug: '1980s',
  imageUrl: 'https://example.test/eighties.jpg',
  createdAt: new Date(),
  trackCount: 490,
};

const chart = (name: string) => ({
  id: `chart-${name}`,
  type: TrackGroupType.CHART,
  name,
  slug: `top-${name.toLowerCase()}`,
  imageUrl: null,
  createdAt: new Date(),
  trackCount: 50,
});

/** The repository's own order: by name, which is where a tie falls back to. */
const CHARTS = ['Brazil', 'Portugal', 'Spain', 'UK', 'USA', 'Worldwide'].map(
  chart,
);

async function build() {
  const module = await Test.createTestingModule({
    providers: [
      TrackGroupService,
      { provide: TrackGroupRepository, useValue: mockRepository },
      { provide: TrackRepository, useValue: mockTracks },
      { provide: PoolService, useValue: mockPool },
    ],
  }).compile();
  return module.get(TrackGroupService);
}

describe('TrackGroupService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('catalog', () => {
    const trusted = { spotifyUserId: 'sp-1', isTrusted: true, country: 'PT' };

    it('asks for every kind at once and files each under its own', async () => {
      mockRepository.listWithCounts.mockImplementation((type) =>
        Promise.resolve(type === TrackGroupType.DECADE ? [EIGHTIES] : []),
      );
      const service = await build();

      const catalog = await service.catalog(null);

      expect(catalog.decade.map((group) => group.slug)).toEqual(['1980s']);
      expect(catalog.artist).toEqual([]);
      expect(mockRepository.listWithCounts).toHaveBeenCalledWith(
        TrackGroupType.CHART,
      );
    });

    it('leaves the special sets out for anyone they were not made for', async () => {
      mockRepository.listWithCounts.mockResolvedValue([]);
      const service = await build();

      await service.catalog(null);

      expect(mockRepository.listWithCounts).not.toHaveBeenCalledWith(
        TrackGroupType.SPECIAL,
      );
    });

    it('lists them for a trusted Spotify account, and never imports', async () => {
      mockRepository.listWithCounts.mockResolvedValue([]);
      const service = await build();

      await service.catalog(trusted as never);

      expect(mockRepository.listWithCounts).toHaveBeenCalledWith(
        TrackGroupType.SPECIAL,
      );
      expect(mockRepository.listWithCounts).not.toHaveBeenCalledWith(
        TrackGroupType.IMPORTED,
      );
    });
  });

  it('returns what the picker needs and nothing else', async () => {
    mockRepository.listWithCounts.mockResolvedValue([EIGHTIES]);
    const service = await build();

    const [group] = await service.list(TrackGroupType.DECADE);

    expect(group).toEqual({
      id: 'group-1',
      type: TrackGroupType.DECADE,
      name: '1980s',
      slug: '1980s',
      trackCount: 490,
      imageUrl: 'https://example.test/eighties.jpg',
    });
    // createdAt is ours, not the player's business.
    expect(group).not.toHaveProperty('createdAt');
  });

  // A set that small repeats songs within a few games.
  it('lists only artists with enough playable songs', async () => {
    const artist = (name: string, trackCount: number) => ({
      ...EIGHTIES,
      id: name,
      type: TrackGroupType.ARTIST,
      name,
      slug: name.toLowerCase(),
      trackCount,
    });
    mockRepository.listWithCounts.mockResolvedValue([
      artist('Big', 300),
      artist('Edge', 40),
      artist('Thin', 39),
    ]);
    const service = await build();

    const groups = await service.list(TrackGroupType.ARTIST);

    expect(groups.map((group) => group.name)).toEqual(['Big', 'Edge']);
  });

  it('keeps the minimum to artists', async () => {
    mockRepository.listWithCounts.mockResolvedValue([
      { ...EIGHTIES, trackCount: 10 },
    ]);
    const service = await build();

    expect(await service.list(TrackGroupType.DECADE)).toHaveLength(1);
  });

  describe('the chart a player sees first', () => {
    beforeEach(() => mockRepository.listWithCounts.mockResolvedValue(CHARTS));

    it("leads with the chart for the player's own country", async () => {
      const service = await build();

      const groups = await service.list(TrackGroupType.CHART, 'PT');

      expect(groups.map((g) => g.name)).toEqual([
        'Portugal',
        'Brazil',
        'Spain',
        'UK',
        'USA',
        'Worldwide',
      ]);
    });

    // Spotify says GB and US; the charts are called UK and USA.
    it('maps a country code that does not match the chart name', async () => {
      const service = await build();

      await expect(
        service.list(TrackGroupType.CHART, 'GB'),
      ).resolves.toHaveProperty('0.name', 'UK');
      await expect(
        service.list(TrackGroupType.CHART, 'US'),
      ).resolves.toHaveProperty('0.name', 'USA');
    });

    it('accepts a lowercase code', async () => {
      const service = await build();

      const groups = await service.list(TrackGroupType.CHART, 'br');

      expect(groups[0].name).toBe('Brazil');
    });

    // A player in a country with no chart has no better order to be given, so
    // they get the one everybody else sees rather than an arbitrary shuffle.
    it('leaves the order alone for a country with no chart', async () => {
      const service = await build();

      const groups = await service.list(TrackGroupType.CHART, 'JP');

      expect(groups.map((g) => g.name)).toEqual(CHARTS.map((c) => c.name));
    });

    it('leaves the order alone for a player we know no country for', async () => {
      const service = await build();

      const groups = await service.list(TrackGroupType.CHART);

      expect(groups.map((g) => g.name)).toEqual(CHARTS.map((c) => c.name));
    });

    // The country only means anything for charts: there is no Portuguese 1980s.
    it('ignores the country for decades and genres', async () => {
      mockRepository.listWithCounts.mockResolvedValue([
        chart('Portugal'),
        EIGHTIES,
      ]);
      const service = await build();

      const groups = await service.list(TrackGroupType.DECADE, 'PT');

      expect(groups[0].name).toBe('Portugal');
    });
  });

  it('leaves a missing cover absent rather than null', async () => {
    mockRepository.listWithCounts.mockResolvedValue([
      { ...EIGHTIES, imageUrl: null },
    ]);
    const service = await build();

    const [group] = await service.list(TrackGroupType.DECADE);

    expect(group.imageUrl).toBeUndefined();
  });

  describe('by slug', () => {
    const eighties = { ...EIGHTIES, type: TrackGroupType.DECADE };

    it('finds the group a shared link names', async () => {
      mockRepository.findBySlugWithCount.mockResolvedValue(eighties);
      const service = await build();

      await expect(service.bySlug('1980s', null)).resolves.toMatchObject({
        slug: '1980s',
        trackCount: 490,
      });
    });

    it('answers the same for a special group as for one that is not there', async () => {
      // Otherwise a slug is a way to find out that a group exists.
      mockRepository.findBySlugWithCount.mockResolvedValue({
        ...EIGHTIES,
        type: TrackGroupType.SPECIAL,
      });
      const service = await build();

      await expect(service.bySlug('anything', null)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('gives a special group to the account it is for', async () => {
      mockRepository.findBySlugWithCount.mockResolvedValue({
        ...EIGHTIES,
        type: TrackGroupType.SPECIAL,
      });
      const service = await build();

      await expect(
        service.bySlug('anything', {
          spotifyUserId: 'spotify-1',
          isTrusted: true,
        } as never),
      ).resolves.toMatchObject({ trackCount: 490 });
    });

    it('refuses a slug nobody has', async () => {
      mockRepository.findBySlugWithCount.mockResolvedValue(null);
      const service = await build();

      await expect(service.bySlug('made-up', null)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  it('refuses a group nobody has, rather than starting an empty round', async () => {
    mockRepository.findById.mockResolvedValue(null);
    const service = await build();

    await expect(service.requireById('made-up')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  describe('who a special group is for', () => {
    const spotifyTrusted = {
      spotifyUserId: 'spotify-1',
      isTrusted: true,
    } as never;
    const spotifyUntrusted = {
      spotifyUserId: 'spotify-1',
      isTrusted: false,
    } as never;
    const trustedNoSpotify = {
      spotifyUserId: null,
      isTrusted: true,
    } as never;

    it('shows an ordinary group to anyone, signed in or not', () => {
      expect(TrackGroupService.isListable(TrackGroupType.DECADE, null)).toBe(
        true,
      );
    });

    it('shows a special group to a trusted Spotify account', () => {
      expect(
        TrackGroupService.isListable(TrackGroupType.SPECIAL, spotifyTrusted),
      ).toBe(true);
    });

    it('hides it from an untrusted Spotify account', () => {
      expect(
        TrackGroupService.isListable(TrackGroupType.SPECIAL, spotifyUntrusted),
      ).toBe(false);
    });

    it('hides it from a trusted account with no Spotify', () => {
      expect(
        TrackGroupService.isListable(TrackGroupType.SPECIAL, trustedNoSpotify),
      ).toBe(false);
    });

    it('hides it from a visitor with no session at all', () => {
      expect(TrackGroupService.isListable(TrackGroupType.SPECIAL, null)).toBe(
        false,
      );
    });
  });

  describe('an imported set', () => {
    const imported = {
      ...EIGHTIES,
      id: 'import-1',
      type: TrackGroupType.IMPORTED,
    };
    const player = { id: 'user-1' } as never;

    it('is never listed, not even to a trusted account', () => {
      expect(
        TrackGroupService.isListable(TrackGroupType.IMPORTED, {
          spotifyUserId: 's',
          isTrusted: true,
        } as never),
      ).toBe(false);
    });

    it('opens for a member', async () => {
      mockRepository.findById.mockResolvedValue(imported);
      mockRepository.isMember.mockResolvedValue(true);
      const service = await build();

      await expect(service.requireVisible('import-1', player)).resolves.toBe(
        imported,
      );
      expect(mockRepository.isMember).toHaveBeenCalledWith(
        'user-1',
        'import-1',
      );
    });

    it('is missing for anyone else', async () => {
      mockRepository.findById.mockResolvedValue(imported);
      mockRepository.isMember.mockResolvedValue(false);
      const service = await build();

      await expect(service.requireVisible('import-1', player)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('is missing for a visitor, without asking who is a member', async () => {
      mockRepository.findBySlugWithCount.mockResolvedValue(imported);
      const service = await build();

      await expect(service.bySlug('1980s', null)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.isMember).not.toHaveBeenCalled();
    });
  });

  describe('replacing a set', () => {
    it('creates only the songs the pool lacks, and swaps the list whole', async () => {
      const service = await build();
      const song = {
        isrc: 'ISRC1',
        name: 'Song',
        artistName: 'Artist',
        albumName: 'Album',
        albumUrl: 'https://www.deezer.com/album/9',
        albumImageUrl: 'https://example.test/a.jpg',
        fame: 500,
        year: 2024,
      };

      await service.replaceMembers('group-1', [
        { trackId: 'dz:1', create: song },
        { trackId: 'dz:2' },
      ]);

      expect(mockTracks.createMissing).toHaveBeenCalledWith([
        {
          id: 'dz:1',
          isrc: 'ISRC1',
          name: 'Song',
          artistName: 'Artist',
          albumName: 'Album',
          albumUrl: 'https://www.deezer.com/album/9',
          albumImageUrl: 'https://example.test/a.jpg',
        },
      ]);
      expect(mockPool.addGroupOnly).toHaveBeenCalledWith([
        { id: 'dz:1', isrc: 'ISRC1', year: 2024, fame: 500 },
      ]);
      expect(mockRepository.replaceTracks).toHaveBeenCalledWith('group-1', [
        'dz:1',
        'dz:2',
      ]);
    });

    // A set's candidates are cached; stale ones would draw from the old list.
    it('forgets the cached candidates', async () => {
      const service = await build();

      await service.replaceMembers('group-1', []);

      expect(mockPool.forget).toHaveBeenCalledWith('group-1');
    });
  });
});

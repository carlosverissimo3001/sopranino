import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TrackGroupType } from '@prisma/client';
import { TrackGroupRepository } from '../repositories/track-group.repository';
import { TrackGroupService } from './track-group.service';

const mockRepository = {
  listWithCounts: jest.fn(),
  findById: jest.fn(),
  findBySlugWithCount: jest.fn(),
};

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
    ],
  }).compile();
  return module.get(TrackGroupService);
}

describe('TrackGroupService', () => {
  beforeEach(() => jest.clearAllMocks());

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
      expect(TrackGroupService.isVisible(TrackGroupType.DECADE, null)).toBe(
        true,
      );
    });

    it('shows a special group to a trusted Spotify account', () => {
      expect(
        TrackGroupService.isVisible(TrackGroupType.SPECIAL, spotifyTrusted),
      ).toBe(true);
    });

    it('hides it from an untrusted Spotify account', () => {
      expect(
        TrackGroupService.isVisible(TrackGroupType.SPECIAL, spotifyUntrusted),
      ).toBe(false);
    });

    it('hides it from a trusted account with no Spotify', () => {
      expect(
        TrackGroupService.isVisible(TrackGroupType.SPECIAL, trustedNoSpotify),
      ).toBe(false);
    });

    it('hides it from a visitor with no session at all', () => {
      expect(TrackGroupService.isVisible(TrackGroupType.SPECIAL, null)).toBe(
        false,
      );
    });
  });
});

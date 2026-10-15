'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Search, X } from 'lucide-react';
import { PlaylistFilters } from '@/components/features/playlist/PlaylistFilters';
import { NATURAL_ORDER, flip } from '@/hooks/playlists/usePlaylistFilters';
import { PlaylistSortBy as SortBy, SortOrder } from '@/sdk';
import { AppHeader } from '@/components/features/AppHeader';
import { AppFooter } from '@/components/features/AppFooter';
import { TrackGroupCard } from '@/components/track-group/TrackGroupCard';
import { AskForASetCard } from '@/components/features/track-group/AskForASetCard';
import { CardSkeleton } from '@/components/ui/CardSkeleton';
import { useMe } from '@/hooks/auth/useMe';
import { useTrackGroups } from '@/hooks/track-groups/useTrackGroups';
import { useMyPlaylistLibrary } from '@/hooks/playlists/useMyPlaylistLibrary';
import { PlaylistCard } from '@/components/playlist/PlaylistCard';
import { ImportedPlaylistCard } from '@/components/features/imports/ImportedPlaylistCard';
import { PlaylistSource } from '@/lib/playlist-links';
import { PlaylistItemKind } from '@/sdk';
import { usePlaylistFilters } from '@/hooks/playlists/usePlaylistFilters';
import { TrackGroupControllerListTypeEnum as Kind } from '@/sdk';
import type { TrackGroupDto } from '@/sdk';

/** The purple cards are edged in it, so the filter names them by it. */
const SOURCES = [
  {
    value: 'ALL' as const,
    label: 'All',
    accent: { bg: 'bg-fg', text: 'text-bg' },
  },
  { value: PlaylistItemKind.Spotify, label: 'Spotify' },
  {
    value: PlaylistItemKind.Imported,
    label: 'Imported',
    accent: { bg: 'bg-[#A238FF]', text: 'text-white' },
  },
];

/** Yours first, then what everyone can play. */
const YOURS = 'YOURS' as const;
/** Only while searching: every kind at once. */
const EVERY = 'EVERY' as const;
type Chip = typeof YOURS | typeof EVERY | Kind;

const KINDS = [
  { type: Kind.Artist, label: 'Artists', keepServerOrder: false },
  { type: Kind.Decade, label: 'Decades', keepServerOrder: false },
  { type: Kind.Genre, label: 'Genres', keepServerOrder: false },
  { type: Kind.Chart, label: 'Charts', keepServerOrder: true },
  { type: Kind.Special, label: 'Specials', keepServerOrder: true },
] as const;

const bySize = (a: TrackGroupDto, b: TrackGroupDto) =>
  b.trackCount - a.trackCount;

/** Everything the rails hold, in one place, for a player who wants the list. */
export function BrowsePage() {
  const { data: user } = useMe();
  const asked = useSearchParams().get('kind');
  const library = useMyPlaylistLibrary(SortBy.Default, SortOrder.Asc);
  const all = useMemo(
    () => (user?.hasAccount ? (library.data?.items ?? []) : []),
    [user?.hasAccount, library.data],
  );
  const source = usePlaylistFilters();
  const askedSource = useSearchParams().get('source');
  const hasBoth =
    all.some((item) => item.kind === PlaylistItemKind.Spotify) &&
    all.some((item) => item.kind === PlaylistItemKind.Imported);
  const mine =
    hasBoth && source.kind !== 'ALL'
      ? all.filter((item) => item.kind === source.kind)
      : all;
  const [query, setQuery] = useState('');
  const [sourcePicked, setSourcePicked] = useState(false);
  // The rail's own filter travels with the link, once.
  if (!sourcePicked && askedSource && askedSource !== source.kind) {
    source.setKind(askedSource as typeof source.kind);
    setSourcePicked(true);
  }
  const [kind, setKind] = useState<Chip>(
    asked === YOURS
      ? YOURS
      : (KINDS.find((option) => option.type === asked)?.type ?? Kind.Artist),
  );
  const [sortBy, setSortBy] = useState<SortBy>(SortBy.Default);
  const [order, setOrder] = useState<SortOrder>(SortOrder.Asc);

  /** The same order again turns around; another starts its own way. */
  const chooseSort = (next: SortBy) => {
    setOrder(next === sortBy ? flip(order) : NATURAL_ORDER[next]);
    setSortBy(next);
  };

  const artists = useTrackGroups(Kind.Artist);
  const decades = useTrackGroups(Kind.Decade);
  const genres = useTrackGroups(Kind.Genre);
  const charts = useTrackGroups(Kind.Chart);
  const specials = useTrackGroups(Kind.Special);
  const byType = useMemo(
    () => ({
      [Kind.Artist]: artists.data ?? [],
      [Kind.Decade]: decades.data ?? [],
      [Kind.Genre]: genres.data ?? [],
      [Kind.Chart]: charts.data ?? [],
      [Kind.Special]: specials.data ?? [],
    }),
    [artists.data, decades.data, genres.data, charts.data, specials.data],
  );

  const searching = query.trim().length > 0;

  /** A search spans every kind, so it starts and ends on a real chip. */
  const search = (next: string) => {
    if (next.trim() && !query.trim()) setKind(EVERY);
    if (!next.trim())
      setKind((previous) => (previous === EVERY ? Kind.Artist : previous));
    setQuery(next);
  };

  /** A name that starts with what was typed comes before one that contains it. */
  const rank = (name: string, needle: string) =>
    name.toLowerCase().startsWith(needle) ? 0 : 1;

  /** Typing searches the whole catalogue: nobody knows which chip holds it. */
  const hits = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return {} as Record<string, TrackGroupDto[]>;
    const found: Record<string, TrackGroupDto[]> = {};
    for (const { type } of KINDS) {
      const matched = byType[type]
        .filter((group) => group.name.toLowerCase().includes(needle))
        .sort(
          (a, b) =>
            rank(a.name, needle) - rank(b.name, needle) ||
            a.name.localeCompare(b.name),
        );
      if (matched.length > 0) found[type] = matched;
    }
    return found;
  }, [byType, query]);

  const mineHits = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return all
      .filter((item) => item.name.toLowerCase().includes(needle))
      .sort(
        (a, b) =>
          rank(a.name, needle) - rank(b.name, needle) ||
          a.name.localeCompare(b.name),
      );
  }, [all, query]);

  /** How many each chip matched, so the chips keep working while searching. */
  const matches: Record<string, number> = {
    [YOURS]: mineHits.length,
    ...Object.fromEntries(
      KINDS.map(({ type }) => [type, hits[type]?.length ?? 0]),
    ),
  };
  const totalHits = Object.values(matches).reduce((sum, n) => sum + n, 0);

  const shown = useMemo(() => {
    // Yours has its own cards, and "All" only exists while searching.
    if (kind === YOURS || kind === EVERY) return [];
    const option = KINDS.find((entry) => entry.type === kind);
    const groups = byType[kind];
    const sign = order === SortOrder.Asc ? 1 : -1;

    if (sortBy === SortBy.Name) {
      return [...groups].sort((a, b) => sign * a.name.localeCompare(b.name));
    }
    if (sortBy === SortBy.Tracks) {
      return [...groups].sort((a, b) => -sign * bySize(a, b));
    }
    // Default: the server's own order where it has one, fullest first elsewhere.
    return option?.keepServerOrder ? groups : [...groups].sort(bySize);
  }, [byType, kind, order, sortBy]);

  return (
    <main className="relative flex min-h-screen flex-col text-fg">
      <AppHeader user={user} />

      <div className="relative z-10 mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-bold text-fg/50 transition-colors hover:text-fg"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Home
        </Link>

        <div className="relative mb-5">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fg/30"
            aria-hidden
          />
          <input
            value={query}
            onChange={(event) => search(event.target.value)}
            placeholder="Search sets and playlists"
            aria-label="Search sets and playlists"
            className="w-full rounded-full border border-fg/10 bg-fg/[0.04] py-3 pl-11 pr-11 text-sm text-fg placeholder:text-fg/35 focus:border-spotify-green/40 focus:outline-none"
          />
          {searching && (
            <button
              type="button"
              onClick={() => search('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-fg/40 transition-colors hover:bg-fg/10 hover:text-fg"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {searching && (
              <Chip
                label="All"
                count={totalHits}
                selected={kind === EVERY}
                onClick={() => setKind(EVERY)}
              />
            )}
            {all.length > 0 && (
              <Chip
                label="Yours"
                count={searching ? matches[YOURS] : all.length}
                selected={kind === YOURS}
                muted={searching && matches[YOURS] === 0}
                onClick={() => setKind(YOURS)}
              />
            )}
            {KINDS.filter((option) => byType[option.type].length > 0).map(
              (option) => (
                <Chip
                  key={option.type}
                  label={option.label}
                  count={
                    searching
                      ? matches[option.type]
                      : byType[option.type].length
                  }
                  muted={searching && matches[option.type] === 0}
                  selected={kind === option.type}
                  onClick={() => setKind(option.type)}
                />
              ),
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Where they came from, for the player's own playlists only. */}
            {kind === YOURS && hasBoth && (
              <PlaylistFilters
                kinds={SOURCES}
                kind={source.kind}
                onKindChange={source.setKind}
              />
            )}
            <PlaylistFilters
              sortBy={sortBy}
              order={order}
              onSortByChange={chooseSort}
            />
          </div>
        </div>

        {searching ? (
          <SearchResults
            hits={hits}
            mine={mineHits.length}
            only={kind}
            renderMine={() =>
              mineHits.map((item, index) =>
                item.kind === PlaylistItemKind.Imported ? (
                  <ImportedPlaylistCard key={item.id} set={item} />
                ) : (
                  <PlaylistCard
                    key={item.id}
                    index={index}
                    playlist={{
                      id: item.id,
                      name: item.name,
                      imageUrl: item.imageUrl ?? '',
                      totalTracks: item.trackCount,
                    }}
                    source={PlaylistSource.Spotify}
                  />
                ),
              )
            }
          />
        ) : artists.isPending || (kind === YOURS && library.isPending) ? (
          <Grid>
            {Array.from({ length: 10 }).map((_, index) => (
              <CardSkeleton key={`set-skeleton-${index}`} />
            ))}
          </Grid>
        ) : kind === YOURS ? (
          <Grid>
            {mine.map((item, index) =>
              item.kind === PlaylistItemKind.Imported ? (
                <ImportedPlaylistCard key={item.id} set={item} />
              ) : (
                <PlaylistCard
                  key={item.id}
                  index={index}
                  playlist={{
                    id: item.id,
                    name: item.name,
                    imageUrl: item.imageUrl ?? '',
                    totalTracks: item.trackCount,
                  }}
                  source={PlaylistSource.Spotify}
                />
              ),
            )}
          </Grid>
        ) : (
          <Grid>
            {shown.map((group) => (
              <TrackGroupCard key={group.id} group={group} />
            ))}
            {kind === Kind.Artist && <AskForASetCard />}
          </Grid>
        )}
      </div>

      <AppFooter />
    </main>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 justify-center gap-3 sm:gap-6 md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
      {children}
    </div>
  );
}

function Chip({
  label,
  count,
  selected,
  muted = false,
  onClick,
}: {
  label: string;
  count: number;
  selected: boolean;
  /** Nothing matched, so it stays on the row but stops asking to be clicked. */
  muted?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      disabled={muted}
      className={`rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${
        selected
          ? 'bg-green-500/15 text-green-400'
          : muted
            ? 'text-fg/20'
            : 'text-fg/50 hover:bg-fg/5 hover:text-fg'
      }`}
    >
      {label}
      <span className="ml-1.5 tabular-nums text-fg/30">{count}</span>
    </button>
  );
}

/** Grouped by kind, each under its own heading, best match first. */
function SearchResults({
  hits,
  mine,
  only,
  renderMine,
}: {
  hits: Record<string, TrackGroupDto[]>;
  mine: number;
  only: Chip;
  renderMine: () => React.ReactNode;
}) {
  const sections = KINDS.filter(
    ({ type }) =>
      (hits[type]?.length ?? 0) > 0 && (only === EVERY || only === type),
  );
  const showMine = mine > 0 && (only === EVERY || only === YOURS);

  if (!showMine && sections.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-fg/45">
        Nothing by that name.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {showMine && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-fg/40">
            Yours
          </h2>
          <Grid>{renderMine()}</Grid>
        </section>
      )}
      {sections.map(({ type, label }) => (
        <section key={type}>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-fg/40">
            {label}
          </h2>
          <Grid>
            {hits[type].map((group) => (
              <TrackGroupCard key={group.id} group={group} />
            ))}
          </Grid>
        </section>
      ))}
    </div>
  );
}

/** The page's shape before it has anything to put in it. */
export function BrowseSkeleton() {
  return (
    <main className="relative flex min-h-screen flex-col text-fg">
      <div className="relative z-10 mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-6 h-4 w-16 rounded-full bg-fg/[0.06]" />
        <div className="mb-5 h-12 w-full rounded-full border border-fg/10 bg-fg/[0.04]" />
        <div className="mb-6 flex flex-wrap gap-1.5">
          {[64, 72, 80, 68, 70].map((width) => (
            <div
              key={width}
              style={{ width }}
              className="h-9 rounded-full bg-fg/[0.05]"
            />
          ))}
        </div>
        <Grid>
          {Array.from({ length: 10 }).map((_, index) => (
            <CardSkeleton key={`browse-skeleton-${index}`} />
          ))}
        </Grid>
      </div>
    </main>
  );
}

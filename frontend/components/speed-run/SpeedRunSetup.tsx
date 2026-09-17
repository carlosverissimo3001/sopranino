'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ListMusic, Shuffle, Trophy, Check } from 'lucide-react';
import {
  isPlayable,
  useMyPlaylistLibrary,
} from '@/hooks/playlists/useMyPlaylistLibrary';
import { useTrackGroups } from '@/hooks/track-groups/useTrackGroups';
import { AskForASet } from '@/components/features/track-group/AskForASet';
import { DIFFICULTIES } from '@/lib/difficulty';
import {
  StartRunDtoDifficultyEnum as GauntletDifficulty,
  StartRunDtoSourceEnum,
  TrackGroupDtoTypeEnum,
  PlaylistItemKind,
} from '@/sdk';
import type { StartRunDto } from '@/sdk';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Five across on wide screens, taking the height the rest of the page (about
// 660px) leaves, from a peek at the third row up to three full rows.
const GRID =
  'grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[24rem] lg:max-h-[clamp(17.5rem,calc(100dvh-660px),26rem)] overflow-y-auto';

/** What the run will be played against. `id` is absent for the whole pool. */
interface Selection {
  source: StartRunDtoSourceEnum;
  id?: string;
}

interface SpeedRunSetupProps {
  onStart: (dto: StartRunDto) => void;
  isStarting: boolean;
  startError?: string;
  personalBest: number;
}

/** Curated and playlist tiles are the same thing to a player: somewhere to run from. */
function SourceTile({
  name,
  imageUrl,
  isSelected,
  onSelect,
}: {
  name: string;
  imageUrl?: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      onClick={onSelect}
      whileTap={{ scale: 0.96 }}
      className={`relative flex flex-col rounded-xl overflow-hidden border transition-all ${
        isSelected
          ? 'border-orange-500/60 ring-2 ring-orange-500/40'
          : 'border-fg/10 hover:border-fg/20'
      }`}
    >
      <div className="relative aspect-square w-full bg-fg/5">
        {imageUrl ? (
          <Image src={imageUrl} alt="" fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ListMusic className="w-6 h-6 text-fg/20" />
          </div>
        )}
        {isSelected && (
          <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            </div>
          </div>
        )}
      </div>
      <div className="px-1.5 py-1 bg-surface/60">
        <p className="text-[10px] font-semibold text-fg/80 truncate leading-tight">
          {name}
        </p>
      </div>
    </motion.button>
  );
}

export function SpeedRunSetup({
  onStart,
  isStarting,
  startError,
  personalBest,
}: SpeedRunSetupProps) {
  // One selection across both tabs: two ids would leave Start with no way to
  // say which of them it meant. Ranked is where a player lands, so the pool is
  // never the tab nobody opens.
  const [tab, setTab] = useState<StartRunDtoSourceEnum>(
    StartRunDtoSourceEnum.Curated,
  );
  const [selected, setSelected] = useState<Selection | null>(null);
  // The leaderboard links here with the difficulty it was showing.
  const askedDifficulty = useSearchParams().get('difficulty');
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<GauntletDifficulty>(
      DIFFICULTIES.find((d) => d.value === askedDifficulty)?.value ??
        GauntletDifficulty.Medium,
    );

  // Disabled for a visitor without an account, which leaves both lists empty.
  const { data: library, isLoading: isLoadingPlaylists } =
    useMyPlaylistLibrary();
  const playable = (library?.items ?? []).filter(isPlayable);
  const playlists = playable.filter(
    (item) => item.kind === PlaylistItemKind.Spotify,
  );
  // One kind per query, since that is what the endpoint takes. A kind with no
  // groups drops out, so genres cost nothing until the pool has any and the
  // picker needs no change when it does — a new kind is one line here.
  const { data: artists } = useTrackGroups(TrackGroupDtoTypeEnum.Artist);
  const { data: decades } = useTrackGroups(TrackGroupDtoTypeEnum.Decade);
  const { data: genres } = useTrackGroups(TrackGroupDtoTypeEnum.Genre);
  const { data: charts } = useTrackGroups(TrackGroupDtoTypeEnum.Chart);
  const imported = playable.filter(
    (item) => item.kind === PlaylistItemKind.Imported,
  );
  const kinds = [
    { label: 'Artists', groups: artists },
    { label: 'Decades', groups: decades },
    { label: 'Genres', groups: genres },
    { label: 'Charts', groups: charts },
  ].filter((kind) => kind.groups?.length);
  const [kindLabel, setKindLabel] = useState<string | null>(null);
  const kind = kinds.find((k) => k.label === kindLabel) ?? kinds[0];
  const wholePool =
    selected?.source === StartRunDtoSourceEnum.Curated && !selected.id;

  // A player's own music, whichever service it came from. Sub-tabs only when
  // there is more than one kind to tell apart.
  const owned = [
    {
      label: 'Spotify',
      items: playlists,
      source: StartRunDtoSourceEnum.Playlist,
    },
    {
      label: 'Imported',
      items: imported,
      source: StartRunDtoSourceEnum.Curated,
    },
  ].filter((group) => group.items.length > 0);
  const [ownedLabel, setOwnedLabel] = useState<string | null>(null);
  const ownedGroup = owned.find((g) => g.label === ownedLabel) ?? owned[0];

  // An import plays like a set but never ranks; the server decides the same.
  const isImport = imported.some((set) => set.id === selected?.id);
  const isRanked =
    selected?.source === StartRunDtoSourceEnum.Curated && !isImport;
  const canStart = !!selected && !isStarting;

  const start = () => {
    if (!selected) return;
    onStart({
      source: selected.source,
      playlistId:
        selected.source === StartRunDtoSourceEnum.Playlist
          ? selected.id
          : undefined,
      trackGroupId:
        selected.source === StartRunDtoSourceEnum.Curated
          ? selected.id
          : undefined,
      difficulty: selectedDifficulty,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tighter">
          The{' '}
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage: 'linear-gradient(135deg, #fb923c, #ef4444)',
            }}
          >
            Speed Run
          </span>
        </h1>
        <p className="text-fg/50 text-sm sm:text-base">
          One snippet. One chance. How far can you go?
        </p>
        <div className="flex items-center justify-center gap-4">
          {personalBest > 0 && (
            <p className="text-orange-400/80 text-sm font-semibold">
              Your best: {personalBest}
            </p>
          )}
          <Link
            href="/speed-run/leaderboard"
            className="inline-flex items-center gap-1.5 text-amber-400/70 hover:text-amber-400 transition-colors text-xs font-bold uppercase tracking-wider"
          >
            <Trophy className="w-3.5 h-3.5" />
            Leaderboard
          </Link>
        </div>
      </div>

      {/* Difficulty. The same pill control as the tabs below: four lengths
          do not need four cards. */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-widest text-fg/40">
          Snippet duration
        </h2>
        <div className="flex gap-1 p-1 rounded-full bg-fg/5 w-fit">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              onClick={() => setSelectedDifficulty(d.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold tabular-nums transition-colors ${
                selectedDifficulty === d.value
                  ? d.accent
                  : 'text-fg/40 hover:text-fg/70'
              }`}
            >
              {d.duration}
              <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide opacity-60">
                {d.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Where the run draws from. Ranked is the default tab: it is the only
          thing a player without a library can pick, and the only thing that
          ranks, so it must not be the half that stays hidden. */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-fg/40">
          Choose your tracks
        </h2>

        {owned.length > 0 && (
          <div className="flex gap-1 p-1 rounded-full bg-fg/5 w-fit">
            {[
              {
                value: StartRunDtoSourceEnum.Curated,
                label: 'Ranked',
                hint: 'everyone plays the same pool',
              },
              {
                value: StartRunDtoSourceEnum.Playlist,
                label: 'Your playlists',
                hint: 'practice, not ranked',
              },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setTab(t.value);
                  // A selection you cannot see is a selection you cannot check.
                  setSelected(null);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  tab === t.value
                    ? 'bg-fg/10 text-fg'
                    : 'text-fg/40 hover:text-fg/70'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        <p className="text-[10px] font-semibold text-fg/40">
          {tab === StartRunDtoSourceEnum.Curated
            ? 'These runs count for the leaderboard.'
            : "Practice: these runs don't count for the leaderboard."}
        </p>

        {tab === StartRunDtoSourceEnum.Curated ? (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              {/* Scrolls on the narrowest phones rather than pushing the
                  pool button off the screen. */}
              <div className="flex min-w-0 gap-0.5 overflow-x-auto [scrollbar-width:none] sm:gap-1.5">
                {kinds.length > 1 &&
                  kinds.map((k) => (
                    <button
                      key={k.label}
                      onClick={() => {
                        setKindLabel(k.label);
                        // A kind is a step towards picking a set, not the pool.
                        if (wholePool) setSelected(null);
                      }}
                      className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-colors sm:px-2.5 ${
                        kind?.label === k.label && !wholePool
                          ? 'bg-orange-500/15 text-orange-300'
                          : 'text-fg/40 hover:text-fg/70'
                      }`}
                    >
                      {k.label}
                    </button>
                  ))}
              </div>
              {/* Once, beside the kinds: as a tile it repeated in every one. */}
              <button
                onClick={() =>
                  setSelected({ source: StartRunDtoSourceEnum.Curated })
                }
                className={`ml-auto inline-flex shrink-0 items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-colors ${
                  wholePool
                    ? 'border-orange-500/60 bg-orange-500/15 text-orange-300'
                    : 'border-fg/10 text-fg/60 hover:border-fg/25 hover:text-fg'
                }`}
              >
                <Shuffle className="w-3 h-3" />
                Everything
              </button>
            </div>
            <div className={GRID}>
              {kind?.groups?.map((group) => (
                <SourceTile
                  key={group.id}
                  name={group.name}
                  imageUrl={group.imageUrl}
                  isSelected={selected?.id === group.id}
                  onSelect={() =>
                    setSelected({
                      source: StartRunDtoSourceEnum.Curated,
                      id: group.id,
                    })
                  }
                />
              ))}
            </div>
            <AskForASet />
          </div>
        ) : isLoadingPlaylists && !imported.length ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <div className="space-y-2">
            {owned.length > 1 && (
              <div className="flex gap-0.5 sm:gap-1.5">
                {owned.map((g) => (
                  <button
                    key={g.label}
                    onClick={() => setOwnedLabel(g.label)}
                    className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-colors sm:px-2.5 ${
                      ownedGroup?.label === g.label
                        ? 'bg-orange-500/15 text-orange-300'
                        : 'text-fg/40 hover:text-fg/70'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            )}
            <div className={GRID}>
              {ownedGroup?.items.map((item) => (
                <SourceTile
                  key={item.id}
                  name={item.name}
                  imageUrl={item.imageUrl}
                  isSelected={selected?.id === item.id}
                  onSelect={() =>
                    setSelected({ source: ownedGroup.source, id: item.id })
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      <AnimatePresence>
        {startError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-red-400 text-sm text-center"
          >
            {startError}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Start CTA */}
      <motion.button
        onClick={() => {
          if (canStart) start();
        }}
        disabled={!canStart}
        whileHover={canStart ? { scale: 1.02 } : {}}
        whileTap={canStart ? { scale: 0.98 } : {}}
        className={`w-full py-4 rounded-2xl font-black text-lg tracking-tight transition-all ${
          canStart
            ? 'text-white shadow-[0_0_30px_rgba(251,146,60,0.3)] active:scale-95'
            : 'opacity-30 cursor-not-allowed text-fg/50 bg-fg/10'
        }`}
        style={
          canStart
            ? { background: 'linear-gradient(135deg, #f97316, #ef4444)' }
            : {}
        }
      >
        {isStarting ? (
          <span className="flex items-center justify-center gap-2">
            <LoadingSpinner size="sm" />
            Starting…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            {!selected
              ? 'Start Speed Run'
              : isRanked
                ? 'Start ranked run'
                : 'Start practice run'}
          </span>
        )}
      </motion.button>
    </motion.div>
  );
}

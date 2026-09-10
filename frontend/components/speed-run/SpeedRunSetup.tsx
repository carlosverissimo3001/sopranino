'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, ListMusic, Trophy, Zap, Check, ArrowLeft } from 'lucide-react';
import { useMyPlaylists } from '@/hooks/playlists/useMyPlaylists';
import { useMe } from '@/hooks/auth/useMe';
import { useTrackGroups } from '@/hooks/track-groups/useTrackGroups';
import { DIFFICULTIES } from '@/lib/difficulty';
import {
  StartRunDtoDifficultyEnum as GauntletDifficulty,
  StartRunDtoSourceEnum,
  TrackGroupDtoTypeEnum,
} from '@/sdk';
import type { StartRunDto } from '@/sdk';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const GRID =
  'grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[24rem] overflow-y-auto';

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
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<GauntletDifficulty>(GauntletDifficulty.Medium);

  // Only a linked library has playlists to list, and asking without one is a
  // request that can only fail - a 401 for a visitor with no session at all.
  const { data: user } = useMe();
  const { data: playlistsData, isLoading: isLoadingPlaylists } = useMyPlaylists(
    {
      limit: 50,
      enabled: !!user?.hasLinkedAccount,
    },
  );
  const playlists = playlistsData?.items ?? [];
  // One kind per query, since that is what the endpoint takes. A kind with no
  // groups drops out, so genres cost nothing until the pool has any and the
  // picker needs no change when it does — a new kind is one line here.
  const { data: decades } = useTrackGroups(TrackGroupDtoTypeEnum.Decade);
  const { data: genres } = useTrackGroups(TrackGroupDtoTypeEnum.Genre);
  const { data: charts } = useTrackGroups(TrackGroupDtoTypeEnum.Chart);
  const kinds = [
    { label: 'Decades', groups: decades },
    { label: 'Genres', groups: genres },
    { label: 'Charts', groups: charts },
  ].filter((kind) => kind.groups?.length);
  const [kindLabel, setKindLabel] = useState<string | null>(null);
  const kind = kinds.find((k) => k.label === kindLabel) ?? kinds[0];

  const isRanked = selected?.source === StartRunDtoSourceEnum.Curated;
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
      {/* Back Button */}
      <div className="flex items-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-fg/60 hover:text-fg transition-colors text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Flame className="w-6 h-6 fill-orange-500 text-orange-500" />
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
          <Flame className="w-6 h-6 fill-orange-500 text-orange-500" />
        </div>
        <p className="text-fg/50 text-sm sm:text-base">
          One snippet. One chance. How far can you go?
        </p>
        {personalBest > 0 && (
          <p className="text-orange-400/80 text-sm font-semibold">
            Your best: {personalBest} 🔥
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

        {playlists.length > 0 && (
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
            ? 'Everyone plays the same pool - these runs make the leaderboard.'
            : 'Practice runs. Your history keeps them; the leaderboard does not.'}
        </p>

        {isLoadingPlaylists ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : tab === StartRunDtoSourceEnum.Curated ? (
          <div className="space-y-2">
            {kinds.length > 1 && (
              <div className="flex gap-1.5">
                {kinds.map((k) => (
                  <button
                    key={k.label}
                    onClick={() => setKindLabel(k.label)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-colors ${
                      kind?.label === k.label
                        ? 'bg-orange-500/15 text-orange-300'
                        : 'text-fg/40 hover:text-fg/70'
                    }`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            )}
            <div className={GRID}>
              <SourceTile
                name="Everything"
                isSelected={!!selected && !selected.id}
                onSelect={() =>
                  setSelected({ source: StartRunDtoSourceEnum.Curated })
                }
              />
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
          </div>
        ) : (
          <div className={GRID}>
            {playlists.map((playlist) => (
              <SourceTile
                key={playlist.id}
                name={playlist.name}
                imageUrl={playlist.imageUrl}
                isSelected={selected?.id === playlist.id}
                onSelect={() =>
                  setSelected({
                    source: StartRunDtoSourceEnum.Playlist,
                    id: playlist.id,
                  })
                }
              />
            ))}
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
            <Zap className="w-5 h-5 fill-current" />
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

'use client';

import { useState } from 'react';
import { Disc3, Library, ListMusic } from 'lucide-react';
import { useSetTrackSource } from '@/hooks/multiplayer/useSetTrackSource';
import { SetChips } from '@/components/features/track-group/SetChips';
import { trackSourceSummary } from '@/lib/track-source';
import { RoomDtoTrackSourceEnum } from '@/sdk';
import type { RoomDto } from '@/sdk';

interface TrackSourcePickerProps {
  room: RoomDto;
  isHost: boolean;
  /** Whether the viewer has a music library of their own to offer. */
  hasLinkedAccount: boolean;
}

const OPTIONS = [
  {
    value: RoomDtoTrackSourceEnum.Pool,
    label: 'Anything',
    detail: 'Songs everyone has a fair shot at',
    Icon: Disc3,
  },
  {
    value: RoomDtoTrackSourceEnum.Set,
    label: 'A set',
    detail: 'One artist, decade or genre',
    Icon: ListMusic,
  },
  {
    value: RoomDtoTrackSourceEnum.Libraries,
    label: 'Our libraries',
    detail: 'Pooled from the players with Spotify linked',
    Icon: Library,
  },
] as const;

/**
 * The host picks where the songs come from. It is a choice rather than
 * something inferred from who is in the room, so a late join cannot silently
 * change the game everyone agreed to play.
 */
export function TrackSourcePicker({
  room,
  isHost,
  hasLinkedAccount,
}: TrackSourcePickerProps) {
  const setTrackSource = useSetTrackSource();
  // "A set" alone is not a source yet: it opens the sets, and a pick saves it.
  const [choosingSet, setChoosingSet] = useState(false);

  /**
   * The value being written counts as selected before the server agrees.
   * Reading it off the room instead lights up the option being replaced, so a
   * click puts the spinner on the wrong button and the selection jumps.
   */
  const inFlight = setTrackSource.isPending
    ? setTrackSource.variables.trackSource
    : undefined;
  const selected =
    inFlight ?? (choosingSet ? RoomDtoTrackSourceEnum.Set : room.trackSource);
  const selectedSetId = setTrackSource.isPending
    ? setTrackSource.variables.trackGroupId
    : room.trackGroupId;

  // Everyone sees what they are about to play; only the host can change it.
  if (!isHost) {
    const { label, Icon } = trackSourceSummary(room.trackSource, {
      setName: room.trackGroupName,
    });
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-fg/10 bg-fg/[0.03] px-4 py-3">
        <Icon className="h-4 w-4 text-fg/40" />
        <span className="text-sm text-fg/60">
          Songs: <span className="text-fg/80">{label}</span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-fg/40">
        Songs from
      </p>

      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map(({ value, label, detail, Icon }) => {
          const active = selected === value;
          // Nobody in the room would have a library to pool from.
          const unavailable =
            value === RoomDtoTrackSourceEnum.Libraries && !hasLinkedAccount;

          return (
            <button
              key={value}
              type="button"
              disabled={unavailable || setTrackSource.isPending}
              onClick={() => {
                if (value === RoomDtoTrackSourceEnum.Set) {
                  setChoosingSet(true);
                  return;
                }
                setChoosingSet(false);
                setTrackSource.mutate({ roomId: room.id, trackSource: value });
              }}
              className={`flex flex-col gap-1 rounded-xl border px-3 py-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                active
                  ? 'border-green-500/30 bg-green-500/10'
                  : 'border-fg/10 bg-fg/[0.03] hover:bg-fg/[0.06]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon
                  className={`h-4 w-4 ${active ? 'text-green-400' : 'text-fg/40'}`}
                />
                <span
                  className={`text-sm font-semibold ${
                    active ? 'text-green-400' : 'text-fg/70'
                  }`}
                >
                  {label}
                </span>
              </span>
              <span className="hidden text-[11px] leading-snug text-fg/40 sm:block">
                {unavailable ? 'Link Spotify to use this' : detail}
              </span>
            </button>
          );
        })}
      </div>

      {selected === RoomDtoTrackSourceEnum.Set && (
        <div className="rounded-xl border border-fg/10 bg-fg/[0.02] p-3">
          <SetChips
            includeSpecial
            selectedId={selectedSetId}
            disabled={setTrackSource.isPending}
            onPick={(set) => {
              setChoosingSet(false);
              setTrackSource.mutate({
                roomId: room.id,
                trackSource: RoomDtoTrackSourceEnum.Set,
                trackGroupId: set.id,
              });
            }}
          />
        </div>
      )}

      {setTrackSource.isError && (
        <p className="text-xs text-red-400">{setTrackSource.error.message}</p>
      )}
    </div>
  );
}

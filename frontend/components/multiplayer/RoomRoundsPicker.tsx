'use client';

import { Music } from 'lucide-react';
import { useUpdateRoomSettings } from '@/hooks/multiplayer/useUpdateRoomSettings';
import type { RoomDto } from '@/sdk';

interface RoomRoundsPickerProps {
  room: RoomDto;
  isHost: boolean;
}

const OPTIONS = [
  { value: 3, label: '3', detail: 'Quick' },
  { value: 5, label: '5', detail: 'Classic' },
  { value: 10, label: '10', detail: 'Marathon' },
] as const;

/** Chosen at creation, but changeable while the room is still filling up. */
export function RoomRoundsPicker({ room, isHost }: RoomRoundsPickerProps) {
  const updateSettings = useUpdateRoomSettings();

  /**
   * The value being written counts as selected before the server agrees.
   * Reading it off the room instead lights up the option being replaced, so a
   * click puts the spinner on the wrong button and the selection jumps.
   */
  const inFlight = updateSettings.isPending
    ? updateSettings.variables.settings.roundCount
    : undefined;
  const selected = inFlight ?? room.roundCount;

  if (!isHost) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-fg/10 bg-fg/[0.03] px-4 py-3">
        <Music className="h-4 w-4 text-fg/40" />
        <span className="text-sm text-fg/60">
          Rounds: <span className="text-fg/80">{selected}</span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-fg/40">
        Rounds
      </p>

      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map(({ value, label, detail }) => {
          const active = selected === value;

          return (
            <button
              key={value}
              type="button"
              disabled={updateSettings.isPending}
              onClick={() =>
                updateSettings.mutate({
                  roomId: room.id,
                  settings: { roundCount: value },
                })
              }
              className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                active
                  ? 'border-green-500/30 bg-green-500/10'
                  : 'border-fg/10 bg-fg/[0.03] hover:bg-fg/[0.06]'
              }`}
            >
              <span
                className={`font-mono text-lg font-black ${
                  active ? 'text-green-400' : 'text-fg/70'
                }`}
              >
                {label}
              </span>
              <span className="text-[11px] text-fg/40">{detail}</span>
            </button>
          );
        })}
      </div>

      {updateSettings.isError && (
        <p className="text-xs text-red-400">{updateSettings.error.message}</p>
      )}
    </div>
  );
}

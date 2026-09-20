'use client';

import { Users } from 'lucide-react';
import { useUpdateRoomSettings } from '@/hooks/multiplayer/useUpdateRoomSettings';
import {
  UpdateRoomSettingsControllerDtoMaxPlayersEnum as Seats,
  type RoomDto,
} from '@/sdk';

interface RoomSizePickerProps {
  room: RoomDto;
  isHost: boolean;
}

const OPTIONS = [
  { value: Seats.NUMBER_5, label: '5', detail: 'Friends' },
  { value: Seats.NUMBER_10, label: '10', detail: 'A group' },
  { value: Seats.NUMBER_20, label: '20', detail: 'A crowd' },
  { value: Seats.NUMBER_50, label: '50', detail: 'A chat' },
] as const;

/** Chosen at creation, but changeable while the room is still filling up. */
export function RoomSizePicker({ room, isHost }: RoomSizePickerProps) {
  const updateSettings = useUpdateRoomSettings();

  // The value being written counts as selected before the server agrees, as
  // in the rounds picker: reading the room lights up the one being replaced.
  const inFlight = updateSettings.isPending
    ? updateSettings.variables.settings.maxPlayers
    : undefined;
  const selected = inFlight ?? room.capacity;

  if (!isHost) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-fg/10 bg-fg/[0.03] px-4 py-3">
        <Users className="h-4 w-4 text-fg/40" />
        <span className="text-sm text-fg/60">
          Seats: <span className="text-fg/80">{selected}</span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-fg/40">
        Seats
      </p>

      <div className="grid grid-cols-4 gap-2">
        {OPTIONS.map(({ value, label, detail }) => {
          const active = selected === value;
          // A room cannot be made smaller than the people already in it.
          const tooSmall = value < room.players.length;

          return (
            <button
              key={value}
              type="button"
              disabled={updateSettings.isPending || tooSmall}
              title={tooSmall ? 'More players than that are here' : undefined}
              onClick={() =>
                updateSettings.mutate({
                  roomId: room.id,
                  settings: { maxPlayers: value },
                })
              }
              className={`flex flex-col items-center justify-center rounded-xl border px-2 py-3 transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
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

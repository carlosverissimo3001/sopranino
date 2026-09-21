'use client';

import { MessageCircle, MessageCircleOff } from 'lucide-react';
import { useUpdateRoomSettings } from '@/hooks/multiplayer/useUpdateRoomSettings';
import type { RoomDto } from '@/sdk';

interface RoomChatPickerProps {
  room: RoomDto;
  isHost: boolean;
}

const OPTIONS = [
  {
    value: true,
    label: 'On',
    detail: 'Everyone in the room can talk',
    Icon: MessageCircle,
  },
  {
    value: false,
    label: 'Off',
    detail: 'No chat, for anyone',
    Icon: MessageCircleOff,
  },
] as const;

/** The host's to change at any point; the dock has the same switch mid-game. */
export function RoomChatPicker({ room, isHost }: RoomChatPickerProps) {
  const updateSettings = useUpdateRoomSettings();

  // The value being written counts as selected before the server agrees.
  const inFlight = updateSettings.isPending
    ? updateSettings.variables.settings.chatEnabled
    : undefined;
  const selected = inFlight ?? room.chatEnabled;
  const chosen = OPTIONS.find((option) => option.value === selected);

  if (!isHost) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-fg/10 bg-fg/[0.03] px-4 py-3">
        {chosen ? <chosen.Icon className="h-4 w-4 text-fg/40" /> : null}
        <span className="text-sm text-fg/60">
          Chat: <span className="text-fg/80">{chosen?.label}</span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-fg/40">
        Chat
      </p>

      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map(({ value, label, detail, Icon }) => {
          const active = selected === value;

          return (
            <button
              key={String(value)}
              type="button"
              disabled={updateSettings.isPending}
              onClick={() =>
                updateSettings.mutate({
                  roomId: room.id,
                  settings: { chatEnabled: value },
                })
              }
              className={`flex flex-col gap-1 rounded-xl border px-4 py-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
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
              <span className="text-[11px] leading-snug text-fg/40">
                {detail}
              </span>
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

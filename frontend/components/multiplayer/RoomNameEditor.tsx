'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Pencil, X } from 'lucide-react';
import { useUpdateRoomSettings } from '@/hooks/multiplayer/useUpdateRoomSettings';
import type { RoomDto } from '@/sdk';

interface RoomNameEditorProps {
  room: RoomDto;
  isHost: boolean;
}

/** Matches the cap the server enforces, so the limit is felt before it fails. */
const NAME_MAX_LENGTH = 40;

export function RoomNameEditor({ room, isHost }: RoomNameEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(room.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateSettings = useUpdateRoomSettings();

  useEffect(() => {
    if (isEditing) inputRef.current?.select();
  }, [isEditing]);

  // Someone else's rename should land even while this sits open on a stale one.
  useEffect(() => {
    if (!isEditing) setDraft(room.name);
  }, [room.name, isEditing]);

  if (!isHost) {
    return (
      <p className="mb-4 text-2xl sm:text-3xl font-black tracking-tight text-fg">
        {room.name}
      </p>
    );
  }

  const commit = () => {
    const name = draft.trim();
    if (!name || name === room.name) {
      setDraft(room.name);
      setIsEditing(false);
      return;
    }

    updateSettings.mutate(
      { roomId: room.id, settings: { name } },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  const cancel = () => {
    setDraft(room.name);
    setIsEditing(false);
    updateSettings.reset();
  };

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="group mb-4 inline-flex items-center gap-2 text-2xl sm:text-3xl font-black tracking-tight text-fg hover:text-spotify-green transition-colors"
      >
        {room.name}
        <Pencil
          className="h-4 w-4 text-fg/20 group-hover:text-spotify-green transition-colors"
          aria-hidden="true"
        />
        <span className="sr-only">Rename this room</span>
      </button>
    );
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-center gap-2">
        <label htmlFor="room-name-input" className="sr-only">
          Room name
        </label>
        <input
          id="room-name-input"
          ref={inputRef}
          type="text"
          value={draft}
          maxLength={NAME_MAX_LENGTH}
          disabled={updateSettings.isPending}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') cancel();
          }}
          autoFocus
          className="w-full max-w-xs rounded-xl border border-fg/10 bg-fg/5 px-3 py-2 text-center text-2xl font-black tracking-tight text-fg focus:border-spotify-green/50 focus:outline-none transition-colors"
        />

        <button
          type="button"
          onClick={commit}
          disabled={updateSettings.isPending}
          aria-label="Save name"
          className="rounded-lg p-1.5 text-spotify-green hover:bg-fg/5 disabled:opacity-40 transition-colors"
        >
          {updateSettings.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </button>

        <button
          type="button"
          onClick={cancel}
          aria-label="Cancel"
          className="rounded-lg p-1.5 text-fg/30 hover:bg-fg/5 hover:text-fg/60 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {updateSettings.isError && (
        <p className="mt-2 text-xs text-red-400">
          {updateSettings.error.message}
        </p>
      )}
    </div>
  );
}

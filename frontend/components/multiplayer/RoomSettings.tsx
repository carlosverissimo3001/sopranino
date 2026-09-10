'use client';

import { useState } from 'react';
import { ChevronDown, Disc3, Globe, Library, Lock, Music } from 'lucide-react';
import { RoomDtoTrackSourceEnum, type RoomDto } from '@/sdk';
import { TrackSourcePicker } from './TrackSourcePicker';
import { RoomRoundsPicker } from './RoomRoundsPicker';
import { RoomVisibilityPicker } from './RoomVisibilityPicker';

interface RoomSettingsProps {
  room: RoomDto;
  isHost: boolean;
  hasLinkedAccount: boolean;
}

/**
 * Three pickers is a wall between the host and the start button, for choices
 * made once and then left alone. Collapsed to what they add up to, and opened
 * when somebody actually wants to change one.
 */
export function RoomSettings({
  room,
  isHost,
  hasLinkedAccount,
}: RoomSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isPool = room.trackSource === RoomDtoTrackSourceEnum.Pool;
  const SourceIcon = isPool ? Disc3 : Library;
  const FindableIcon = room.findable ? Globe : Lock;

  const summary = (
    <>
      <span className="flex items-center gap-1.5">
        <SourceIcon className="h-3.5 w-3.5" />
        {isPool ? 'Anything' : 'Our libraries'}
      </span>
      <span aria-hidden="true" className="text-fg/15">
        &middot;
      </span>
      <span className="flex items-center gap-1.5">
        <Music className="h-3.5 w-3.5" />
        {room.roundCount} rounds
      </span>
      <span aria-hidden="true" className="text-fg/15">
        &middot;
      </span>
      <span className="flex items-center gap-1.5">
        <FindableIcon className="h-3.5 w-3.5" />
        {room.findable ? 'Anyone' : 'Invite only'}
      </span>
    </>
  );

  // Nothing to open for a player who cannot change any of it.
  if (!isHost) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-xl border border-fg/10 bg-fg/[0.03] px-4 py-3 text-xs text-fg/50">
        {summary}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-fg/10 bg-fg/[0.03]">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-3 text-xs text-fg/50 hover:text-fg/75 transition-colors"
      >
        {summary}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="flex flex-col gap-4 border-t border-fg/[0.06] p-4">
          <TrackSourcePicker
            room={room}
            isHost={isHost}
            hasLinkedAccount={hasLinkedAccount}
          />
          <RoomRoundsPicker room={room} isHost={isHost} />
          <RoomVisibilityPicker room={room} isHost={isHost} />
        </div>
      )}
    </div>
  );
}

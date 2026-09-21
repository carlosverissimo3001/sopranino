'use client';

import { useState } from 'react';
import {
  ChevronDown,
  Globe,
  Lock,
  MessageCircleOff,
  Music,
  Users,
} from 'lucide-react';
import type { RoomDto } from '@/sdk';
import { trackSourceSummary } from '@/lib/track-source';
import { TrackSourcePicker } from './TrackSourcePicker';
import { SettingPicker } from './SettingPicker';

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

  const { label: sourceLabel, Icon: SourceIcon } = trackSourceSummary(
    room.trackSource,
    { setName: room.trackGroupName },
  );
  const FindableIcon = room.findable ? Globe : Lock;

  const summary = (
    <>
      <span className="flex items-center gap-1.5">
        <SourceIcon className="h-3.5 w-3.5" />
        {sourceLabel}
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
      <span aria-hidden="true" className="text-fg/15">
        &middot;
      </span>
      <span className="flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5" />
        {room.capacity} seats
      </span>
      {/* Said only when off: a chat is what a room has by default. */}
      {room.chatEnabled === false && (
        <>
          <span aria-hidden="true" className="text-fg/15">
            &middot;
          </span>
          <span className="flex items-center gap-1.5">
            <MessageCircleOff className="h-3.5 w-3.5" />
            Chat off
          </span>
        </>
      )}
    </>
  );

  // Nothing to open for a player who cannot change any of it.
  if (!isHost) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 rounded-xl tabular-nums border border-fg/10 bg-fg/[0.03] px-4 py-3 text-xs text-fg/50">
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
        className="flex w-full items-center gap-2 px-4 py-3 text-xs text-fg/50 hover:text-fg/75 transition-colors"
      >
        {/* Its own wrapping area, so the chevron never lands on a line alone. */}
        <span className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-x-1 gap-y-1 tabular-nums">
          {summary}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="flex flex-col gap-4 border-t border-fg/[0.06] p-4">
          <TrackSourcePicker
            room={room}
            isHost={isHost}
            hasLinkedAccount={hasLinkedAccount}
          />
          <SettingPicker
            room={room}
            label="Rounds"
            setting="roundCount"
            current={room.roundCount as 3 | 5 | 10}
            options={[
              { value: 3, label: '3', hint: 'Quick' },
              { value: 5, label: '5', hint: 'Classic' },
              { value: 10, label: '10', hint: 'Marathon' },
            ]}
          />
          <SettingPicker
            room={room}
            label="Seats"
            setting="maxPlayers"
            current={room.capacity as 5 | 10 | 20 | 50}
            options={([5, 10, 20, 50] as const).map((value) => ({
              value,
              label: String(value),
              // Never smaller than the people already in it.
              unavailable:
                value < room.players.length
                  ? 'More players than that are here'
                  : undefined,
            }))}
          />
          <SettingPicker
            room={room}
            label="Who can join"
            setting="findable"
            current={room.findable}
            options={[
              {
                value: true,
                label: 'Anyone',
                hint: 'Listed for people looking for a game',
              },
              {
                value: false,
                label: 'Invite only',
                hint: 'Only people you send the code to',
              },
            ]}
          />
          <SettingPicker
            room={room}
            label="Chat"
            setting="chatEnabled"
            current={room.chatEnabled ?? true}
            options={[
              {
                value: true,
                label: 'On',
                hint: 'Everyone in the room can talk',
              },
              { value: false, label: 'Off', hint: 'No chat, for anyone' },
            ]}
          />
        </div>
      )}
    </div>
  );
}

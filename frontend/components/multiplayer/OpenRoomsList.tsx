'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Disc3, Library, Loader2, Plus } from 'lucide-react';
import { OpenRoomDtoTrackSourceEnum, type OpenRoomDto } from '@/sdk';

interface OpenRoomsListProps {
  rooms: OpenRoomDto[] | undefined;
  isLive: boolean;
  joiningId: string | undefined;
  onJoin: (roomId: string) => void;
  onCreate: () => void;
  isCreating: boolean;
}

function RoomCard({
  room,
  isJoining,
  disabled,
  onJoin,
}: {
  room: OpenRoomDto;
  isJoining: boolean;
  disabled: boolean;
  onJoin: () => void;
}) {
  const isPool = room.trackSource === OpenRoomDtoTrackSourceEnum.Pool;
  const SourceIcon = isPool ? Disc3 : Library;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.18 }}
    >
      <button
        type="button"
        onClick={onJoin}
        disabled={disabled}
        className="group h-full w-full rounded-3xl border border-white/5 bg-white/5 p-5 text-left hover:border-spotify-green/30 hover:bg-white/[0.07] active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none transition-[background-color,border-color,transform,opacity]"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 truncate text-lg font-black tracking-tight text-fg">
            {room.name}
          </p>
          {isJoining ? (
            <Loader2 className="w-5 h-5 shrink-0 animate-spin text-spotify-green" />
          ) : (
            <ArrowRight
              className="w-5 h-5 shrink-0 text-fg/15 group-hover:text-spotify-green group-hover:translate-x-0.5 transition-[color,transform]"
              aria-hidden="true"
            />
          )}
        </div>

        <p className="mt-4 font-mono text-2xl font-black tabular-nums text-fg/80">
          {room.playerCount}
          <span className="text-base text-fg/25">/{room.capacity}</span>
        </p>

        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-fg/40">
          <span>{room.roundCount} rounds</span>
          <span aria-hidden="true">&middot;</span>
          <SourceIcon className="w-3 h-3" aria-hidden="true" />
          <span>{isPool ? 'Anything' : 'Their libraries'}</span>
        </div>
      </button>
    </motion.li>
  );
}

/**
 * Most of the time nobody is waiting, so the empty state is the one that had
 * to be designed. It says the room list is working and empty, not broken.
 */
export function OpenRoomsList({
  rooms,
  isLive,
  joiningId,
  onJoin,
  onCreate,
  isCreating,
}: OpenRoomsListProps) {
  return (
    <section aria-label="Rooms waiting for people">
      {isLive && (
        <p className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-fg/30">
          <span
            className="w-1.5 h-1.5 rounded-full bg-spotify-green"
            aria-hidden="true"
          />
          Updating live
        </p>
      )}

      {rooms === undefined ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-fg/20" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 px-6 py-14 text-center">
          <p className="text-base text-fg/40">Nobody is waiting right now.</p>
          <p className="mt-2 text-sm text-fg/25">
            Start one and it will show up here.
          </p>
          <button
            type="button"
            onClick={onCreate}
            disabled={isCreating}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-spotify-green px-6 py-3 text-sm font-black text-black hover:bg-spotify-green/90 active:scale-[0.98] disabled:opacity-50 transition-[background-color,transform,opacity]"
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Create a room
          </button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                isJoining={joiningId === room.id}
                disabled={joiningId !== undefined}
                onJoin={() => onJoin(room.id)}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}

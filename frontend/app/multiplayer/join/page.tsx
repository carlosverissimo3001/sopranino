'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useMe } from '@/hooks/auth/useMe';
import { useEnsureSession } from '@/hooks/auth/useEnsureSession';
import { useLobby } from '@/hooks/multiplayer/useLobby';
import { useJoinOpenRoom } from '@/hooks/multiplayer/useJoinOpenRoom';
import { useCreateAndEnterRoom } from '@/hooks/multiplayer/useCreateAndEnterRoom';
import { OpenRoomsList } from '@/components/multiplayer/OpenRoomsList';

export default function BrowseRoomsPage() {
  const router = useRouter();
  const { data: user } = useMe();
  const ensureSession = useEnsureSession();
  const { rooms, isLive } = useLobby();
  const joinOpenRoom = useJoinOpenRoom();
  const createRoom = useCreateAndEnterRoom();

  /**
   * The list is pushed, but a room can still fill between reading it and
   * tapping it. The failure says so and leaves the list in place, which the
   * server has already corrected by the time the message lands.
   */
  const handleJoin = useCallback(
    async (roomId: string) => {
      if (joinOpenRoom.isPending) return;

      // The deliberate click that mints an identity for a visitor who has
      // none. Browsing must never create a user.
      if (!user) await ensureSession.mutateAsync();

      joinOpenRoom.mutate(roomId, {
        onSuccess: (data) => router.push(`/multiplayer/${data.id}`),
      });
    },
    [joinOpenRoom, user, ensureSession, router],
  );

  return (
    <main className="min-h-screen text-fg">
      <div className="absolute inset-0 -z-10 dark:bg-gradient-to-br dark:from-spotify-black dark:via-[#0d1117] dark:to-[#161b22]" />

      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          href="/"
          className="group inline-flex items-center gap-1.5 text-sm font-bold text-fg/40 hover:text-fg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </Link>

        <h1 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">
          Rooms waiting for people
        </h1>
        <p className="mt-2 max-w-prose text-sm text-fg/50">
          Pick one and you are in. Everything here is open to anyone, and the
          list updates itself as rooms fill and empty.
        </p>

        {(joinOpenRoom.isError || createRoom.error) && (
          <p
            role="alert"
            className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-bold text-red-400"
          >
            {joinOpenRoom.error?.message ?? createRoom.error?.message}
          </p>
        )}

        <div className="mt-8">
          <OpenRoomsList
            rooms={rooms}
            isLive={isLive}
            joiningId={
              joinOpenRoom.isPending ? joinOpenRoom.variables : undefined
            }
            onJoin={handleJoin}
            onCreate={createRoom.create}
            isCreating={createRoom.isPending}
          />
        </div>
      </div>
    </main>
  );
}

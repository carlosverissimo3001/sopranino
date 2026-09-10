'use client';

import { HostDisconnectedBanner } from '@/components/multiplayer/HostDisconnectedBanner';
import PlayerRow from '@/components/multiplayer/PlayerRow';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useMe } from '@/hooks/auth/useMe';
import { useLeaveRoom } from '@/hooks/multiplayer/useLeaveRoom';
import { useMultiplayerSocket } from '@/hooks/multiplayer/useMultiplayerSocket';
import { useRoom } from '@/hooks/multiplayer/useRoom';
import { useStartRoom } from '@/hooks/multiplayer/useStartRoom';
import { useToggleReady } from '@/hooks/multiplayer/useToggleReady';
import { useKickPlayer } from '@/hooks/multiplayer/useKickPlayer';
import { TrackSourcePicker } from '@/components/multiplayer/TrackSourcePicker';
import { RoomVisibilityPicker } from '@/components/multiplayer/RoomVisibilityPicker';
import { RoomNameEditor } from '@/components/multiplayer/RoomNameEditor';
import { RoomRoundsPicker } from '@/components/multiplayer/RoomRoundsPicker';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  LogOut,
  Music,
  Play,
  Users,
  Wifi,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function RoomLobbyPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;
  const router = useRouter();
  const { data: user } = useMe();
  const { connected, onlineUserIds, hostDisconnected, removed } =
    useMultiplayerSocket(roomId, undefined, user?.userId);
  const { data: room, isLoading, isError, error } = useRoom(roomId, connected);
  const startRoom = useStartRoom();
  const leaveRoom = useLeaveRoom();
  const toggleReady = useToggleReady();
  const kickPlayer = useKickPlayer();
  const [copied, setCopied] = useState(false);
  const knownPlayerIdsRef = useRef<Set<string> | null>(null);

  // Removed by the host: there is no room to show any more.
  useEffect(() => {
    if (!removed) return;
    toast.error('The host removed you from the room');
    router.replace('/');
  }, [removed, router]);

  // Toast when a new player joins via polling
  useEffect(() => {
    if (!room || !user) return;

    const currentIds = new Set(room.players.map((p) => p.id));

    if (knownPlayerIdsRef.current === null) {
      // First load — seed without toasting
      knownPlayerIdsRef.current = currentIds;
      return;
    }

    for (const player of room.players) {
      if (!knownPlayerIdsRef.current.has(player.id)) {
        // Skip toasting ourselves
        if (player.userId !== user.userId) {
          toast(`${player.displayName} joined!`, {
            icon: '👋',
            duration: 3000,
          });
        }
      }
    }

    knownPlayerIdsRef.current = currentIds;
  }, [room, user]);

  // Find current user's player entry to determine host status
  const currentPlayer = useMemo(() => {
    if (!room || !user) return null;
    return room.players.find((p) => p.userId === user.userId) ?? null;
  }, [room, user]);

  const isHost = currentPlayer ? currentPlayer.userId === room?.hostId : false;
  const allReady = room?.players.every((p) => p.isReady) ?? false;
  const canStart = isHost && (room?.players.length ?? 0) >= 2 && allReady;
  const isStarting = room?.status === 'PLAYING';

  const inviteUrl =
    typeof window !== 'undefined' && room
      ? `${window.location.origin}/multiplayer/join/${room.inviteCode}`
      : '';

  // Redirect to game when status changes to PLAYING
  useEffect(() => {
    if (isStarting) {
      const redirectTimer = window.setTimeout(() => {
        router.replace(`/multiplayer/${roomId}/play`);
      }, 1000);

      return () => window.clearTimeout(redirectTimer);
    }
  }, [isStarting, roomId, router]);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success('Invite link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }

  function handleToggleReady() {
    if (!roomId || toggleReady.isPending) return;
    toggleReady.mutate(roomId);
  }

  function handleStartGame() {
    if (!roomId || startRoom.isPending) return;
    startRoom.mutate(roomId);
  }

  function handleLeaveRoom() {
    if (!roomId || leaveRoom.isPending) return;
    leaveRoom.mutate(roomId, {
      onSuccess: () => router.replace('/'),
    });
  }

  // Loading state
  if (isLoading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 text-fg">
        <LoadingSpinner size="md" />
        <p className="text-fg/50 text-sm">Loading room...</p>
      </main>
    );
  }

  // Error / expired / completed
  if (isError || !room || room.status === 'EXPIRED') {
    return (
      <main className="min-h-screen flex items-center justify-center text-fg p-4">
        <div className="absolute inset-0 bg-gradient-to-br dark:from-spotify-black dark:via-[#0d1117] dark:to-[#161b22]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-sm rounded-2xl border border-fg/10 bg-fg/5 p-8 shadow-xl backdrop-blur-xl text-center"
        >
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-fg mb-2">
            {room?.status === 'EXPIRED'
              ? 'Room Expired'
              : isError
                ? 'Room Unavailable'
                : 'Room Not Found'}
          </h2>
          <p className="text-fg/50 text-sm mb-6">
            {isError
              ? (error?.message ?? 'Could not load this room.')
              : 'This room is no longer available.'}
          </p>
          {isError && (
            <p className="text-fg/40 text-xs mb-6">
              Rooms are invite only. Ask for the code to join.
            </p>
          )}
          <button
            onClick={() => router.replace('/')}
            className="flex items-center gap-2 mx-auto text-spotify-green hover:underline text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>
        </motion.div>
      </main>
    );
  }

  // Completed state
  if (room.status === 'COMPLETED') {
    return (
      <main className="min-h-screen flex items-center justify-center text-fg p-4">
        <div className="absolute inset-0 bg-gradient-to-br dark:from-spotify-black dark:via-[#0d1117] dark:to-[#161b22]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-sm rounded-2xl border border-fg/10 bg-fg/5 p-8 shadow-xl backdrop-blur-xl text-center"
        >
          <div className="w-12 h-12 rounded-full bg-spotify-green/10 border border-spotify-green/20 flex items-center justify-center mx-auto mb-4">
            <Music className="w-6 h-6 text-spotify-green" />
          </div>
          <h2 className="text-lg font-bold text-fg mb-2">Game Complete</h2>
          <p className="text-fg/50 text-sm mb-6">
            This room has finished playing.
          </p>
          <button
            onClick={() => router.replace('/')}
            className="flex items-center gap-2 mx-auto text-spotify-green hover:underline text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col text-fg relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br dark:from-spotify-black dark:via-[#0d1117] dark:to-[#161b22]" />
        <div className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-500/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-[150px] left-1/4 w-[400px] h-[400px] bg-spotify-green/5 rounded-full blur-[100px] pointer-events-none" />
      </div>

      {/* Header bar */}
      <div className="sticky top-0 z-20 border-b border-fg/5 bg-bg/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={handleLeaveRoom}
            disabled={leaveRoom.isPending}
            className="flex items-center gap-2 text-sm text-fg/60 hover:text-fg transition-colors"
          >
            {leaveRoom.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            Leave
          </button>

          <div className="flex items-center gap-2 text-xs text-fg/40">
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Wifi className="w-3.5 h-3.5 text-spotify-green" />
            </motion.div>
            {isStarting ? 'Game starting...' : 'Waiting for players'}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md flex flex-col gap-8">
          {/* Invite code card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl border border-fg/10 bg-fg/[0.03] p-6 sm:p-8 text-center"
          >
            {/* Card glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-spotify-green/10 rounded-full blur-[60px] pointer-events-none" />

            <RoomNameEditor room={room} isHost={isHost} />

            <p className="text-[10px] uppercase tracking-[0.2em] text-fg/30 font-semibold mb-1.5">
              Invite Code
            </p>
            <p className="text-2xl sm:text-3xl font-mono font-black text-spotify-green tracking-[0.2em] mb-5 select-all">
              {room.inviteCode}
            </p>

            <div className="flex items-center justify-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopyLink}
                className="flex items-center gap-2 rounded-xl border border-fg/10 bg-fg/5 px-4 py-2.5 text-sm text-fg/80 hover:bg-fg/10 transition-colors"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-spotify-green" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? 'Copied!' : 'Copy Link'}
              </motion.button>
            </div>
          </motion.div>

          {/* Host disconnected warning */}
          <AnimatePresence>
            {hostDisconnected && !isHost && <HostDisconnectedBanner />}
          </AnimatePresence>

          {/* Players list */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-fg/70 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Players
              </h3>
              <span className="text-xs font-mono text-fg/30">
                {room.players.length}
              </span>
            </div>

            <div className="rounded-2xl border border-fg/10 bg-fg/[0.03] overflow-hidden divide-y divide-fg/5">
              <AnimatePresence mode="popLayout">
                {room.players.map((player, index) => (
                  <PlayerRow
                    key={player.id}
                    player={player}
                    isHost={player.userId === room.hostId}
                    isCurrentUser={player.userId === user?.userId}
                    index={index}
                    isReady={player.isReady}
                    isOnline={onlineUserIds.includes(player.userId)}
                    onKick={
                      isHost && player.userId !== room.hostId
                        ? () =>
                            kickPlayer.mutate({
                              roomId: room.id,
                              userId: player.userId,
                            })
                        : undefined
                    }
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-3"
          >
            <TrackSourcePicker
              room={room}
              isHost={isHost}
              hasLinkedAccount={!!user?.hasLinkedAccount}
            />

            <RoomRoundsPicker room={room} isHost={isHost} />

            <RoomVisibilityPicker room={room} isHost={isHost} />

            {/* Side by side: two full-width buttons stacked pushed the room
                itself below the fold on a phone. */}
            <div className="flex items-stretch gap-3">
              <button
                onClick={handleToggleReady}
                disabled={toggleReady.isPending}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold transition-all ${
                  currentPlayer?.isReady
                    ? 'bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20'
                    : 'bg-fg/5 border border-fg/10 text-fg/70 hover:bg-fg/10'
                }`}
              >
                {toggleReady.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : currentPlayer?.isReady ? (
                  <Check className="w-4 h-4" />
                ) : null}
                {currentPlayer?.isReady ? 'Ready' : 'Mark as Ready'}
              </button>

              {isHost && (
                <button
                  onClick={handleStartGame}
                  disabled={!canStart || startRoom.isPending || isStarting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-spotify-green px-4 py-3.5 text-sm font-bold text-black hover:bg-spotify-green/90 active:scale-[0.98] disabled:opacity-40 transition-all shadow-[0_0_30px_rgba(30,215,96,0.15)]"
                >
                  {startRoom.isPending || isStarting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" fill="currentColor" />
                      Start Game
                    </>
                  )}
                </button>
              )}
            </div>

            {isHost && (
              <>
                {!canStart && (
                  <p className="text-xs text-fg/30 text-center">
                    {(room?.players.length ?? 0) < 2
                      ? 'Need at least 2 players to start'
                      : 'All players must be ready'}
                  </p>
                )}
                {startRoom.isError && (
                  <p className="text-sm text-red-400 text-center">
                    {startRoom.error.message}
                  </p>
                )}
                {kickPlayer.isError && (
                  <p className="text-sm text-red-400 text-center">
                    {kickPlayer.error.message}
                  </p>
                )}
              </>
            )}

            {!isHost && (
              <div className="text-center py-2">
                <motion.p
                  animate={{ opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-sm text-fg/40"
                >
                  Waiting for host to start the game...
                </motion.p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isStarting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl border border-spotify-green/20 bg-fg/[0.04] px-8 py-7 text-center"
            >
              <motion.div
                className="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-spotify-green/50 border-t-spotify-green"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
              />
              <motion.h2
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
                className="text-xl font-bold text-fg"
              >
                Game Starting!
              </motion.h2>
              <p className="mt-2 text-sm text-fg/60">Loading round...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { queryKeys } from '@/lib/queryKeys';
import type { RoomDto, ScoreboardDto, ScoreboardPlayerTotalDto } from '@/sdk';

/**
 * Presence is a heartbeat window on the server, so a member who stops sending
 * these lapses out of the room. Must stay well under the server's stale window.
 */
const HEARTBEAT_MS = 15_000;

interface UseMultiplayerSocketOptions {
  onPlayerRoundComplete?: (data: {
    userId: string;
    displayName: string;
    roundIndex: number;
    isFirstSolve: boolean;
  }) => void;
}

export function useMultiplayerSocket(
  roomId: string | undefined,
  options?: UseMultiplayerSocketOptions,
  currentUserId?: string,
) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [hostDisconnected, setHostDisconnected] = useState(false);
  /** Set when the host removes you, so the page can stop showing the room. */
  const [removed, setRemoved] = useState(false);

  const onPlayerRoundCompleteRef = useRef(options?.onPlayerRoundComplete);
  useEffect(() => {
    onPlayerRoundCompleteRef.current = options?.onPlayerRoundComplete;
  });

  const roomIdRef = useRef(roomId);
  useEffect(() => {
    roomIdRef.current = roomId;
  });

  useEffect(() => {
    if (!roomId) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const apiPort = new URL(apiUrl).port;

    // Only dev has a port, and there the host must match the page so the
    // cookie applies. In prod the env var is already the origin: deriving one
    // gave "https://host:", the frontend, which serves no /socket.io.
    const wsUrl =
      apiPort && typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.hostname}:${apiPort}`
        : apiUrl;

    const socket = io(wsUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('authenticated', () => {
      setConnected(true);
      socket.emit('joinRoom', { roomId });
    });

    socket.on('disconnect', () => setConnected(false));

    const heartbeat = setInterval(() => {
      if (socket.connected) socket.emit('heartbeat');
    }, HEARTBEAT_MS);

    socket.on('roomUpdated', (data: RoomDto) => {
      const currentRoomId = roomIdRef.current!;
      queryClient.setQueryData(queryKeys.multiplayer.room(currentRoomId), data);
      if (data.status === 'COMPLETED') {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.multiplayer.scoreboard(currentRoomId),
        });
      }
    });

    socket.on(
      'playerRoundComplete',
      (data: {
        userId: string;
        displayName: string;
        roundIndex: number;
        isFirstSolve: boolean;
      }) => {
        onPlayerRoundCompleteRef.current?.(data);
      },
    );

    /**
     * The totals arrive rather than being fetched. Refetching on every
     * completion cost a full scoreboard read per player per event: four
     * hundred of them in a round of twenty.
     */
    socket.on(
      'standingsUpdated',
      ({ standings }: { standings: ScoreboardPlayerTotalDto[] }) => {
        queryClient.setQueryData<ScoreboardDto>(
          queryKeys.multiplayer.scoreboard(roomIdRef.current!),
          (previous) => (previous ? { ...previous, standings } : previous),
        );
      },
    );

    socket.on(
      'presenceUpdate',
      (data: { roomId: string; onlineUserIds: string[] }) => {
        setOnlineUserIds(data.onlineUserIds);
      },
    );

    socket.on('playerRemoved', (data: { userId: string }) => {
      if (data.userId === currentUserId) setRemoved(true);
    });

    socket.on('hostDisconnected', () => setHostDisconnected(true));
    socket.on('hostReconnected', () => setHostDisconnected(false));

    return () => {
      clearInterval(heartbeat);
      socket.disconnect();
      setConnected(false);
      setOnlineUserIds([]);
      setHostDisconnected(false);
      setRemoved(false);
    };
  }, [roomId, queryClient, currentUserId]);

  return { connected, onlineUserIds, hostDisconnected, removed };
}

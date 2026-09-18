'use client';

import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { api } from '@/sdk/client';
import type { OpenRoomDto } from '@/sdk';

/**
 * The rooms waiting for people, pushed rather than polled.
 *
 * The server sends the list on joining the lobby channel, so the snapshot
 * arrives after the subscription on the same socket and no change can land in
 * between. The HTTP fetch is only for the moment before the socket is up, and
 * for a visitor with no session, whose socket the gateway will not accept.
 * Once a pushed list has arrived it wins: a slow fetch must not overwrite it.
 */
export function useLobby() {
  const [rooms, setRooms] = useState<OpenRoomDto[] | undefined>();
  const [isLive, setIsLive] = useState(false);
  const hasPushRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    void api
      .multiplayerControllerListOpenRooms()
      .then(({ rooms }) => {
        if (!cancelled && !hasPushRef.current) setRooms(rooms);
      })
      .catch(() => {
        if (!cancelled && !hasPushRef.current) setRooms([]);
      });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const apiPort = new URL(apiUrl).port;
    const wsUrl =
      apiPort && typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.hostname}:${apiPort}`
        : apiUrl;

    const socket = io(wsUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('authenticated', () => {
      setIsLive(true);
      socket.emit('joinLobby');
    });

    socket.on('lobbyUpdated', ({ rooms }: { rooms: OpenRoomDto[] }) => {
      hasPushRef.current = true;
      setRooms(rooms);
    });

    socket.on('disconnect', () => setIsLive(false));

    return () => {
      cancelled = true;
      if (socket.connected) socket.emit('leaveLobby');
      socket.disconnect();
      setIsLive(false);
    };
  }, []);

  return { rooms, isLive };
}

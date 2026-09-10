'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMe } from '@/hooks/auth/useMe';
import { useEnsureSession } from '@/hooks/auth/useEnsureSession';
import { useCreateRoom } from './useCreateRoom';

const DEFAULT_ROUND_COUNT = 5;

export function useCreateAndEnterRoom() {
  const router = useRouter();
  const { data: user } = useMe();
  const ensureSession = useEnsureSession();
  const createRoom = useCreateRoom();

  const create = useCallback(async () => {
    if (createRoom.isPending) return;

    if (!user) await ensureSession.mutateAsync();

    createRoom.mutate(
      { roundCount: DEFAULT_ROUND_COUNT },
      { onSuccess: (room) => router.push(`/multiplayer/${room.id}`) },
    );
  }, [createRoom, user, ensureSession, router]);

  return {
    create,
    isPending: createRoom.isPending || ensureSession.isPending,
    error: createRoom.error ?? ensureSession.error,
  };
}

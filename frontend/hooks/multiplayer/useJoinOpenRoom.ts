'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/sdk/client';
import type { RoomDto } from '@/sdk';

/** Joining from the lobby, where the room id is all the list hands out. */
export function useJoinOpenRoom() {
  const queryClient = useQueryClient();

  return useMutation<RoomDto, Error, string>({
    mutationFn: async (id: string) => {
      try {
        return await api.multiplayerControllerJoinOpenRoom({ id });
      } catch (e) {
        const message = await getApiErrorMessage(e);
        throw new Error(message);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.multiplayer.room(data.id), data);
    },
  });
}

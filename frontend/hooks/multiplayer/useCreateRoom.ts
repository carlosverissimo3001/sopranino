'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/sdk/client';
import type { RoomDto, CreateRoomControllerDtoRoundCountEnum } from '@/sdk';

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation<RoomDto, Error, CreateRoomControllerDtoRoundCountEnum>({
    mutationFn: async (roundCount) => {
      try {
        return await api.multiplayerControllerCreateRoom({
          createRoomControllerDto: { roundCount },
        });
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

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/sdk/client';
import type { RoomDto, UpdateRoomSettingsControllerDto } from '@/sdk';

interface UpdateRoomSettingsVariables {
  roomId: string;
  settings: UpdateRoomSettingsControllerDto;
}

export function useUpdateRoomSettings() {
  const queryClient = useQueryClient();

  return useMutation<RoomDto, Error, UpdateRoomSettingsVariables>({
    mutationFn: async ({ roomId, settings }) => {
      try {
        return await api.multiplayerControllerUpdateRoomSettings({
          id: roomId,
          updateRoomSettingsControllerDto: settings,
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

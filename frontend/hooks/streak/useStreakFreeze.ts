'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/sdk/client';
import type { MeStatusDto, StreakStatusDto } from '@/sdk';

export function useStreakFreeze() {
  const queryClient = useQueryClient();

  return useMutation<StreakStatusDto, Error>({
    mutationFn: async () => {
      try {
        return await api.streakControllerUseFreeze();
      } catch (e) {
        const message = await getApiErrorMessage(e);
        throw new Error(message);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData<MeStatusDto>(queryKeys.me.status, (status) =>
        status ? { ...status, streak: data } : status,
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.game.allStats });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.game.allHistory,
      });
    },
  });
}

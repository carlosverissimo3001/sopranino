'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage } from '@/lib/api-error';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import type { ImportedSetDto } from '@/sdk';

export function useRefreshImport() {
  const queryClient = useQueryClient();

  return useMutation<ImportedSetDto, Error, string>({
    mutationFn: async (trackGroupId) => {
      try {
        return await api.playlistImportControllerRefresh({ trackGroupId });
      } catch (e) {
        throw new Error(await getApiErrorMessage(e));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.imports.all });
      // The read happens on the queue, so the songs land a moment later.
      setTimeout(
        () =>
          queryClient.invalidateQueries({ queryKey: queryKeys.imports.all }),
        4000,
      );
    },
  });
}

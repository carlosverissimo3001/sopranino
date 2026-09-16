'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage } from '@/lib/api-error';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';

export function useRemoveImport() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (trackGroupId) => {
      try {
        await api.playlistImportControllerLeave({ trackGroupId });
      } catch (e) {
        throw new Error(await getApiErrorMessage(e));
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.imports.all }),
  });
}

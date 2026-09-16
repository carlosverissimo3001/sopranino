'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/sdk/client';

export function useAdminUpdateArtistRequests() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { key: string; resolved: boolean }>({
    mutationFn: async (updateArtistRequestsDto) => {
      try {
        await api.adminControllerUpdateArtistRequests({
          updateArtistRequestsDto,
        });
      } catch (e) {
        throw new Error(await getApiErrorMessage(e));
      }
    },
    // The reports list shows the same rows, so both go stale together.
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.feedback,
      });
    },
  });
}

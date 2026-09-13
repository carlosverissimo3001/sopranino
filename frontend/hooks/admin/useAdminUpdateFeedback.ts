'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/sdk/client';
import type { FeedbackDto } from '@/sdk';

export function useAdminUpdateFeedback() {
  const queryClient = useQueryClient();

  return useMutation<FeedbackDto, Error, { id: string; resolved: boolean }>({
    mutationFn: async ({ id, resolved }) => {
      try {
        return await api.adminControllerUpdateFeedback({
          id,
          updateFeedbackDto: { resolved },
        });
      } catch (e) {
        throw new Error(await getApiErrorMessage(e));
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.feedback,
      });
    },
  });
}

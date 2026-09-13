'use client';

import { useMutation } from '@tanstack/react-query';
import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/sdk/client';
import type { CreateFeedbackControllerDto } from '@/sdk';

export function useSubmitFeedback() {
  return useMutation<void, Error, CreateFeedbackControllerDto>({
    mutationFn: async (dto) => {
      try {
        await api.feedbackControllerSubmit({
          createFeedbackControllerDto: dto,
        });
      } catch (e) {
        throw new Error(await getApiErrorMessage(e));
      }
    },
  });
}

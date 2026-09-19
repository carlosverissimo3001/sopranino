'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getApiErrorMessage } from '@/lib/api-error';
import { api } from '@/sdk/client';
import type { QuizResultDto, SubmitQuizAnswerDto } from '@/sdk';

export function useStreakQuizAnswer() {
  const queryClient = useQueryClient();

  return useMutation<QuizResultDto, Error, SubmitQuizAnswerDto>({
    mutationFn: async (dto) => {
      try {
        return await api.streakControllerSubmitAnswer({
          submitQuizAnswerDto: dto,
        });
      } catch (e) {
        const message = await getApiErrorMessage(e);
        throw new Error(message);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.me.status });
    },
  });
}

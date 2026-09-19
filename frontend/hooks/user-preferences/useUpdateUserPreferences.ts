'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import type {
  AuthMeResponseDto,
  UpdateUserPreferenceDto,
  UserPreferenceDto,
} from '@/sdk';
import { DEFAULT_PREFERENCES } from './useUserPreferences';

type Me = AuthMeResponseDto | null | undefined;

const withPreferences = (me: Me, preferences: UserPreferenceDto): Me =>
  me ? { ...me, preferences } : me;

export function useUpdateUserPreferences() {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.auth.me;

  return useMutation<
    UserPreferenceDto,
    Error,
    UpdateUserPreferenceDto,
    { previous: Me }
  >({
    mutationFn: (updateUserPreferenceDto) =>
      api.userPreferencesControllerUpdate({ updateUserPreferenceDto }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Me>(queryKey);
      queryClient.setQueryData<Me>(queryKey, (me) =>
        withPreferences(me, {
          ...DEFAULT_PREFERENCES,
          ...me?.preferences,
          ...variables,
        }),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
    },
    // The answer is the saved row, so there is nothing left to fetch.
    onSuccess: (saved) => {
      queryClient.setQueryData<Me>(queryKey, (me) =>
        withPreferences(me, saved),
      );
    },
  });
}

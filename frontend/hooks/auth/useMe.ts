'use client';

import { queryOptions, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import { ResponseError } from '@/sdk';
import type { AuthMeResponseDto } from '@/sdk';

/**
 * Who is signed in, or null for nobody. Not being signed in is an answer, not
 * a failure: leaving the query in an error state makes it permanently stale,
 * and every observer that mounts then refetches it.
 */
export const meQuery = queryOptions<AuthMeResponseDto | null>({
  queryKey: queryKeys.auth.me,
  queryFn: async () => {
    try {
      const response = await api.authControllerMe();
      return response ?? null;
    } catch (error: unknown) {
      // The generated client throws ResponseError, which carries the status
      // on its response — reading `error.status` finds undefined and turns a
      // signed-out visitor into a failed query.
      const status =
        error instanceof ResponseError ? error.response.status : undefined;
      if (status === 401 || status === 403) {
        return null;
      }
      throw error;
    }
  },
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  retry: false,
});

export function useMe() {
  return useQuery(meQuery);
}

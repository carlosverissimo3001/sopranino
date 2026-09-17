'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';

export function useImportQuota(enabled = true) {
  return useQuery({
    queryKey: queryKeys.imports.quota,
    queryFn: () => api.playlistImportControllerQuota(),
    enabled,
    staleTime: 60_000,
  });
}

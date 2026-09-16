'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import type { ArtistRequestPageDto } from '@/sdk';
import type { AdminControllerListArtistRequestsRequest } from '@/sdk/apis/ApiApi';

export function useAdminArtistRequests(
  params: AdminControllerListArtistRequestsRequest,
  enabled: boolean,
) {
  return useQuery<ArtistRequestPageDto>({
    queryKey: queryKeys.admin.artistRequests(params),
    queryFn: () => api.adminControllerListArtistRequests(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

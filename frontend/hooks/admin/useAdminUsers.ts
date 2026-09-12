'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import type { AdminUsersPageDto } from '@/sdk';
import type { AdminControllerListUsersRequest } from '@/sdk/apis/ApiApi';

export function useAdminUsers(params: AdminControllerListUsersRequest) {
  return useQuery<AdminUsersPageDto>({
    queryKey: queryKeys.admin.usersList(params),
    queryFn: () => api.adminControllerListUsers(params),
    // The previous page stays on screen while the next one loads, so paging
    // does not collapse the list to a spinner and back.
    placeholderData: keepPreviousData,
  });
}

'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import type { FeedbackPageDto } from '@/sdk';
import type { AdminControllerListFeedbackRequest } from '@/sdk/apis/ApiApi';

export function useAdminFeedback(params: AdminControllerListFeedbackRequest) {
  return useQuery<FeedbackPageDto>({
    queryKey: queryKeys.admin.feedbackList(params),
    queryFn: () => api.adminControllerListFeedback(params),
    placeholderData: keepPreviousData,
  });
}

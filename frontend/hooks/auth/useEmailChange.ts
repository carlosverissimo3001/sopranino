'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage } from '@/lib/api-error';
import { RESEND_COOLDOWN_SECONDS } from '@/lib/consts';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import type { EmailChangeResultDto } from '@/sdk';

/** Asks to move the account to a new address; the pending one shows on /me. */
export function useRequestEmailChange() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { newEmail: string; currentPassword: string }
  >({
    mutationFn: async (body) => {
      try {
        await api.authControllerRequestEmailChange({
          requestEmailChangeControllerDto: body,
        });
      } catch (e) {
        throw new Error(await getApiErrorMessage(e));
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me }),
  });
}

/** The countdown runs from the click, as for verification resends. */
export function useResendEmailChange() {
  const [secondsLeft, setSecondsLeft] = useState(0);

  const mutation = useMutation({
    mutationFn: () => api.authControllerResendEmailChange(),
    onSettled: () => setSecondsLeft(RESEND_COOLDOWN_SECONDS),
  });

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft(secondsLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  return {
    resend: () => mutation.mutate(),
    sent: mutation.isSuccess,
    pending: mutation.isPending,
    secondsLeft,
  };
}

export function useCancelEmailChange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.authControllerCancelEmailChange(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me }),
  });
}

/** Spends a link from either inbox: the new one confirms, the old one cancels. */
export function useSpendEmailChangeLink(kind: 'confirm' | 'cancel') {
  const queryClient = useQueryClient();

  return useMutation<EmailChangeResultDto, Error, string>({
    mutationFn: (token) =>
      kind === 'confirm'
        ? api.authControllerConfirmEmailChange({ confirmEmailDto: { token } })
        : api.authControllerCancelEmailChangeByLink({
            confirmEmailDto: { token },
          }),
    onSuccess: (result) => {
      if (result.done) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      }
    },
  });
}

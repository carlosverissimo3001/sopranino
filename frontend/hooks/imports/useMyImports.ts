'use client';

import { useQuery } from '@tanstack/react-query';
import { useMe } from '@/hooks/auth/useMe';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import type { AuthMeResponseDto, ImportedSetDto } from '@/sdk';

const PENDING_POLL_MS = 2000;

/** Mirrors the server's SignedUpGuard: Spotify, or a password account with a proved address. */
export function canImport(user: AuthMeResponseDto | null | undefined): boolean {
  return (
    !!user && (user.hasLinkedAccount || (!!user.email && user.emailVerified))
  );
}

export function useMyImports() {
  const { data: user } = useMe();
  return useQuery<ImportedSetDto[]>({
    queryKey: queryKeys.imports.mine,
    queryFn: () => api.playlistImportControllerList(),
    enabled: canImport(user),
    // Polled only while a set is still being read, which takes seconds.
    refetchInterval: (query) =>
      query.state.data?.some((set) => set.pending) ? PENDING_POLL_MS : false,
  });
}

/** Imports that can start a round: read, and with songs left in them. */
export function usePlayableImports(): ImportedSetDto[] {
  const { data = [] } = useMyImports();
  return data.filter((set) => !set.pending && set.trackCount > 0);
}

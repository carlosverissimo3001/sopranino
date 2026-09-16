'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage } from '@/lib/api-error';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import type { ImportPlaylistControllerDto, ImportedSetDto } from '@/sdk';

export function useImportPlaylist() {
  const queryClient = useQueryClient();

  return useMutation<ImportedSetDto, Error, ImportPlaylistControllerDto>({
    mutationFn: async (importPlaylistControllerDto) => {
      try {
        return await api.playlistImportControllerImport({
          importPlaylistControllerDto,
        });
      } catch (e) {
        throw new Error(await getApiErrorMessage(e));
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.imports.all }),
  });
}

'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  ExternalLink,
  ListMusic,
  Loader2,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TrackGroupCard } from '@/components/track-group/TrackGroupCard';
import { useRemoveImport } from '@/hooks/imports/useRemoveImport';
import { PLAYLIST_SOURCES } from '@/lib/playlist-links';
import { SourceLogo } from './SourceLogo';
import type { ImportedSetDto } from '@/sdk';

function WaitingCard({ set, line }: { set: ImportedSetDto; line: string }) {
  return (
    <div className="mx-auto flex h-full w-full max-w-[400px] flex-col rounded-xl border border-fg/5 bg-surface p-3 sm:rounded-2xl sm:p-5 md:h-auto">
      <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-lg bg-zinc-800 sm:mb-5 sm:rounded-xl">
        {set.imageUrl ? (
          <Image
            src={set.imageUrl}
            alt=""
            fill
            className="object-cover opacity-40"
          />
        ) : (
          <ListMusic className="absolute inset-0 m-auto h-12 w-12 text-fg/10" />
        )}
        {set.pending && (
          <Loader2 className="absolute inset-0 m-auto h-7 w-7 animate-spin text-fg/70" />
        )}
      </div>
      <h3 className="line-clamp-1 text-sm font-black leading-tight text-fg/60 sm:text-xl">
        {set.name}
      </h3>
      <p className="mt-1.5 text-xs text-fg/40">{line}</p>
    </div>
  );
}

export function ImportedPlaylistCard({ set }: { set: ImportedSetDto }) {
  const remove = useRemoveImport();
  const [isConfirming, setIsConfirming] = useState(false);
  const isEmpty = !set.pending && set.trackCount === 0;

  return (
    <div className="relative h-full">
      {set.pending ? (
        <WaitingCard set={set} line="Reading songs…" />
      ) : isEmpty ? (
        <WaitingCard set={set} line="No playable songs" />
      ) : (
        <TrackGroupCard group={set} />
      )}

      <span
        title={PLAYLIST_SOURCES[set.source].name}
        className={`pointer-events-none absolute left-4 top-4 z-20 flex h-6 w-6 items-center justify-center rounded-full text-white shadow sm:left-6 sm:top-6 ${
          PLAYLIST_SOURCES[set.source].tone.badge
        }`}
      >
        <SourceLogo source={set.source} className="h-3.5 w-3.5" />
      </span>

      {set.staleSince && !set.pending && (
        <p className="pointer-events-none absolute bottom-3 right-3 text-[11px] text-fg/40 sm:bottom-5 sm:right-5">
          Not updating
        </p>
      )}

      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <DropdownMenu
          modal={false}
          onOpenChange={(open) => !open && setIsConfirming(false)}
        >
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Options for ${set.name}`}
              className="rounded-full bg-bg/70 p-1.5 text-fg/70 outline-none backdrop-blur transition-colors hover:text-fg focus-visible:ring-2 focus-visible:ring-fg/40 data-[state=open]:text-fg sm:opacity-0 sm:focus-visible:opacity-100 sm:group-hover/card:opacity-100 sm:data-[state=open]:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-[180px] border border-fg/10 bg-surface/90 backdrop-blur-md"
          >
            <DropdownMenuItem
              asChild
              className="cursor-pointer gap-2 text-xs text-fg/70 focus:bg-fg/[0.08] focus:text-fg"
            >
              <a href={set.externalUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                Open in {PLAYLIST_SOURCES[set.source].name}
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={remove.isPending}
              // The first press arms it; the menu stays open for the second.
              onSelect={(event) => {
                if (!isConfirming) {
                  event.preventDefault();
                  setIsConfirming(true);
                  return;
                }
                remove.mutate(set.id, {
                  onError: (err) => toast.error(err.message),
                });
              }}
              className={`cursor-pointer gap-2 text-xs focus:bg-red-500/10 ${
                isConfirming ? 'font-semibold text-red-400' : 'text-fg/70'
              } focus:text-red-400`}
            >
              {remove.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              {isConfirming ? 'Tap again to remove' : 'Remove'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

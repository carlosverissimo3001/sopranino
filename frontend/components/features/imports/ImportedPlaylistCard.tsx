'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  ExternalLink,
  ListMusic,
  Loader2,
  MoreHorizontal,
  RefreshCw,
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
import { useRefreshImport } from '@/hooks/imports/useRefreshImport';
import { useRemoveImport } from '@/hooks/imports/useRemoveImport';
import { timeAgo } from '@/lib/time-ago';
import { PLAYLIST_SOURCES, PlaylistSource } from '@/lib/playlist-links';
import { SourceMark } from './SourceMark';
import { TrackGroupDtoTypeEnum, type PlaylistItemDto } from '@/sdk';

function WaitingCard({ set, line }: { set: PlaylistItemDto; line: string }) {
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
      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-fg/40">
        {(set.origin ?? set.source) && (
          <SourceMark source={set.origin ?? set.source!} />
        )}
        {line}
      </p>
    </div>
  );
}

export function ImportedPlaylistCard({ set }: { set: PlaylistItemDto }) {
  const remove = useRemoveImport();
  const refresh = useRefreshImport();
  const [isConfirming, setIsConfirming] = useState(false);
  const isEmpty = !set.pending && set.trackCount === 0;

  return (
    <div className="relative h-full">
      {set.pending ? (
        <WaitingCard set={set} line="Reading songs…" />
      ) : isEmpty ? (
        <WaitingCard set={set} line="No playable songs" />
      ) : (
        <TrackGroupCard
          group={{
            id: set.id,
            type: TrackGroupDtoTypeEnum.Imported,
            name: set.name,
            slug: set.slug ?? '',
            trackCount: set.trackCount,
            imageUrl: set.imageUrl,
          }}
          source={set.origin ?? set.source}
          busyLabel={
            set.refreshing || refresh.isPending ? 'Reading songs…' : undefined
          }
        />
      )}

      {set.staleSince && !set.pending && !set.refreshing && (
        <p className="pointer-events-none absolute bottom-4 right-11 text-[11px] text-fg/40 sm:bottom-6 sm:right-14">
          Not updating
        </p>
      )}

      <div className="absolute bottom-2.5 right-2.5 z-20 sm:bottom-4 sm:right-4">
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
            {/* Out of the way here: on every card it would be noise. */}
            <div className="px-2 py-1.5 text-[11px] leading-relaxed text-fg/40">
              {set.origin && set.source && (
                <p>
                  {set.origin === PlaylistSource.Other
                    ? 'A copy'
                    : `${PLAYLIST_SOURCES[set.origin].name} playlist, copied`}{' '}
                  to {PLAYLIST_SOURCES[set.source].name}
                </p>
              )}
              <p>
                {set.refreshing
                  ? 'Reading songs now'
                  : set.staleSince
                    ? 'Not updating any more'
                    : set.refreshedAt
                      ? `Updated ${timeAgo(set.refreshedAt)}`
                      : 'Not read yet'}
              </p>
            </div>
            <DropdownMenuItem
              disabled={refresh.isPending || set.pending || set.refreshing}
              onSelect={() =>
                refresh.mutate(set.id, {
                  onError: (err) => toast.error(err.message),
                })
              }
              className="cursor-pointer gap-2 text-xs text-fg/70 focus:bg-fg/[0.08] focus:text-fg"
            >
              {refresh.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Refresh
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="cursor-pointer gap-2 text-xs text-fg/70 focus:bg-fg/[0.08] focus:text-fg"
            >
              <a href={set.externalUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                Open in{' '}
                {set.source ? PLAYLIST_SOURCES[set.source].name : 'its app'}
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

'use client';

import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CARD_SHADOW } from '@/lib/styles';
import { spotifySetPath } from '@/lib/set-routes';
import { Play, ListMusic, Pin } from 'lucide-react';
import type { PlaylistDto } from '@/sdk';
import { SourceMark } from '@/components/features/imports/SourceMark';
import type { PlaylistSource } from '@/lib/playlist-links';

interface PlaylistCardProps {
  /** Where it comes from, shown beside the track count. */
  source?: PlaylistSource;
  playlist: Pick<PlaylistDto, 'id' | 'name' | 'imageUrl' | 'totalTracks'>;
  index: number;
}

function PlaylistCardComponent({ playlist, source }: PlaylistCardProps) {
  const imageUrl = playlist.imageUrl;
  const isLikedSongs = playlist.id.endsWith('liked-songs');

  return (
    <Link href={spotifySetPath(playlist.id)}>
      <div
        className={`group relative bg-surface rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-fg/5 hover:bg-fg/[0.08] max-w-[400px] mx-auto w-full h-full md:h-auto transform-gpu [backface-visibility:hidden] ${CARD_SHADOW}`}
      >
        <div className="flex flex-col relative z-10 h-full">
          <div className="relative aspect-square w-full rounded-lg sm:rounded-xl overflow-hidden mb-3 sm:mb-5 shadow-2xl">
            {imageUrl ? (
              <Image src={imageUrl} alt="" fill />
            ) : (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                <ListMusic className="text-fg/10 w-12 h-12" />
              </div>
            )}

            {isLikedSongs && (
              <div className="absolute top-2 right-2 z-20 bg-black/60 backdrop-blur-sm rounded-full p-1.5 border border-fg/10">
                <Pin
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-spotify-green rotate-45"
                  fill="currentColor"
                />
              </div>
            )}

            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 motion-reduce:transition-none">
              <div className="scale-90 rounded-full bg-spotify-green p-4 text-black shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-transform duration-200 group-hover:scale-100 motion-reduce:transition-none">
                <Play fill="currentColor" className="w-8 h-8 ml-1" />
              </div>
            </div>
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <h3 className="font-black text-sm sm:text-xl text-fg line-clamp-1 leading-tight group-hover:text-spotify-green transition-colors">
              {playlist.name}
            </h3>

            <div className="mt-1.5 flex items-center flex-nowrap overflow-hidden gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.15em] text-fg/30">
              <div className="flex items-center gap-1.5 shrink-0">
                {source ? (
                  <SourceMark source={source} />
                ) : (
                  <ListMusic className="w-3 h-3 opacity-60" />
                )}
                <span className="whitespace-nowrap">
                  {playlist.totalTracks} tracks
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export const PlaylistCard = memo(PlaylistCardComponent);

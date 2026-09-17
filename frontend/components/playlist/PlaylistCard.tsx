'use client';

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { spotifySetPath } from '@/lib/set-routes';
import { Play, ListMusic, Pin } from 'lucide-react';
import type { PlaylistDto } from '@/sdk';
import { useImageColor } from '@/hooks/misc/useImageColor';
import { SourceMark } from '@/components/features/imports/SourceMark';
import type { PlaylistSource } from '@/lib/playlist-links';

interface PlaylistCardProps {
  /** Where it comes from, shown beside the track count. */
  source?: PlaylistSource;
  playlist: Pick<PlaylistDto, 'id' | 'name' | 'imageUrl' | 'totalTracks'>;
  index: number;
  onHover?: (color: string | null) => void;
}

function PlaylistCardComponent({
  playlist,
  onHover,
  source,
}: PlaylistCardProps) {
  const imageUrl = playlist.imageUrl;
  const [isHovered, setIsHovered] = useState(false);
  const ambientColor = useImageColor(imageUrl, {
    fallback: 'rgba(30, 215, 96, 0.15)',
    alpha: 0.15,
  });
  const isLikedSongs = playlist.id.endsWith('liked-songs');

  const glowColor = ambientColor.replace('0.15', '0.1').replace('0.1', '0.08');

  return (
    <Link href={spotifySetPath(playlist.id)}>
      <motion.div
        onMouseEnter={() => {
          setIsHovered(true);
          onHover?.(ambientColor);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          onHover?.(null);
        }}
        className="group relative bg-surface rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-fg/5 hover:bg-fg/[0.08] max-w-[400px] mx-auto w-full h-full md:h-auto transform-gpu"
        style={{
          boxShadow: isHovered
            ? `0 30px 60px -12px rgba(0,0,0,0.6), 0 0 20px ${glowColor}`
            : '0 10px 30px -15px rgba(0,0,0,0.3)',
          backfaceVisibility: 'hidden',
        }}
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

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: isHovered ? 1 : 0,
                scale: isHovered ? 1 : 0.8,
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="bg-spotify-green p-4 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.5)] text-black transform group-hover:scale-110 transition-transform">
                <Play fill="currentColor" className="w-8 h-8 ml-1" />
              </div>
            </motion.div>
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
      </motion.div>
    </Link>
  );
}

export const PlaylistCard = memo(PlaylistCardComponent);

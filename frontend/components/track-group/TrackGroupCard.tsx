'use client';

import { TrackGroupDtoTypeEnum } from '@/sdk';
import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Play, ListMusic, Loader2 } from 'lucide-react';
import type { TrackGroupDto } from '@/sdk';
import { useImageColor } from '@/hooks/misc/useImageColor';
import { SourceMark } from '@/components/features/imports/SourceMark';
import type { PlaylistSource } from '@/lib/playlist-links';

interface TrackGroupCardProps {
  /** Where it comes from, shown beside the track count. */
  source?: PlaylistSource;
  /** Takes the count's place while its songs are being read. */
  busyLabel?: string;
  group: TrackGroupDto;
  onHover?: (color: string | null) => void;
}

/**
 * Deliberately the playlist card's twin: same proportions, same hover, same
 * typography. Only what fills it differs, because to a player these are the
 * same kind of thing — somewhere to start a round from.
 */
function TrackGroupCardComponent({
  group,
  onHover,
  source,
  busyLabel,
}: TrackGroupCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const imported = group.type === TrackGroupDtoTypeEnum.Imported;
  const ambientColor = useImageColor(group.imageUrl, {
    fallback: 'rgba(30, 215, 96, 0.15)',
    alpha: 0.15,
  });

  const glowColor = ambientColor.replace('0.15', '0.1').replace('0.1', '0.08');

  return (
    <Link href={`/group/${group.slug}`}>
      <motion.div
        onMouseEnter={() => {
          setIsHovered(true);
          onHover?.(ambientColor);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          onHover?.(null);
        }}
        className={`group relative bg-surface rounded-xl sm:rounded-2xl p-3 sm:p-5 border hover:bg-fg/[0.08] max-w-[400px] mx-auto w-full h-full md:h-auto transform-gpu ${imported ? 'border-[#A238FF]/35' : 'border-fg/5'}`}
        style={{
          boxShadow: isHovered
            ? `0 30px 60px -12px rgba(0,0,0,0.6), 0 0 20px ${glowColor}`
            : '0 10px 30px -15px rgba(0,0,0,0.3)',
          backfaceVisibility: 'hidden',
        }}
      >
        <div className="flex flex-col relative z-10 h-full">
          <div className="relative aspect-square w-full rounded-lg sm:rounded-xl overflow-hidden mb-3 sm:mb-5 shadow-2xl">
            {group.imageUrl ? (
              <Image src={group.imageUrl} alt="" fill />
            ) : (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                <ListMusic className="text-fg/10 w-12 h-12" />
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
              {group.name}
            </h3>

            <div className="mt-1.5 flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.15em] text-fg/30">
              <div className="flex items-center gap-1.5">
                {source ? (
                  <SourceMark source={source} />
                ) : (
                  <ListMusic className="w-3.5 h-3.5 opacity-60" />
                )}
                {busyLabel ? (
                  <span className="flex items-center gap-1.5 normal-case tracking-normal">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {busyLabel}
                  </span>
                ) : (
                  <span>{group.trackCount} tracks</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export const TrackGroupCard = memo(TrackGroupCardComponent);

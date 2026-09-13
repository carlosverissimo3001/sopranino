'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play } from 'lucide-react';

/**
 * Tuned against the rendered box, which is ~96px. Past about a quarter of that
 * the cover is not obscured, it is gone, and a hint nobody can read is not a
 * hint - it is a placeholder that happens to be square.
 */
const MAX_BLUR = 26;
const MIN_BLUR = 0;

/**
 * Clears fastest through the middle rounds. A linear ramp spent its first half
 * moving between two amounts of mush and only became legible at the end; this
 * gives something to work with from the third round while keeping the opening
 * round unreadable.
 */
const CURVE = 1.6;

function blurForRound(currentRound: number, maxRounds: number): number {
  if (maxRounds <= 1) {
    return currentRound <= 0 ? MAX_BLUR : MIN_BLUR;
  }

  const clamped = Math.max(0, Math.min(currentRound, maxRounds - 1));
  const progress = clamped / (maxRounds - 1);
  const remaining = Math.pow(1 - progress, CURVE);
  return Math.round(MIN_BLUR + remaining * (MAX_BLUR - MIN_BLUR));
}

interface AlbumArtRevealProps {
  /** Absent until the round's track is known; the box is held either way. */
  albumImageUrl?: string | null;
  currentRound: number;
  maxRounds: number;
  /** When given, the cover is also the play control on a phone. */
  isPlaying?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
}

export function AlbumArtReveal({
  albumImageUrl,
  currentRound,
  maxRounds,
  isPlaying = false,
  onPlay,
  onPause,
}: AlbumArtRevealProps) {
  const blur = blurForRound(currentRound, maxRounds);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <AnimatePresence>
      <motion.div
        className="flex justify-center mb-3 sm:mb-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="relative h-60 w-60 overflow-hidden rounded-2xl bg-fg/10 sm:h-28 sm:w-28 sm:rounded-xl">
          {(!albumImageUrl || !imageLoaded) && (
            <div className="absolute inset-0 animate-pulse bg-fg/10" />
          )}
          {albumImageUrl && (
            // Drawn at the size the blur was tuned for and scaled up on a
            // phone, so the blur grows with the cover instead of thinning out.
            <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 scale-[2.5] sm:h-28 sm:w-28 sm:scale-100">
              <motion.div
                className="absolute inset-0"
                initial={false}
                animate={{ filter: `blur(${blur}px)` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                {/* A blur samples past its own edges, so a cover drawn at the
                  size of the frame fades to transparent at the border and the
                  clip turns that fade into a hard square. This oversized copy
                  is only there to give the edges something to bleed into. */}
                <div
                  className="absolute"
                  style={{ inset: `-${MAX_BLUR}px` }}
                  aria-hidden
                >
                  <Image
                    src={albumImageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 639px) 720px, 224px"
                  />
                </div>

                {/* The cover itself, at the size of the frame, so the hint is the
                  whole sleeve rather than a crop of its middle. */}
                <Image
                  src={albumImageUrl}
                  alt="Album art"
                  fill
                  className={`object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  sizes="(max-width: 639px) 720px, 224px"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageLoaded(true)}
                />
              </motion.div>
            </div>
          )}
          {onPlay && onPause && (
            <button
              type="button"
              onClick={isPlaying ? onPause : onPlay}
              aria-label={isPlaying ? 'Pause snippet' : 'Play snippet'}
              className="absolute inset-0 flex items-center justify-center touch-manipulation sm:hidden"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1DB954] text-black shadow-lg shadow-black/40">
                {isPlaying ? (
                  <Pause className="h-7 w-7" fill="currentColor" />
                ) : (
                  <Play
                    className="h-7 w-7 translate-x-px"
                    fill="currentColor"
                  />
                )}
              </span>
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

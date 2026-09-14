'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Pause, Play } from 'lucide-react';

/**
 * Tuned against the rendered box, which is ~96px. Past about a quarter of that
 * the cover is not obscured, it is gone, and a hint nobody can read is not a
 * hint - it is a placeholder that happens to be square.
 */
const MAX_BLUR = 26;
/** Never sharp: a readable sleeve names the artist, and the last round lists four choices. */
const MIN_BLUR = 4;

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
  /** No round yet: a still cover, not a loading one. */
  idle?: boolean;
}

export function AlbumArtReveal({
  albumImageUrl,
  currentRound,
  maxRounds,
  isPlaying = false,
  onPlay,
  onPause,
  idle = false,
}: AlbumArtRevealProps) {
  const blur = blurForRound(currentRound, maxRounds);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Tuned against a ~96px box, so on a phone, where the cover fills whatever
  // height is free, the blur is a share of the cover's width instead.
  const blurVars = {
    '--blur': blur / 0.96,
    '--blur-px': blur,
    '--bleed': MAX_BLUR / 0.96,
    '--bleed-px': MAX_BLUR,
  } as React.CSSProperties;

  return (
    <AnimatePresence>
      <motion.div
        className="relative mb-3 flex min-h-40 w-full flex-1 justify-center sm:mb-4 sm:min-h-0 sm:flex-none"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Absolute on a phone because only a definite height can be measured
            in container units, and a flexed one is not. */}
        <div className="absolute inset-0 flex items-center justify-center [container-type:size] sm:static sm:[container-type:normal]">
          <div
            className="relative h-[min(100cqw,100cqh)] w-[min(100cqw,100cqh)] overflow-hidden rounded-2xl bg-fg/10 sm:h-28 sm:w-28 sm:rounded-xl"
            style={blurVars}
          >
            {idle ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-spotify-green/25 via-fg/5 to-fg/10">
                <Music className="hidden h-8 w-8 text-fg/40 sm:block" />
              </div>
            ) : (
              (!albumImageUrl || !imageLoaded) && (
                <div className="absolute inset-0 animate-pulse bg-fg/10" />
              )
            )}
            {albumImageUrl && (
              // Its own container, so the blur can measure the cover; the cover
              // itself cannot be one, or its size would measure itself.
              <div className="absolute inset-0 [container-type:size]">
                <div className="absolute inset-0 transition-[filter] duration-[600ms] ease-out [filter:blur(calc(var(--blur)*1cqw))] sm:[filter:blur(calc(var(--blur-px)*1px))]">
                  {/* A blur samples past its own edges, so a cover drawn at the
                  size of the frame fades to transparent at the border and the
                  clip turns that fade into a hard square. This oversized copy
                  is only there to give the edges something to bleed into. */}
                  <div
                    className="absolute [inset:calc(var(--bleed)*-1cqw)] sm:[inset:calc(var(--bleed-px)*-1px)]"
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
                </div>
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
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

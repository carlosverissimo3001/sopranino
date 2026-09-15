'use client';

import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, Check, Music, Pause, Play, X } from 'lucide-react';
import { GameStateDtoStatusEnum } from '@/sdk/models/GameStateDto';
import type { TrackOptionDto } from '@/sdk';
import { ShareButton } from '@/components/daily/ShareButton';
import { GLASS_STYLE } from '@/lib/styles';

interface SongRevealCardProps {
  status: string;
  answer: TrackOptionDto | null | undefined;
  previewUrl?: string | null;
  shareGameId?: string | null;
  showViewStats?: boolean;
  showPlayAgain?: boolean;
  onPlayAgain?: () => void;
  playlistExternalUrl?: string | null;
  playlistName?: string | null;
  isFullSongPlaying: boolean;
  onToggleFullSong: () => void;
  /** Easter egg: personalized rank for special users */
  rankTitle?: string | null;
  /** Guesses spent, skips included, so a win can say how quickly it came. */
  tries?: number;
  /** A last line inside the card, such as the guest's name prompt. */
  footer?: ReactNode;
}

const LINK =
  'inline-flex items-center gap-0.5 text-xs font-semibold text-fg/50 transition-colors hover:text-fg';

export function SongRevealCard({
  status,
  answer,
  previewUrl,
  shareGameId,
  showViewStats,
  showPlayAgain,
  onPlayAgain,
  playlistExternalUrl,
  playlistName,
  isFullSongPlaying,
  onToggleFullSong,
  rankTitle,
  tries,
  footer,
}: SongRevealCardProps) {
  // The backend supplies this. Building it from answer.id assumed every track
  // was a Spotify one, which silently 404s for guest-pool tracks.
  const songUrl = answer?.trackUrl;
  const songService = songUrl?.includes('open.spotify.com')
    ? 'Spotify'
    : 'Deezer';
  // "Rick Ross" alone hides that Diced Pineapples is also Wale and Drake.
  const credited = answer?.allArtists?.length
    ? answer.allArtists.join(', ')
    : answer?.artist;
  const isWon = status === GameStateDtoStatusEnum.Won;
  const [albumLoaded, setAlbumLoaded] = useState(false);

  const verdict = isWon
    ? tries
      ? `Got it in ${tries} ${tries === 1 ? 'try' : 'tries'}`
      : 'Got it'
    : 'Not this time';
  const Verdict = isWon ? Check : X;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="mb-3 overflow-hidden rounded-2xl md:mb-4"
      style={{
        ...GLASS_STYLE,
        background: isWon ? 'rgb(29 185 84 / 0.12)' : 'rgb(239 68 68 / 0.10)',
        border: isWon
          ? '1px solid rgb(29 185 84 / 0.45)'
          : '1px solid rgb(239 68 68 / 0.40)',
      }}
    >
      <div className="flex flex-col items-center gap-4 p-5 text-center sm:flex-row sm:items-center sm:gap-6 sm:p-6 sm:text-left">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            scale: { type: 'spring', stiffness: 260, damping: 22 },
            opacity: { duration: 0.3 },
          }}
          className="relative h-32 w-32 shrink-0 overflow-hidden rounded-xl bg-fg/10 sm:h-44 sm:w-44"
        >
          {answer?.albumImageUrl ? (
            <>
              {!albumLoaded && (
                <div className="absolute inset-0 animate-pulse bg-fg/10" />
              )}
              <Image
                src={answer.albumImageUrl}
                alt={answer.name}
                fill
                className={`object-cover transition-opacity duration-300 ${albumLoaded ? 'opacity-100' : 'opacity-0'}`}
                sizes="(max-width: 639px) 128px, 176px"
                priority
                onLoad={() => setAlbumLoaded(true)}
                onError={() => setAlbumLoaded(true)}
              />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Music className="h-8 w-8 text-fg/30" />
            </div>
          )}
        </motion.div>

        {/* w-full on a phone: a centred flex item sizes to its content, and a
            one-line title's content is as wide as the title. */}
        <div className="flex w-full min-w-0 flex-1 flex-col items-center gap-3 sm:w-auto sm:items-start">
          <div className="w-full min-w-0">
            <p
              className={`flex items-center justify-center gap-1.5 text-sm font-black uppercase tracking-wide sm:justify-start ${isWon ? 'text-spotify-green' : 'text-red-400'}`}
            >
              <Verdict className="h-4 w-4" strokeWidth={3} aria-hidden />
              {verdict}
            </p>
            {rankTitle && (
              <p className="text-xs font-medium text-fg/40">{rankTitle}</p>
            )}
            {answer && (
              <>
                <h2 className="mt-1 line-clamp-2 break-words text-2xl font-black leading-tight tracking-tight text-fg sm:line-clamp-none sm:truncate sm:text-3xl sm:leading-normal">
                  {answer.name}
                </h2>
                <p className="truncate text-sm text-fg/60">{credited}</p>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            {previewUrl && (
              <button
                type="button"
                onClick={onToggleFullSong}
                aria-label={
                  isFullSongPlaying ? 'Pause the song' : 'Play the song'
                }
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-fg/10 bg-fg/10 text-fg transition-colors hover:bg-fg/20"
              >
                {isFullSongPlaying ? (
                  <Pause className="h-4 w-4" fill="currentColor" />
                ) : (
                  <Play
                    className="h-4 w-4 translate-x-px"
                    fill="currentColor"
                  />
                )}
              </button>
            )}
            {shareGameId && (
              <ShareButton gameId={shareGameId} variant="default" />
            )}
            {showViewStats && (
              <Link
                href="/history?filter=daily"
                className="inline-flex h-9 items-center rounded-full border border-fg/10 bg-fg/10 px-3.5 text-sm font-semibold text-fg transition-colors hover:bg-fg/20"
              >
                View stats
              </Link>
            )}
            {showPlayAgain && onPlayAgain && (
              <button
                type="button"
                onClick={onPlayAgain}
                className="inline-flex h-9 items-center rounded-full bg-spotify-green px-4 text-sm font-bold text-black transition-colors hover:bg-[#1ed760]"
              >
                Play again
              </button>
            )}
          </div>

          {/* Links, not rows: the rows repeated the cover, title and artist
              that are already right above them. */}
          {(songUrl || answer?.albumUrl || playlistExternalUrl) && (
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:justify-start">
              {songUrl && (
                <a
                  href={songUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={LINK}
                >
                  Open in {songService}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              )}
              {answer?.albumUrl && (
                <a
                  href={answer.albumUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${LINK} max-w-[14rem]`}
                >
                  <span className="truncate">
                    {answer.albumName ? `Album: ${answer.albumName}` : 'Album'}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                </a>
              )}
              {playlistExternalUrl && playlistName != null && (
                <a
                  href={playlistExternalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${LINK} max-w-[14rem]`}
                >
                  <span className="truncate">Playlist: {playlistName}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {footer && (
        <div className="border-t border-fg/10 px-5 py-3 sm:px-6">{footer}</div>
      )}
    </motion.div>
  );
}

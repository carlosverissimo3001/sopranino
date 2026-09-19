'use client';

import { useState, type FormEvent } from 'react';
import { ChevronDown, ChevronRight, Loader2, Zap } from 'lucide-react';
import { ImportGuide } from './ImportGuide';
import { SourceLogo } from './SourceLogo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useImportPlaylist } from '@/hooks/imports/useImportPlaylist';
import { useImportQuota } from '@/hooks/imports/useImportQuota';
import { useMe } from '@/hooks/auth/useMe';
import { spotifyIsLinked } from '@/lib/can-import';
import {
  detectPlaylistSource,
  LINK_EXAMPLE,
  LINK_SOURCE,
  ORIGIN_OPTIONS,
  PLAYLIST_SOURCES,
  PlaylistSource,
  TUNEMYMUSIC_URL,
} from '@/lib/playlist-links';

interface ImportPanelProps {
  onImported?: () => void;
  disabled?: boolean;
}

/** One stop on the route a playlist takes into the game. */
function Stop({
  source,
  label,
  className = '',
}: {
  source?: PlaylistSource;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 font-semibold text-fg/80 ${className}`}
    >
      {source ? (
        <SourceLogo
          source={source}
          className={`h-3.5 w-3.5 ${PLAYLIST_SOURCES[source].tone.mark}`}
        />
      ) : (
        <span
          aria-hidden
          className="flex h-4 w-4 items-center justify-center rounded bg-spotify-green"
        >
          <Zap className="h-2.5 w-2.5 fill-black text-black" />
        </span>
      )}
      {label}
    </span>
  );
}

/** A leg of the route, pointing onward: the direction is the point. */
function Leg({
  children,
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  // A carrier rides the middle of the line, so it reads as how this leg is
  // travelled rather than as part of the name before it.
  return (
    <span
      className={`flex min-w-4 flex-1 items-center gap-2 text-fg/35 ${className}`}
    >
      {children && (
        <>
          <span aria-hidden className="h-px flex-1 bg-fg/20" />
          {children}
        </>
      )}
      <span aria-hidden className="flex flex-1 items-center">
        <span className="h-px flex-1 bg-fg/20" />
        <ChevronRight className="-ml-1.5 h-3 w-3 shrink-0 text-fg/30" />
      </span>
    </span>
  );
}

export function ImportPanel({
  onImported,
  disabled = false,
}: ImportPanelProps) {
  const submit = useImportPlaylist();
  const { data: user } = useMe();
  const { data: quota } = useImportQuota(!disabled);
  const [link, setLink] = useState('');
  const [origin, setOrigin] = useState<PlaylistSource>(PlaylistSource.Deezer);

  const pasted = detectPlaylistSource(link);
  const pastedInfo = pasted ? PLAYLIST_SOURCES[pasted] : null;
  const spent = quota?.left === 0;
  // Their own Spotify playlists are already listed, so that origin is not offered.
  const spotifyLinked = spotifyIsLinked(user);
  const origins = ORIGIN_OPTIONS.filter(
    (option) => !(option === PlaylistSource.Spotify && spotifyLinked),
  );
  const onDeezer = origin === PlaylistSource.Deezer;

  const canSend =
    !disabled && !spent && pasted === LINK_SOURCE && !submit.isPending;

  const send = (event: FormEvent) => {
    event.preventDefault();
    if (!canSend) return;
    submit.mutate(
      {
        source: LINK_SOURCE,
        link: link.trim(),
        // Deezer is the link's own service, so it is not a claim about origin.
        origin: onDeezer ? undefined : origin,
      },
      {
        onSuccess: () => {
          setLink('');
          onImported?.();
        },
      },
    );
  };

  const problem = disabled
    ? 'Verify your email to import playlists.'
    : spent
      ? 'No playlist reads left today. Playlists someone else already imported can still be added.'
      : pastedInfo && pasted !== LINK_SOURCE
        ? `That is a ${pastedInfo.name} link. Copy the playlist to Deezer first, then paste the Deezer one.`
        : link.trim() && !pasted
          ? "That isn't a Deezer playlist link."
          : submit.isError
            ? submit.error.message
            : null;

  return (
    <form
      onSubmit={send}
      className="rounded-2xl border border-fg/10 bg-fg/[0.03] p-4 sm:p-6"
    >
      {/* Two fixed columns rather than one wrapping row: a dialog closing
          takes the scrollbar padding with it, and a row on the edge of its
          wrap point would move "Show me how" for a moment. */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-base font-semibold text-fg sm:text-lg">
          My playlist is on
          {/* The same menu as the playlist sort, not a native select: the open
              list of a <select> is drawn by the OS and ignores the app. */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              disabled={disabled}
              aria-label="Where the playlist is now"
              className="inline-flex items-center gap-2 rounded-full border border-fg/15 bg-bg/60 py-1.5 pl-3 pr-3 text-base font-semibold text-fg outline-none transition-colors hover:border-fg/30 focus-visible:ring-2 focus-visible:ring-fg/20 disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:border-fg/30 sm:text-lg"
            >
              <SourceLogo
                source={origin}
                className={`h-4 w-4 shrink-0 ${PLAYLIST_SOURCES[origin].tone.mark}`}
              />
              {PLAYLIST_SOURCES[origin].name}
              <ChevronDown aria-hidden className="h-4 w-4 text-fg/40" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="min-w-[200px] border border-fg/10 bg-surface/80 backdrop-blur-md"
            >
              <DropdownMenuRadioGroup
                value={origin}
                onValueChange={(value) => setOrigin(value as PlaylistSource)}
              >
                {origins.map((option) => (
                  <DropdownMenuRadioItem
                    key={option}
                    value={option}
                    className="cursor-pointer gap-2 text-xs text-fg/70 focus:bg-fg/[0.08] focus:text-fg data-[state=checked]:text-fg"
                  >
                    <SourceLogo
                      source={option}
                      className={`size-3.5 ${PLAYLIST_SOURCES[option].tone.mark}`}
                    />
                    {PLAYLIST_SOURCES[option].name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <ImportGuide />
      </div>

      {/* The route is the whole mechanism: whatever the service, a playlist
          reaches the game as a public Deezer link. */}
      {/* The route is the whole mechanism: whatever the service, a playlist
          reaches the game as a public Deezer link. */}
      <p
        className={`mt-4 items-center gap-2 text-xs ${onDeezer ? 'hidden sm:flex' : 'flex'}`}
      >
        {!onDeezer && (
          <>
            <Stop
              source={origin === PlaylistSource.Other ? undefined : origin}
              label={
                origin === PlaylistSource.Other
                  ? 'Your service'
                  : PLAYLIST_SOURCES[origin].name
              }
            />
            <Leg>
              <a
                href={TUNEMYMUSIC_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="shrink-0 transition-colors hover:text-fg/70"
              >
                via{' '}
                <span className="underline decoration-fg/20 underline-offset-2">
                  TuneMyMusic
                </span>
              </a>
            </Leg>
          </>
        )}
        <Stop source={PlaylistSource.Deezer} label="Deezer" />
        {/* Where they already are, so it is the stop a phone can spare. */}
        <Leg className="hidden sm:flex" />
        <Stop label="Sopranino" className="hidden sm:inline-flex" />
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label className="min-w-0 flex-1">
          <span className="sr-only">
            {onDeezer ? 'Deezer playlist link' : 'Link to the copy on Deezer'}
          </span>
          <input
            type="url"
            inputMode="url"
            value={link}
            onChange={(event) => {
              setLink(event.target.value);
              if (submit.isError) submit.reset();
            }}
            disabled={disabled}
            placeholder={onDeezer ? LINK_EXAMPLE : 'Link to the Deezer copy'}
            autoComplete="off"
            className="block w-full min-w-0 rounded-full border border-fg/10 bg-bg/60 px-4 py-2.5 text-sm text-fg placeholder:text-fg/30 focus:border-fg/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
        </label>
        <button
          type="submit"
          disabled={!canSend}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#A238FF] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8F24F0] disabled:cursor-not-allowed disabled:bg-fg/10 disabled:text-fg/30"
        >
          {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Import
        </button>
      </div>

      <p
        role={problem ? 'alert' : undefined}
        className={`mt-2 pl-4 text-xs ${problem ? 'text-red-400' : 'text-fg/40'}`}
      >
        {problem ??
          `Public playlists only.${quota ? ` ${quota.left} of ${quota.limit} reads left today.` : ''}`}
      </p>
    </form>
  );
}

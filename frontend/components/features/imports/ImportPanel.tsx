'use client';

import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { useImportPlaylist } from '@/hooks/imports/useImportPlaylist';
import { useImportQuota } from '@/hooks/imports/useImportQuota';
import {
  detectPlaylistSource,
  linkSourceFor,
  PLAYLIST_SOURCES,
  TUNEMYMUSIC_URL,
  type PlaylistSource,
} from '@/lib/playlist-links';

interface ImportPanelProps {
  source: PlaylistSource;
  /** A link from another service moves the tiles to that service. */
  onSourceChange: (source: PlaylistSource) => void;
  onImported?: () => void;
  disabled?: boolean;
}

export function ImportPanel({
  source,
  onSourceChange,
  onImported,
  disabled = false,
}: ImportPanelProps) {
  const submit = useImportPlaylist();
  const { data: quota } = useImportQuota(!disabled);
  const [link, setLink] = useState('');
  const info = PLAYLIST_SOURCES[source];
  // A service we can't read is imported from its copy, so the link is the copy's.
  const wanted = linkSourceFor(source);
  const wantedInfo = PLAYLIST_SOURCES[wanted];

  const pasted = detectPlaylistSource(link);
  const pastedInfo = pasted ? PLAYLIST_SOURCES[pasted] : null;
  const spent = quota?.left === 0;
  const canSend =
    !disabled &&
    !spent &&
    pasted === wanted &&
    info.supported &&
    !submit.isPending;

  const send = (e: FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    submit.mutate(
      {
        source: wanted,
        link: link.trim(),
        origin: info.via ? source : undefined,
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
      : pasted && pasted !== wanted && PLAYLIST_SOURCES[pasted].via === wanted
        ? `Copy it to ${wantedInfo.name} with TuneMyMusic first, then paste the ${wantedInfo.name} link.`
        : pastedInfo && !pastedInfo.supported
          ? `${pastedInfo.name} playlists can't be imported yet.`
          : link.trim() && !pasted
            ? `That isn't a ${wantedInfo.name} playlist link.`
            : submit.isError
              ? submit.error.message
              : null;

  return (
    <form
      onSubmit={send}
      className={`rounded-2xl border p-4 transition-colors sm:p-6 ${info.tone.panel}`}
    >
      <ol className="mb-4 space-y-2 sm:mb-5">
        {info.steps.map((step, index) => (
          <li key={step} className="flex items-center gap-3 text-sm text-fg/80">
            <span
              aria-hidden
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${info.tone.step}`}
            >
              {index + 1}
            </span>
            {info.via && index === 0 ? (
              <span>
                {step.split('TuneMyMusic')[0]}
                <a
                  href={TUNEMYMUSIC_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-semibold underline underline-offset-2 hover:text-fg"
                >
                  TuneMyMusic
                </a>
                {step.split('TuneMyMusic')[1]}
              </span>
            ) : (
              step
            )}
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="min-w-0 flex-1">
          <span className="sr-only">{info.name} playlist link</span>
          <input
            type="url"
            inputMode="url"
            value={link}
            onChange={(e) => {
              const next = e.target.value;
              setLink(next);
              if (submit.isError) submit.reset();
              const detected = detectPlaylistSource(next);
              // A Deezer link under a "via Deezer" pick is expected, so it stays put.
              if (detected && detected !== source && detected !== wanted) {
                onSourceChange(detected);
              }
            }}
            disabled={disabled}
            placeholder={info.example}
            autoComplete="off"
            className="block w-full min-w-0 rounded-full border border-fg/10 bg-bg/60 px-4 py-2.5 text-sm text-fg placeholder:text-fg/30 focus:border-fg/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
        </label>
        <button
          type="submit"
          disabled={!canSend}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-spotify-green px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#1ed760] disabled:cursor-not-allowed disabled:bg-fg/10 disabled:text-fg/30"
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
          (info.via
            ? `The copy stands alone: songs added on ${info.name} reach it when you transfer again. Free up to 500 songs.`
            : `Public playlists only.${quota ? ` ${quota.left} of ${quota.limit} reads left today.` : ''}`)}
      </p>
    </form>
  );
}

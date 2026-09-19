import Link from 'next/link';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { SourceLogo } from '@/components/features/imports/SourceLogo';
import {
  ORIGIN_OPTIONS,
  PLAYLIST_SOURCES,
  PlaylistSource,
} from '@/lib/playlist-links';

// "Somewhere else" is a choice in the import panel, not a service to show.
const SHOWN = ORIGIN_OPTIONS.filter(
  (source) => source !== PlaylistSource.Other,
);

/** What a guest gets from an account, where their playlists would be. */
export function SignUpForPlaylists() {
  return (
    <CollapsibleSection title="Your playlists" titleLabel="Your playlists">
      <div className="-mt-2 flex flex-col gap-4 sm:-mt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <p className="text-sm text-fg/60 sm:text-base">
            Create a free account to play songs from your own playlists,
            wherever you keep them.
          </p>
          <div aria-hidden className="flex flex-wrap gap-2">
            {SHOWN.map((source) => (
              <span
                key={source}
                className="inline-flex items-center gap-1.5 rounded-full border border-fg/10 bg-fg/[0.03] px-3 py-1.5 text-xs font-bold text-fg/60"
              >
                <SourceLogo
                  source={source}
                  className={`h-3.5 w-3.5 shrink-0 ${PLAYLIST_SOURCES[source].tone.mark}`}
                />
                {PLAYLIST_SOURCES[source].name}
              </span>
            ))}
          </div>
        </div>
        <Link
          href="/signin?mode=signup"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-spotify-green px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#1ed760]"
        >
          Create an account
        </Link>
      </div>
    </CollapsibleSection>
  );
}

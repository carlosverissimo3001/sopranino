import Link from 'next/link';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { SourceLogo } from '@/components/features/imports/SourceLogo';
import { PLAYLIST_SOURCES, SOURCE_ORDER } from '@/lib/playlist-links';

// The sentence names only what works today; the rest are shown as coming.
const SUPPORTED = SOURCE_ORDER.filter(
  (source) => PLAYLIST_SOURCES[source].supported,
).map((source) => PLAYLIST_SOURCES[source].name);
const NAMES = SUPPORTED.join(', ').replace(/, ([^,]*)$/, ' or $1');

/** What a guest gets from an account, where their playlists would be. */
export function SignUpForPlaylists() {
  return (
    <CollapsibleSection title="Your playlists" titleLabel="Your playlists">
      <div className="-mt-2 flex flex-col gap-4 sm:-mt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <p className="text-sm text-fg/60 sm:text-base">
            Create a free account to play songs from your own {NAMES} playlists.
          </p>
          <div aria-hidden className="flex flex-wrap gap-2">
            {SOURCE_ORDER.map((source) => {
              const info = PLAYLIST_SOURCES[source];
              return (
                <span
                  key={source}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${info.tone.chipOff} ${info.supported ? '' : 'opacity-50 grayscale'}`}
                >
                  <SourceLogo
                    source={source}
                    className="h-3.5 w-3.5 shrink-0"
                  />
                  {info.name}
                  {info.via ? (
                    <span className="font-semibold opacity-70">
                      via {PLAYLIST_SOURCES[info.via].name}
                    </span>
                  ) : (
                    !info.supported && (
                      <span className="font-semibold opacity-70">soon</span>
                    )
                  )}
                </span>
              );
            })}
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

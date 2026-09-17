import { PLAYLIST_SOURCES, type PlaylistSource } from '@/lib/playlist-links';
import { SourceLogo } from './SourceLogo';

/** The service's logo in its own colour, beside a card's track count. */
export function SourceMark({
  source,
  className = '',
}: {
  source: PlaylistSource;
  className?: string;
}) {
  const info = PLAYLIST_SOURCES[source];
  return (
    <SourceLogo
      source={source}
      role="img"
      aria-label={info.name}
      className={`h-3.5 w-3.5 shrink-0 ${info.tone.mark} ${className}`}
    />
  );
}

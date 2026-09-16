import { ImportPlaylistControllerDtoSourceEnum as Source } from '@/sdk';

export { Source as PlaylistSource };

export interface SourceInfo {
  name: string;
  hosts: string[];
  supported: boolean;
  steps: string[];
  example: string;
  /** Full class strings, so Tailwind sees every one of them. */
  tone: {
    chipOn: string;
    chipOff: string;
    panel: string;
    step: string;
    badge: string;
    mark: string;
  };
}

export const PLAYLIST_SOURCES: Record<Source, SourceInfo> = {
  [Source.Deezer]: {
    name: 'Deezer',
    hosts: ['deezer.com', 'link.deezer.com', 'deezer.page.link'],
    supported: true,
    steps: [
      'Open the playlist in Deezer',
      'Tap Share, then Copy link',
      'Paste the link here',
    ],
    example: 'https://www.deezer.com/playlist/…',
    tone: {
      chipOn:
        'border-[#A238FF]/50 bg-[#A238FF]/20 text-[#7B1FD6] dark:text-[#D2A4FF]',
      chipOff:
        'border-[#A238FF]/20 bg-[#A238FF]/5 text-[#7B1FD6]/80 hover:bg-[#A238FF]/10 dark:text-[#D2A4FF]/80',
      panel: 'border-[#A238FF]/30 bg-[#A238FF]/[0.06]',
      step: 'bg-[#A238FF]/20 text-[#7B1FD6] dark:text-[#C98BFF]',
      badge: 'bg-[#A238FF]',
      mark: 'text-[#A238FF]',
    },
  },
  [Source.Spotify]: {
    name: 'Spotify',
    hosts: ['open.spotify.com'],
    supported: false,
    steps: [
      'Open the playlist in Spotify',
      'Tap Share, then Copy link to playlist',
      'Paste the link here',
    ],
    example: 'https://open.spotify.com/playlist/…',
    tone: {
      chipOn: 'border-spotify-green/50 bg-spotify-green/20 text-spotify-green',
      chipOff: 'border-spotify-green/20 bg-spotify-green/5 text-spotify-green',
      panel: 'border-spotify-green/30 bg-spotify-green/[0.06]',
      step: 'bg-spotify-green/20 text-spotify-green',
      badge: 'bg-spotify-green',
      mark: 'text-spotify-green',
    },
  },
  [Source.AppleMusic]: {
    name: 'Apple Music',
    hosts: ['music.apple.com'],
    supported: false,
    steps: [
      'Open the playlist in Apple Music',
      'Tap Share, then Copy',
      'Paste the link here',
    ],
    example: 'https://music.apple.com/playlist/…',
    tone: {
      chipOn:
        'border-[#FA2D48]/50 bg-[#FA2D48]/20 text-[#C4122A] dark:text-[#FF8A99]',
      chipOff:
        'border-[#FA2D48]/20 bg-[#FA2D48]/5 text-[#C4122A] dark:text-[#FF8A99]',
      panel: 'border-[#FA2D48]/30 bg-[#FA2D48]/[0.06]',
      step: 'bg-[#FA2D48]/20 text-[#C4122A] dark:text-[#FF6B7F]',
      badge: 'bg-[#FA2D48]',
      mark: 'text-[#FA2D48]',
    },
  },
};

export const SOURCE_ORDER = Object.keys(PLAYLIST_SOURCES) as Source[];

/** Which service a pasted link belongs to. The server checks the rest. */
export function detectPlaylistSource(link: string): Source | null {
  const trimmed = link.trim();
  if (!trimmed) return null;
  let host: string;
  try {
    host = new URL(
      /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
    ).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
  return (
    SOURCE_ORDER.find((source) =>
      PLAYLIST_SOURCES[source].hosts.includes(host),
    ) ?? null
  );
}

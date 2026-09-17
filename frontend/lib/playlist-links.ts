import { ImportPlaylistControllerDtoSourceEnum as Source } from '@/sdk';

export { Source as PlaylistSource };

export interface GuideSlide {
  /** One thing to do, in the player's words. */
  title: string;
  /** What the picture shows, and what it is for. */
  caption: string;
  /** What to capture, until the screenshot exists. */
  shotOf: string;
  /** Under public/, e.g. guides/deezer-share.png. Absent leaves the frame empty. */
  image?: string;
}

export interface SourceInfo {
  name: string;
  hosts: string[];
  supported: boolean;
  /** Imported as a copy on this service, since we can't read the original. */
  via?: Source;
  steps: string[];
  /** The same path as `steps`, shown one screen at a time with pictures. */
  guide: GuideSlide[];
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
    guide: [
      {
        title: 'Open the playlist in Deezer',
        caption: 'Any public playlist works, yours or somebody else’s.',
        shotOf: 'A playlist page in Deezer, with its cover and songs',
        image: 'guides/deezer-playlist.png',
      },
      {
        title: 'Tap Share, then Copy link',
        caption: 'Share sits under the three dots beside the play button.',
        shotOf: 'The Deezer share menu open, with Copy link in view',
      },
      {
        title: 'Paste it here and press Import',
        caption: 'The songs arrive in a few seconds, and only you see them.',
        shotOf: 'The Sopranino import panel with a Deezer link pasted',
      },
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
    supported: true,
    via: Source.Deezer,
    steps: [
      'Copy the playlist to Deezer with TuneMyMusic, a free tool',
      'Open the copy in Deezer, tap Share, then Copy link',
      'Paste the Deezer link here',
    ],
    guide: [
      {
        title: 'Open TuneMyMusic and pick Spotify',
        caption: 'A free tool that copies a playlist between services.',
        shotOf: 'TuneMyMusic with Spotify chosen as the source',
        image: 'guides/tmm-spotify-source.png',
      },
      {
        title: 'Choose Deezer as the destination',
        caption:
          'Sign in to both, then start the transfer. Free up to 500 songs.',
        shotOf: 'TuneMyMusic with Deezer chosen as the destination',
      },
      {
        title: 'Open the copy in Deezer, Share, Copy link',
        caption: 'The transfer leaves a new playlist in your Deezer account.',
        shotOf: 'The copied playlist in Deezer with the share menu open',
      },
      {
        title: 'Paste the Deezer link here',
        caption: 'Songs you add on Spotify reach it when you transfer again.',
        shotOf: 'The Sopranino import panel with the Deezer link pasted',
      },
    ],
    example: 'https://www.deezer.com/playlist/…',
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
    supported: true,
    via: Source.Deezer,
    steps: [
      'Copy the playlist to Deezer with TuneMyMusic, a free tool',
      'Open the copy in Deezer, tap Share, then Copy link',
      'Paste the Deezer link here',
    ],
    guide: [
      {
        title: 'Open TuneMyMusic and pick Apple Music',
        caption: 'A free tool that copies a playlist between services.',
        shotOf: 'TuneMyMusic with Apple Music chosen as the source',
        image: 'guides/tmm-apple-source.png',
      },
      {
        title: 'Choose Deezer as the destination',
        caption:
          'Sign in to both, then start the transfer. Free up to 500 songs.',
        shotOf: 'TuneMyMusic with Deezer chosen as the destination',
      },
      {
        title: 'Open the copy in Deezer, Share, Copy link',
        caption: 'The transfer leaves a new playlist in your Deezer account.',
        shotOf: 'The copied playlist in Deezer with the share menu open',
      },
      {
        title: 'Paste the Deezer link here',
        caption:
          'Songs you add on Apple Music reach it when you transfer again.',
        shotOf: 'The Sopranino import panel with the Deezer link pasted',
      },
    ],
    example: 'https://www.deezer.com/playlist/…',
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

export const TUNEMYMUSIC_URL = 'https://www.tunemymusic.com/';

/** Which service the pasted link has to come from for this pick. */
export function linkSourceFor(source: Source): Source {
  return PLAYLIST_SOURCES[source].via ?? source;
}

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

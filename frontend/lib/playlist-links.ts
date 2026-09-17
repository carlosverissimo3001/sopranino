import { ImportPlaylistControllerDtoSourceEnum as Source } from '@/sdk';

export { Source as PlaylistSource };

export interface GuideSlide {
  /** One thing to do, in the player's words. */
  title: string;
  /** What the picture shows, and what it is for. */
  caption: string;
  /** What to capture, until the screenshot exists. */
  shotOf: string;
  /** Under public/, e.g. guides/deezer-share.webp. Absent leaves the frame empty. */
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
    /** The Import button, in the service's own colour. */
    cta: string;
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
        image: 'guides/deezer-playlist.webp',
      },
      {
        title: 'Tap Share, then Copy link',
        caption: 'Share sits under the three dots beside the play button.',
        shotOf: 'The Deezer share menu open, with Copy link in view',
        image: 'guides/deezer-share-menu.webp',
      },
      {
        title: 'Press Copy in the share box',
        caption: 'Deezer hands you a link.deezer.com address. That is the one.',
        shotOf: 'The Deezer share box with the link and the Copy button',
        image: 'guides/deezer-copy-link.webp',
      },
      {
        title: 'Paste it here and press Import',
        caption: 'The songs arrive in a few seconds, and only you see them.',
        shotOf: 'The Sopranino import panel with a Deezer link pasted',
        image: 'guides/sopranino-pasted-v2.webp',
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
      cta: 'bg-[#A238FF] text-white hover:bg-[#B45CFF]',
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
        image: 'guides/tmm-spotify-source.webp',
      },
      {
        title: 'Load the playlist',
        caption:
          'Sign in to pick from your library, or paste one playlist link.',
        shotOf: 'TuneMyMusic offering to sign in or take a pasted link',
        image: 'guides/tmm-spotify-load.webp',
      },
      {
        title: 'Choose Deezer as the destination',
        caption: 'Sign in to Deezer when it asks. A free account is enough.',
        shotOf: 'TuneMyMusic with Deezer picked as the destination',
        image: 'guides/tmm-spotify-destination.webp',
      },
      {
        title: 'Start Transfer',
        caption: 'Free up to 500 songs. It takes a minute or two.',
        shotOf: 'The last TuneMyMusic step, with the Start Transfer button',
        image: 'guides/tmm-spotify-transfer.webp',
      },
      {
        title: 'Open the copy in Deezer, Share, Copy link',
        caption: 'The transfer leaves a new playlist in your Deezer account.',
        shotOf: 'The copied playlist in Deezer with the share menu open',
        image: 'guides/deezer-share-menu.webp',
      },
      {
        title: 'Paste the Deezer link here',
        caption: 'Songs you add on Spotify reach it when you transfer again.',
        shotOf: 'The Sopranino import panel with the Deezer link pasted',
        image: 'guides/sopranino-pasted-spotify-v2.webp',
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
      cta: 'bg-spotify-green text-black hover:bg-[#1ed760]',
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
        image: 'guides/tmm-apple-source.webp',
      },
      {
        title: 'Load the playlist',
        caption:
          'Sign in to pick from your library, or paste one playlist link.',
        shotOf: 'TuneMyMusic offering to sign in or take a pasted link',
        image: 'guides/tmm-apple-load.webp',
      },
      {
        title: 'Choose Deezer as the destination',
        caption: 'Sign in to Deezer when it asks. A free account is enough.',
        shotOf: 'TuneMyMusic with Deezer picked as the destination',
        image: 'guides/tmm-apple-destination.webp',
      },
      {
        title: 'Start Transfer',
        caption: 'Free up to 500 songs. It takes a minute or two.',
        shotOf: 'The last TuneMyMusic step, with the Start Transfer button',
        image: 'guides/tmm-apple-transfer.webp',
      },
      {
        title: 'Open the copy in Deezer, Share, Copy link',
        caption: 'The transfer leaves a new playlist in your Deezer account.',
        shotOf: 'The copied playlist in Deezer with the share menu open',
        image: 'guides/deezer-share-menu.webp',
      },
      {
        title: 'Paste the Deezer link here',
        caption:
          'Songs you add on Apple Music reach it when you transfer again.',
        shotOf: 'The Sopranino import panel with the Deezer link pasted',
        image: 'guides/sopranino-pasted-apple-v2.webp',
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
      cta: 'bg-[#FA2D48] text-white hover:bg-[#FF4A61]',
    },
  },
  [Source.YoutubeMusic]: {
    name: 'YouTube Music',
    hosts: ['music.youtube.com'],
    supported: true,
    via: Source.Deezer,
    steps: [
      'Copy the playlist to Deezer with TuneMyMusic, a free tool',
      'Open the copy in Deezer, tap Share, then Copy link',
      'Paste the Deezer link here',
    ],
    guide: [
      {
        title: 'Open TuneMyMusic and pick YouTube Music',
        caption: 'A free tool that copies a playlist between services.',
        shotOf: 'TuneMyMusic with YouTube Music chosen as the source',
        image: 'guides/tmm-youtube-source.webp',
      },
      {
        title: 'Load the playlist',
        caption:
          'Sign in to pick from your library, or paste one playlist link.',
        shotOf: 'TuneMyMusic offering to sign in or take a pasted link',
        image: 'guides/tmm-youtube-load.webp',
      },
      {
        title: 'Choose Deezer as the destination',
        caption: 'Sign in to Deezer when it asks. A free account is enough.',
        shotOf: 'TuneMyMusic with Deezer picked as the destination',
        image: 'guides/tmm-youtube-destination.webp',
      },
      {
        title: 'Start Transfer',
        caption: 'Videos and uploads it cannot match are left behind.',
        shotOf: 'The last TuneMyMusic step, with the Start Transfer button',
        image: 'guides/tmm-youtube-transfer.webp',
      },
      {
        title: 'Open the copy in Deezer, Share, Copy link',
        caption: 'The transfer leaves a new playlist in your Deezer account.',
        shotOf: 'The copied playlist in Deezer with the share menu open',
        image: 'guides/deezer-share-menu.webp',
      },
      {
        title: 'Paste the Deezer link here',
        caption:
          'Songs you add on YouTube Music reach it when you transfer again.',
        shotOf: 'The Sopranino import panel with the Deezer link pasted',
        image: 'guides/sopranino-pasted-youtube-v2.webp',
      },
    ],
    example: 'https://www.deezer.com/playlist/…',
    tone: {
      chipOn:
        'border-[#FF0000]/60 bg-[#FF0000]/20 text-[#C20000] dark:text-[#FF7A6B]',
      chipOff:
        'border-[#FF0000]/25 bg-[#FF0000]/5 text-[#C20000] dark:text-[#FF7A6B]',
      panel: 'border-[#FF0000]/30 bg-[#FF0000]/[0.06]',
      step: 'bg-[#FF0000]/20 text-[#C20000] dark:text-[#FF6A57]',
      badge: 'bg-[#FF0000]',
      mark: 'text-[#FF0000]',
      cta: 'bg-[#FF0000] text-white hover:bg-[#E60000]',
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

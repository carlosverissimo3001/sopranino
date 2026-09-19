import {
  ImportPlaylistControllerDtoOriginEnum as Source,
  ImportPlaylistControllerDtoSourceEnum as LinkSourceEnum,
} from '@/sdk';

export { Source as PlaylistSource };

/**
 * The one service a link is read from. Everything else is somewhere a playlist
 * came from, which the player names: there is one mechanism, not one per
 * service, and a copy on Deezer is what the import actually takes.
 */
export const LINK_SOURCE = LinkSourceEnum.Deezer;

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
  /** Hosts whose links belong to this service, so a wrong paste can be named. */
  hosts: string[];
  /** Full class strings, so Tailwind sees every one of them. */
  tone: {
    badge: string;
    mark: string;
  };
}

/** No brand colour of its own: the mark falls back to a plain note. */
const PLAIN = {
  badge: 'bg-fg/40',
  mark: 'text-fg/50',
};

export const PLAYLIST_SOURCES: Record<Source, SourceInfo> = {
  [Source.Deezer]: {
    name: 'Deezer',
    hosts: ['deezer.com', 'link.deezer.com', 'deezer.page.link'],
    tone: { badge: 'bg-[#A238FF]', mark: 'text-[#A238FF]' },
  },
  [Source.Spotify]: {
    name: 'Spotify',
    hosts: ['open.spotify.com'],
    tone: { badge: 'bg-spotify-green', mark: 'text-spotify-green' },
  },
  [Source.AppleMusic]: {
    name: 'Apple Music',
    hosts: ['music.apple.com'],
    tone: { badge: 'bg-[#FA2D48]', mark: 'text-[#FA2D48]' },
  },
  [Source.YoutubeMusic]: {
    name: 'YouTube Music',
    hosts: ['music.youtube.com'],
    tone: { badge: 'bg-[#FF0000]', mark: 'text-[#FF0000]' },
  },
  [Source.Youtube]: {
    name: 'YouTube',
    hosts: ['youtube.com', 'youtu.be'],
    tone: { badge: 'bg-[#FF0000]', mark: 'text-[#FF0000]' },
  },
  [Source.AmazonMusic]: {
    name: 'Amazon Music',
    hosts: ['music.amazon.com', 'music.amazon.co.uk', 'music.amazon.de'],
    tone: { badge: 'bg-[#25D1DA]', mark: 'text-[#25D1DA]' },
  },
  [Source.Tidal]: {
    name: 'Tidal',
    hosts: ['tidal.com', 'listen.tidal.com'],
    tone: PLAIN,
  },
  [Source.Soundcloud]: {
    name: 'SoundCloud',
    hosts: ['soundcloud.com'],
    tone: { badge: 'bg-[#FF5500]', mark: 'text-[#FF5500]' },
  },
  [Source.Pandora]: {
    name: 'Pandora',
    hosts: ['pandora.com'],
    tone: { badge: 'bg-[#3668FF]', mark: 'text-[#3668FF]' },
  },
  [Source.Napster]: {
    name: 'Napster',
    hosts: ['napster.com', 'us.napster.com'],
    tone: PLAIN,
  },
  [Source.Other]: {
    name: 'Other',
    hosts: [],
    tone: PLAIN,
  },
};

/** Deezer first, since its link is what the field takes; "somewhere else" last. */
export const ORIGIN_OPTIONS: Source[] = [
  Source.Deezer,
  Source.Spotify,
  Source.AppleMusic,
  Source.YoutubeMusic,
  Source.Youtube,
  Source.AmazonMusic,
  Source.Tidal,
  Source.Soundcloud,
  Source.Pandora,
  Source.Napster,
  Source.Other,
];

export const TUNEMYMUSIC_URL = 'https://www.tunemymusic.com/';

export const LINK_EXAMPLE = 'https://www.deezer.com/playlist/…';

/**
 * One path for every service, because there is one: a playlist reaches us as a
 * public Deezer link. Only the transfer step is skipped when it is already on
 * Deezer.
 */
export const IMPORT_GUIDE: GuideSlide[] = [
  {
    title: 'In TuneMyMusic, pick Deezer as the destination',
    caption:
      'Start from wherever the playlist is now. Skip ahead if it is already on Deezer.',
    shotOf:
      'TuneMyMusic destination step, with Deezer picked among every service',
    image: 'guides/tmm-spotify-destination.webp',
  },
  {
    title: 'Start the transfer',
    caption: 'Free, up to 500 songs. The copy lands in your Deezer playlists.',
    shotOf: 'TuneMyMusic ready to transfer one playlist to Deezer',
    image: 'guides/tmm-transfer-v2.webp',
  },
  {
    title: 'Open the copy in Deezer',
    caption: 'It lands in your own playlists, named as it was.',
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
    image: 'guides/sopranino-pasted-v3.webp',
  },
];

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
    ORIGIN_OPTIONS.find((source) =>
      PLAYLIST_SOURCES[source].hosts.includes(host),
    ) ?? null
  );
}

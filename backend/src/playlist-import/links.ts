import { PlaylistSource } from '@prisma/client';

export type ParsedPlaylistLink = { externalId: string } | { shortUrl: string };

type Parser = (url: URL) => ParsedPlaylistLink | null;

const host = (url: URL) => url.hostname.replace(/^www\./, '');

export const DEEZER_SHORT_HOSTS = ['link.deezer.com', 'deezer.page.link'];

const PARSERS: Record<PlaylistSource, Parser> = {
  [PlaylistSource.DEEZER]: (url) => {
    if (DEEZER_SHORT_HOSTS.includes(host(url))) {
      return url.pathname.length > 1 ? { shortUrl: url.href } : null;
    }
    if (host(url) !== 'deezer.com') return null;
    const match = /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?playlist\/(\d+)\/?$/i.exec(
      url.pathname,
    );
    return match ? { externalId: match[1] } : null;
  },
  [PlaylistSource.SPOTIFY]: (url) => {
    if (host(url) !== 'open.spotify.com') return null;
    const match = /^\/(?:intl-[a-z-]+\/)?playlist\/([A-Za-z0-9]{22})\/?$/.exec(
      url.pathname,
    );
    return match ? { externalId: match[1] } : null;
  },
  [PlaylistSource.APPLE_MUSIC]: (url) => {
    if (host(url) !== 'music.apple.com') return null;
    const match =
      /^\/[a-z]{2}\/playlist\/(?:[^/]+\/)?(pl\.(?:u-)?[A-Za-z0-9]+)\/?$/.exec(
        url.pathname,
      );
    return match ? { externalId: match[1] } : null;
  },
};

export function parsePlaylistLink(
  source: PlaylistSource,
  link: string,
): ParsedPlaylistLink | null {
  const trimmed = link.trim();
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
  if (hasScheme && !/^https?:\/\//i.test(trimmed)) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(hasScheme ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
  return PARSERS[source]?.(url) ?? null;
}

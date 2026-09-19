import { PlaylistSource } from '@prisma/client';

export type ParsedPlaylistLink = { externalId: string } | { shortUrl: string };

type Parser = (url: URL) => ParsedPlaylistLink | null;

const host = (url: URL) => url.hostname.replace(/^www\./, '');

export const DEEZER_SHORT_HOSTS = ['link.deezer.com', 'deezer.page.link'];

/**
 * The services whose links we read. Only Deezer: every other value of the enum
 * is somewhere a playlist came from, which a player tells us rather than a
 * link, and the import takes the Deezer copy's link either way.
 */
export const LINKED_SOURCES = [PlaylistSource.DEEZER] as const;

export type LinkedSource = (typeof LINKED_SOURCES)[number];

const PARSERS: Record<LinkedSource, Parser> = {
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
  return PARSERS[source as LinkedSource]?.(url) ?? null;
}

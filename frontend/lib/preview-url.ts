/** A signed preview link without its signature: the same song, re-signed, is the same key. */
export function previewKey(url: string | null | undefined): string | null {
  return url ? url.split('?')[0] : null;
}

/** When a signed link stops working, from Deezer's `exp=` field; null if it carries none. */
export function previewExpiry(url: string): number | null {
  const match = /exp=(\d+)/.exec(url);
  return match ? Number(match[1]) * 1000 : null;
}

/** Keep the link already in use unless the song changed or that link is about to expire. */
export function keepPreviewUrl(
  current: string | null | undefined,
  next: string | null | undefined,
  now = Date.now(),
): string | null | undefined {
  if (!current || !next || previewKey(current) !== previewKey(next)) {
    return next;
  }
  const expiry = previewExpiry(current);
  return expiry !== null && expiry - now < 60_000 ? next : current;
}

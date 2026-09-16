/**
 * Strip common version suffixes from a track name so "With Or Without You - Live From Paris"
 * or "Song (Remix)" matches the base "With Or Without You" / "Song".
 */
export function normalizeTrackNameForMatch(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }
  let s = value.trim();
  // Strip trailing parenthetical e.g. "(Remix)", "(Live)", "(Single Version)", "(Radio Edit)"
  s = s.replace(/\s*\([^)]*\)\s*$/i, '').trim();
  // Strip trailing " - ..." e.g. " - Live From Paris", " - Single Version", " - Remix"
  s = s.replace(/\s+-\s+.*$/, '').trim();
  // One more pass for "Title (Year Remaster) - Live"
  s = s.replace(/\s*\([^)]*\)\s*$/i, '').trim();
  // Trailing punctuation, which stripping a suffix can leave on one side only:
  // "I Knew You Were Trouble." against "I Knew You Were Trouble (Taylor's
  // Version)" differs by a single full stop once the parenthetical is gone.
  s = s.replace(/[.,!?;:]+$/, '').trim();
  return normalizeText(s);
}

/**
 * Normalize text for search/matching: NFC, collapse Unicode spaces, and rebuild
 * "spaced-out" words (e.g. "M a k e   I t" from weird fonts) into "Make It".
 */
export function normalizeText(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }
  // 1. Unicode NFC and replace any space-like/control chars with normal space
  const withNormalSpaces = value
    .normalize('NFC')
    .replace(/[\s\u00A0\u2000-\u200B\u202F\u205F\u3000\uFEFF]+/g, ' ')
    .trim();
  if (!withNormalSpaces) {
    return '';
  }
  // 2. Split on spaces
  const tokens = withNormalSpaces.split(/\s+/);
  // 3. Rebuild words: consecutive single-char tokens → one word; multi-char stays as word
  const words: string[] = [];
  let current: string[] = [];
  for (const t of tokens) {
    if (t.length === 1) {
      current.push(t);
    } else {
      if (current.length) {
        words.push(current.join(''));
        current = [];
      }
      words.push(t);
    }
  }
  if (current.length) {
    words.push(current.join(''));
  }
  return words.join(' ');
}

export function compareText(a: string, b: string): boolean {
  return normalizeText(a.toLowerCase()) === normalizeText(b.toLowerCase());
}

export function normalizeLoose(value: string): string {
  return normalizeText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

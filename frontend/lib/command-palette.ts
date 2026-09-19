const OPEN_EVENT = 'sopranino:open-command-palette';

/** For a button that opens the palette; the keyboard shortcut needs none. */
export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onOpenCommandPalette(listener: () => void): () => void {
  window.addEventListener(OPEN_EVENT, listener);
  return () => window.removeEventListener(OPEN_EVENT, listener);
}

const RECENT_KEY = 'unpaused:palette-recent';
const RECENT_LIMIT = 5;

export interface RecentPick {
  id: string;
  label: string;
  href: string;
}

export function readRecent(): RecentPick[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.slice(0, RECENT_LIMIT) : [];
  } catch {
    return [];
  }
}

export function rememberPick(pick: RecentPick) {
  try {
    const rest = readRecent().filter((recent) => recent.id !== pick.id);
    localStorage.setItem(
      RECENT_KEY,
      JSON.stringify([pick, ...rest].slice(0, RECENT_LIMIT)),
    );
  } catch {
    // A private window without storage just has no recents.
  }
}

export function forgetPick(id: string): RecentPick[] {
  const rest = readRecent().filter((recent) => recent.id !== id);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(rest));
  } catch {
    // Nothing stored, so nothing to forget.
  }
  return rest;
}

export function clearRecent() {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    // As above.
  }
}

/** A field the player is typing into, the guess box above all. */
export function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

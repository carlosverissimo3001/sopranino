const ASKED_KEY = 'unpaused:name-prompt-asked';
const SIGNUP_SNOOZE_KEY = 'unpaused:signup-prompt-snoozed-until';
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

/** Which user we last asked for a name. Per-user, not per-browser: clearing
    cookies gives the same browser a new identity, and that one was not asked. */
export function readAskedUserId(): string | null {
  try {
    return localStorage.getItem(ASKED_KEY);
  } catch {
    return null;
  }
}

export function writeAskedUserId(userId: string): void {
  try {
    localStorage.setItem(ASKED_KEY, userId);
  } catch {
    // A blocked store only costs us the prompt opening again.
  }
}

export function signUpSnoozed(): boolean {
  try {
    const until = Number(localStorage.getItem(SIGNUP_SNOOZE_KEY));
    return until > Date.now();
  } catch {
    return false;
  }
}

export function snoozeSignUp(): void {
  try {
    localStorage.setItem(SIGNUP_SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
  } catch {
    // Same trade as above: the offer comes back on the next reveal.
  }
}

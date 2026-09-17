const SIGNUP_SNOOZE_KEY = 'unpaused:signup-prompt-snoozed-until';
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

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
    // A blocked store only costs us the offer coming back on the next reveal.
  }
}

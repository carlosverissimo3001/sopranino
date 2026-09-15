/** Named throttler for the guess endpoint */
export const THROTTLE_GUESS = 'guess';
/** Named throttler for the search endpoint */
export const THROTTLE_SEARCH = 'search';
/** Named throttler for the public demo endpoints */
export const THROTTLE_DEMO = 'demo';

/** Sliding window duration in milliseconds (1 minute) */
export const THROTTLE_TTL = 60_000;

/** Max guesses per minute per session */
export const THROTTLE_GUESS_LIMIT = 60;
/** Max search requests per minute per session */
export const THROTTLE_SEARCH_LIMIT = 60;

/**
 * Per IP, not per session: the demo endpoints are public, so there is no
 * session to key on. One limit covers the controller; both routes are a DB
 * read plus a Redis write against a fixed pool.
 */
export const THROTTLE_DEMO_LIMIT = 60;

/**
 * High default limit for the module-level throttlers.
 * Route-level @Throttle() decorators override this with tighter limits.
 * This ensures non-decorated routes are effectively unthrottled.
 */
export const THROTTLE_DEFAULT_LIMIT = 500;

/** Named throttler for round start */
export const THROTTLE_START = 'start';
/**
 * Per IP, not per session: a caller without one has a user minted for them, so
 * this is what keeps a crawler from filling the table.
 */
export const THROTTLE_START_LIMIT = 40;

/** Named throttler for avatar upload */
export const THROTTLE_AVATAR = 'avatar';
/**
 * Per session. Spotify's five-user cap used to be the rate limit here; anyone
 * can mint a session now, and every upload spends third-party quota.
 */
export const THROTTLE_AVATAR_LIMIT = 5;

/** Named throttler for player reports */
export const THROTTLE_FEEDBACK = 'feedback';

/** Per IP: guests can send them, and a person has no reason to send more. */
export const THROTTLE_FEEDBACK_LIMIT = 5;

/** Named throttler for signup and login */
export const THROTTLE_CREDENTIALS = 'credentials';

/**
 * Per IP and deliberately tight: these are the only routes where guessing a
 * value repeatedly is worth anything.
 */
export const THROTTLE_CREDENTIALS_LIMIT = 10;

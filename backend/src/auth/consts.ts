export const MS_IN_SECOND = 1000;
export const MS_IN_MINUTE = 60 * MS_IN_SECOND;
export const MS_IN_HOUR = 60 * MS_IN_MINUTE;

export const SCOPES = [
  'user-read-private', // User profile info
  'playlist-read-private', // Access user's playlists
  'playlist-read-collaborative', // Access collaborative playlists
  'user-library-read', // Access liked songs
];

/** A verification link is good for a day. Nothing is at stake in a stale one. */
export const EMAIL_VERIFICATION_TTL_SECONDS = 24 * 60 * 60;

/**
 * One mail per address per minute, and no more than a handful a day. The
 * minute stops someone being mail-bombed; the daily cap is what keeps a script
 * from burning the provider's 100-a-day allowance on one inbox.
 */
export const EMAIL_SEND_COOLDOWN_SECONDS = 60;
export const EMAIL_SEND_DAILY_LIMIT = 5;
export const EMAIL_SEND_DAY_SECONDS = 24 * 60 * 60;

export const EMAIL_COOLDOWN_PREFIX = 'mail:cooldown:';
export const EMAIL_DAILY_PREFIX = 'mail:daily:';

export const PASSWORD_RESET_TTL_SECONDS = 60 * 60;
export const EMAIL_CHANGE_TTL_SECONDS = 24 * 60 * 60;

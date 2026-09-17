/** Past this a playlist is refused rather than cut, so a set is never a surprise subset. */
export const IMPORT_MAX_TRACKS = 500;

/** Imports and refreshes share it: both cost the service a read. */
export const IMPORT_DAILY_LIMIT = 10;
export const IMPORT_DAILY_TTL_SECONDS = 24 * 60 * 60;
export const importDailyKey = (userId: string) => `import:daily:${userId}`;

/** So the day cannot be spent on one playlist in a row. */
export const REFRESH_COOLDOWN_SECONDS = 10 * 60;
export const refreshCooldownKey = (userId: string, trackGroupId: string) =>
  `import:refresh:${userId}:${trackGroupId}`;

export const IMPORT_REFRESH_AFTER_MS = 60 * 60 * 1000;

export const IMPORT_QUEUE_CEILING = 20;

export const importSlug = (source: string, externalId: string) =>
  `${source.toLowerCase().replace(/_/g, '-')}-${externalId}`;

/** DEEZER */
export const DEEZER_API = 'https://api.deezer.com';
export const DEEZER_PACE_MS = 120;
export const DEEZER_QUOTA_ERROR = 4;

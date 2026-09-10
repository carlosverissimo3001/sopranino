import { JobsOptions } from 'bullmq';

export const SESSION_COOKIE_NAME = 'unpaused_session';

/** Outlives the session so an anonymous player keeps their row and streak. */
export const DEVICE_COOKIE_NAME = 'unpaused_device';
export const DEVICE_TOKEN_TTL = 365 * 24 * 60 * 60; // 1 year in seconds
export const DEVICE_TOKEN_PREFIX = 'device:';

/** Ties an OAuth callback to the browser that started the flow. */
export const OAUTH_STATE_COOKIE_NAME = 'unpaused_oauth_state';
export const OAUTH_STATE_TTL = 600; // 10 minutes, matching the PKCE state
export const TRACK_PREVIEW_CACHE_TTL = 86400; // 24 hours in seconds
export const TRACK_PREVIEW_CACHE_PREFIX = 'track_preview:';
export const LIKED_SONGS_ID_SUFFIX = '-liked-songs';

// Playlist & Spotify caching
export const PLAYLIST_CACHE_PREFIX = 'playlists:';
export const PLAYLIST_META_CACHE_PREFIX = 'playlist_meta:';
export const LIKED_META_CACHE_PREFIX = 'liked_meta:';
export const PLAYLIST_TRACKS_CACHE_PREFIX = 'playlist_tracks:';
export const LIKED_TRACKS_CACHE_PREFIX = 'liked_tracks:';
export const PLAYLIST_TOTAL_TRACKS_PREFIX = 'playlist_total:';
export const PLAYLIST_CACHE_TTL = 5 * 60 * 60; // 5 hours
export const TRACK_BATCH_CACHE_TTL = 5 * 60 * 60;

// Job Constants
export const AGE_TO_KEEP_JOBS = 3 * 24 * 60 * 60; // 3 days in seconds
export const MAX_JOB_HISTORY = 500; // Max number of completed/failed jobs to keep in Redis

// Queues
export const GAME_CLEANUP_QUEUE = 'game-cleanup';
export const CHART_REFRESH_QUEUE = 'chart-refresh';
export const DAILY_TRACK_QUEUE = 'daily-track';

// Jobs
export const CLEAN_UP_ABANDONED_GAMES_JOB = 'abandoned-games-task';
export const REFRESH_CHARTS_JOB = 'refresh-charts';
export const FILL_DAILY_TRACK_JOB = 'fill-daily-track';
export const JOB_OPTIONS_WITH_BACKOFF: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000,
  },
  removeOnComplete: {
    age: AGE_TO_KEEP_JOBS,
    count: MAX_JOB_HISTORY,
  },
};

export type JobDataMap = {
  [CLEAN_UP_ABANDONED_GAMES_JOB]: Record<string, never>;
  [REFRESH_CHARTS_JOB]: Record<string, never>;
  [FILL_DAILY_TRACK_JOB]: Record<string, never>;
};

export type JobNames = keyof JobDataMap;

export const GAME_MAX_ROUNDS = 6;

/** The track pool only changes when it is reseeded, so this can be long. */
export const POOL_CANDIDATE_CACHE_MS = 10 * 60 * 1000;

/** Selection weight multiplies by this for every decade after the pivot. */
export const RECENCY_PER_DECADE = 1.8;
export const RECENCY_PIVOT_YEAR = 2005;

// Track pool — what a player without a Spotify library plays from.
export const POOL_PLAYLIST_ID = 'pool';

/** Unreachable with an app token: every playlist 401s. Replaced in CAR-177. */
export const POOL_PLAYLIST_IDS: string[] = [
  '37i9dQZEVXbKyJS56d1pgi',
  '37i9dQZEVXbNFJfN1Vw8d9',
  '37i9dQZEVXbLnolsZ8PSNw',
  '37i9dQZEVXbLRQDuF5jeBp',
  '37i9dQZEVXbMDoHDwVN2tF',
];

export const POOL_PLAYLIST_TRACKS_CACHE_PREFIX = 'pool:playlist_tracks:';
export const POOL_PLAYLIST_TRACKS_CACHE_TTL = 6 * 60 * 60;

export const POOL_MAX_PREVIEW_ATTEMPTS = 10;

// Multiplayer room state (Redis-backed so it survives a restart and is shared across instances)
export const ROOM_PRESENCE_PREFIX = 'room:presence:';
/** Sorted set of roomId -> host-disconnect deadline, so the sweep is a range query and ZREM is the atomic claim. */
export const ROOM_HOST_GONE_KEY = 'room:host-gone';

/**
 * Set once the room has been told its host is gone. Without it a host who comes
 * back after the grace lapses is never announced, and the room stays stuck on
 * "host disconnected" with no way to recover.
 */
export const ROOM_HOST_ANNOUNCED_PREFIX = 'room:host-announced:';
export const ROOM_HOST_ANNOUNCED_TTL = 60 * 60;

/**
 * A member is online while their last heartbeat is inside this window. It must
 * comfortably exceed ROOM_HEARTBEAT_MS or a slow round-trip reads as a leave.
 */
export const ROOM_PRESENCE_STALE_MS = 45 * 1000;
export const ROOM_HEARTBEAT_MS = 15 * 1000;

/** Outlives the staleness window so a dead instance's members lapse, not linger. */
export const ROOM_PRESENCE_TTL = 5 * 60;

/** Grace for a page refresh before the room is told its host is gone. */
export const ROOM_HOST_GONE_GRACE_MS = 5 * 1000;

/**
 * Sorted set of "roomId:userId" -> when the seat is forfeit. Closing a tab and
 * refreshing look identical to the server, so a seat is only given up after
 * long enough that it cannot have been a refresh.
 */
export const ROOM_PLAYER_GONE_KEY = 'room:player-gone';
export const ROOM_PLAYER_GONE_GRACE_MS = 20 * 1000;
export const ROOM_SWEEP_INTERVAL_MS = 2 * 1000;

/**
 * How many findable rooms the lobby considers. Presence is checked per room,
 * so this bounds the Redis round trips as much as the list length.
 */
export const LOBBY_MAX_ROOMS = 30;

/** Socket room every lobby browser sits in. */
export const LOBBY_ROOM = 'lobby';

/**
 * How long a lobby change waits for its neighbours. A room filling fires
 * several events in a second, and watchers want one update, not four.
 */
export const LOBBY_BROADCAST_DEBOUNCE_MS = 300;

/**
 * Seats in a room. A product decision rather than a limit anything technical
 * imposes: the roster and scoreboard were not drawn for a crowd, and per-round
 * socket fan-out is quadratic in the number of players.
 */
export const ROOM_MAX_PLAYERS = 20;

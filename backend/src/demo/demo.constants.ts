/**
 * Public, unauthenticated demo used by carlosverissimo.com.
 *
 * Isolated from the real game on purpose: no session, no cookie, no Spotify
 * OAuth, no user library. The portfolio is a different origin, so a session
 * cookie there would be a third-party cookie. Rounds are keyed by an opaque id
 * returned in the response body instead.
 */

export type DemoPlaylist = {
  /**
   * Stable key used by the API and by carlosverissimo.com. The portfolio sends
   * these, so they outlive whatever the rounds are drawn from.
   */
  slug: string;
  name: string;
  /** The chart group this reads, by its TrackGroup name. */
  chart: string;
};

export const DEMO_PLAYLISTS: DemoPlaylist[] = [
  { slug: 'pt', name: 'Top 50 Portugal', chart: 'Portugal' },
  { slug: 'es', name: 'Top 50 Spain', chart: 'Spain' },
  { slug: 'uk', name: 'Top 50 UK', chart: 'UK' },
  { slug: 'us', name: 'Top 50 USA', chart: 'USA' },
  { slug: 'global', name: 'Top 50 Global', chart: 'Worldwide' },
];

export const DEMO_OPTION_COUNT = 4;

/**
 * Seconds of audio unlocked per attempt, one step per option.
 *
 * The count has to match DEMO_OPTION_COUNT: with four options a player can be
 * wrong at most three times before the last one is forced, so any further
 * steps are unreachable and the attempt counter would promise rounds that
 * cannot happen. The durations are more generous than the real game's
 * ROUND_DURATIONS, since demo players are guessing against a chart they may
 * not know rather than their own library.
 */
export const DEMO_SNIPPET_STEPS = [1, 2, 4, 8];

/**
 * How many tracks a round tries before giving up on finding playable audio.
 * Previews are minted per round, so a chart entry whose audio has gone is
 * worth skipping rather than serving a silent round.
 */
export const DEMO_PREVIEW_ATTEMPTS = 5;

export const DEMO_ROUND_PREFIX = 'demo:round:';

/** Long enough to finish a round, short enough that abandoned ones evaporate. */
export const DEMO_ROUND_TTL_SECONDS = 900;

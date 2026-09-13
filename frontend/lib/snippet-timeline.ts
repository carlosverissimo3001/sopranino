/** Mirrors ROUND_DURATIONS in the backend's game consts. */
export const SNIPPET_STEPS = [0.1, 1, 2, 4, 7, 12] as const;

export const FULL_SNIPPET = SNIPPET_STEPS[SNIPPET_STEPS.length - 1];

/**
 * How much of the song a round revealed.
 *
 * Every round replays from the same offset and simply runs longer, so round 2
 * is one second of the song, not the 0.1 plus a second.
 */
export function snippetSeconds(round: number): number {
  const index = Math.min(Math.max(round, 1), SNIPPET_STEPS.length) - 1;
  return SNIPPET_STEPS[index];
}

/** "0.1s" rather than "0.1000000000001s". */
export function formatSeconds(seconds: number): string {
  return `${Number.isInteger(seconds) ? seconds : seconds.toFixed(1)}s`;
}

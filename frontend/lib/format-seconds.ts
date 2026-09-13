/** "0.1s" rather than "0.1000000000001s". */
export function formatSeconds(seconds: number): string {
  return `${Number.isInteger(seconds) ? seconds : seconds.toFixed(1)}s`;
}

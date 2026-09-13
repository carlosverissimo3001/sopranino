import {
  FULL_SNIPPET,
  SNIPPET_STEPS,
  formatSeconds,
  snippetSeconds,
} from './snippet-timeline';

describe('snippetSeconds', () => {
  it('is the length of the round that just played, not a running total', () => {
    // Every round replays from the same offset, so round 2 is one second of
    // the song and already contains round 1's tenth.
    expect(snippetSeconds(1)).toBe(0.1);
    expect(snippetSeconds(2)).toBe(1);
    expect(snippetSeconds(3)).toBe(2);
  });

  it('reaches the full snippet on the last round', () => {
    expect(snippetSeconds(SNIPPET_STEPS.length)).toBe(FULL_SNIPPET);
    expect(FULL_SNIPPET).toBe(12);
  });

  it('clamps either side of a real round', () => {
    expect(snippetSeconds(0)).toBe(0.1);
    expect(snippetSeconds(-3)).toBe(0.1);
    expect(snippetSeconds(99)).toBe(FULL_SNIPPET);
  });
});

describe('formatSeconds', () => {
  it('keeps the tenth that makes the first round different from the second', () => {
    expect(formatSeconds(0.1)).toBe('0.1s');
    expect(formatSeconds(1)).toBe('1s');
    expect(formatSeconds(12)).toBe('12s');
  });

  it('rounds away floating point noise', () => {
    expect(formatSeconds(0.1000000000001)).toBe('0.1s');
  });
});

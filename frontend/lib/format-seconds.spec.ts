import { formatSeconds } from './format-seconds';

describe('formatSeconds', () => {
  it('keeps a whole second whole', () => {
    expect(formatSeconds(12)).toBe('12s');
  });

  it('rounds away floating point noise', () => {
    expect(formatSeconds(0.1000000000001)).toBe('0.1s');
  });
});

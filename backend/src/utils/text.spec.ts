import { normalizeLoose } from './text';

describe('normalizeLoose', () => {
  it('folds case', () => {
    expect(normalizeLoose('Taylor Swift')).toBe('taylor swift');
  });

  it('folds accents, so Beyonce and Beyoncé key the same', () => {
    expect(normalizeLoose('Beyoncé')).toBe(normalizeLoose('Beyonce'));
  });

  it('drops punctuation', () => {
    expect(normalizeLoose('Tyler, the Creator!')).toBe('tyler the creator');
  });

  it('collapses and trims whitespace', () => {
    expect(normalizeLoose('  Daft   Punk \n')).toBe('daft punk');
  });

  it('keeps digits, which are part of plenty of names', () => {
    expect(normalizeLoose('Blink-182')).toBe('blink 182');
  });

  it('rebuilds spaced-out words, inheriting normalizeText', () => {
    expect(normalizeLoose('D A F T P U N K')).toBe('daftpunk');
  });

  it('is empty when nothing is left to key on', () => {
    expect(normalizeLoose('!!!')).toBe('');
  });
});

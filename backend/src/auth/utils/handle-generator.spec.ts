import {
  generateName,
  isGeneratedHandle,
  ADJECTIVES,
  NOUNS,
} from './handle-generator';

// ── Tests ────────────────────────────────────────────────────────────

describe('generateName', () => {
  it('returns two words drawn from the word lists', () => {
    const [adjective, noun, ...rest] = generateName().split(' ');

    expect(rest).toHaveLength(0);
    expect(ADJECTIVES).toContain(adjective);
    expect(NOUNS).toContain(noun);
  });

  it('does not always return the same handle', () => {
    const handles = new Set(Array.from({ length: 50 }, () => generateName()));

    expect(handles.size).toBeGreaterThan(1);
  });
});

describe('isGeneratedHandle', () => {
  it('recognises a name we made up', () => {
    expect(isGeneratedHandle(generateName())).toBe(true);
  });

  it('leaves a chosen name alone', () => {
    expect(isGeneratedHandle('Carlos')).toBe(false);
    expect(isGeneratedHandle('Vinyl Chorus Extra')).toBe(false);
    expect(isGeneratedHandle('Neon Person')).toBe(false);
  });
});

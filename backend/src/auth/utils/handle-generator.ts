export const ADJECTIVES = [
  'Acoustic',
  'Analog',
  'Brass',
  'Distant',
  'Electric',
  'Golden',
  'Hazy',
  'Loud',
  'Midnight',
  'Neon',
  'Quiet',
  'Reverb',
  'Slow',
  'Static',
  'Sunlit',
  'Velvet',
  'Vinyl',
  'Warm',
] as const;

export const NOUNS = [
  'Bassline',
  'Bridge',
  'Chorus',
  'Crescendo',
  'Demo',
  'Encore',
  'Fader',
  'Hook',
  'Intro',
  'Needle',
  'Outro',
  'Refrain',
  'Riff',
  'Sample',
  'Sleeve',
  'Tempo',
  'Verse',
  'Vocal',
] as const;

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function generateName(): string {
  return `${pick(ADJECTIVES)} ${pick(NOUNS)}`;
}

/**
 * Whether a name is still one we made up, so a real one may replace it. A name
 * the player chose is theirs, even if they happened to choose "Vinyl Chorus".
 */
export function isGeneratedHandle(name: string): boolean {
  const [adjective, noun, ...rest] = name.trim().split(' ');
  if (rest.length || !adjective || !noun) {
    return false;
  }
  return (
    (ADJECTIVES as readonly string[]).includes(adjective) &&
    (NOUNS as readonly string[]).includes(noun)
  );
}

/** Shared frosted-glass card style used across game UI components. */
export const GLASS_STYLE = {
  background: 'rgb(var(--surface) / 0.5)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)' as const,
  border: '1px solid rgb(var(--fg) / 0.1)',
} as const;

/**
 * The same card over a flat background. Blurring a uniform colour gives that
 * colour back, so the filter there costs a compositing pass on every paint and
 * changes nothing on screen — use this wherever nothing sits behind the card.
 */
export const SOLID_SURFACE_STYLE = {
  background: GLASS_STYLE.background,
  border: GLASS_STYLE.border,
} as const;

/** One hover glow for every card, whatever its cover looks like. */
export const CARD_SHADOW =
  'shadow-[0_10px_30px_-15px_rgba(0,0,0,0.3)] transition-shadow hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.6),0_0_20px_rgba(30,215,96,0.12)]';

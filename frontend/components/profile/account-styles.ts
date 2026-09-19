export const FIELD =
  'w-full rounded-full border border-fg/10 bg-fg/5 px-4 py-2.5 text-sm text-fg placeholder:text-fg/30 focus:border-spotify-green/50 focus:outline-none transition-colors';

const ACTION_BASE =
  'cursor-pointer text-xs font-semibold transition-colors disabled:cursor-default disabled:opacity-50';

export const ACTION = `${ACTION_BASE} text-fg/50 hover:text-fg aria-expanded:text-fg`;

export const ACTION_WARN = `${ACTION_BASE} text-amber-300 hover:text-amber-200`;

export const SUBMIT =
  'cursor-pointer rounded-full bg-spotify-green px-5 py-2 text-xs font-black text-black transition-opacity disabled:cursor-default disabled:opacity-50';

export const CANCEL =
  'cursor-pointer text-[11px] text-fg/40 underline underline-offset-4 hover:text-fg/70';

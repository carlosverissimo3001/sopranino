const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['second', 60],
  ['minute', 60],
  ['hour', 24],
  ['day', 7],
  ['week', 4.35],
  ['month', 12],
];

const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/** "5 minutes ago", for a moment in the past. */
export function timeAgo(when: Date): string {
  let amount = (Date.now() - when.getTime()) / 1000;
  for (const [unit, step] of UNITS) {
    if (amount < step) {
      return formatter.format(-Math.round(amount), unit);
    }
    amount /= step;
  }
  return formatter.format(-Math.round(amount), 'year');
}

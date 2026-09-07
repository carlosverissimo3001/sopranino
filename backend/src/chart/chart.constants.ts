/**
 * The country charts, as Deezer publishes them: ordinary public playlists on
 * the "Deezer Charts" account, a hundred tracks each, rebuilt daily by Deezer.
 */
export type ChartSource = {
  /** Stable key, and the group's slug. */
  slug: string;
  name: string;
  playlistId: string;
};

export const CHARTS: ChartSource[] = [
  { slug: 'top-worldwide', name: 'Worldwide', playlistId: '3155776842' },
  { slug: 'top-usa', name: 'USA', playlistId: '1313621735' },
  { slug: 'top-uk', name: 'UK', playlistId: '1111142221' },
  { slug: 'top-portugal', name: 'Portugal', playlistId: '1362519755' },
  { slug: 'top-spain', name: 'Spain', playlistId: '1116190041' },
  { slug: 'top-brazil', name: 'Brazil', playlistId: '1111141961' },
];

/** How much of each chart is taken. Deezer publishes a hundred. */
export const CHART_SIZE = 50;

export const CHART_REFRESH_CRON = '0 6 * * 1';
export const CHART_REFRESH_TZ = 'Europe/Lisbon';

/** Deezer allows roughly 50 requests per 5s; this stays well under. */
export const CHART_PACE_MS = 120;

import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-url';
import { listPublicTrackGroups } from '@/lib/track-groups-server';

/** Every route robots.ts allows, and nothing that redirects a signed out visitor. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  // Only the kinds a visitor with no session may see, so the special group
  // stays out of it.
  const groups = await listPublicTrackGroups();

  return [
    { url: SITE_URL, lastModified, changeFrequency: 'monthly', priority: 1 },
    {
      url: `${SITE_URL}/about`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/speed-run/leaderboard`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.5,
    },
    ...groups.map((group) => ({
      url: `${SITE_URL}/group/${group.slug}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}

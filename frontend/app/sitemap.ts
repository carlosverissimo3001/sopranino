import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-url';

/** Every route robots.ts allows, and nothing that redirects a signed out visitor. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
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
  ];
}

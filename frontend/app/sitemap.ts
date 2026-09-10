import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-url';

/**
 * Every route robots.ts allows, and nothing that redirects a signed out
 * visitor. The speed-run leaderboard is public in spirit but sits under
 * /speed-run, which needs a session, so it would only offer Google a redirect.
 */
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
  ];
}

import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-url';

// An allow list, because a disallow rule naming a private path would publish
// it. Everything not listed here is blocked without being named. Google takes
// the longest match, so these win over the catch-all below them.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: [
        '/$',
        '/about',
        '/speed-run/leaderboard',
        // One page per curated set, all of them in the sitemap. A private
        // group is not listed and answers 404 to a crawler anyway.
        '/group/',
        // Named in the Sitemap line below, so it has to be readable as well.
        '/sitemap.xml',
        // Referenced from every page's metadata; blocked, the card has no art.
        '/opengraph-image',
        '/icon',
        '/apple-icon',
      ],
      disallow: '/',
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

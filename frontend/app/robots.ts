import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-url';

// An allow list, because a disallow rule naming a private path would publish
// it. Everything not listed here is blocked without being named. Google takes
// the longest match, so these win over the catch-all below them.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/$', '/about'],
      disallow: '/',
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

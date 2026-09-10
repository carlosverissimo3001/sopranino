import { SITE_URL } from '@/lib/site-url';

/**
 * Next's metadata API has no JSON-LD, so it goes in as a script tag. Rendered
 * from a server component, or it never reaches the HTML a crawler reads.
 */
export function StructuredData() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Sopranino',
    url: SITE_URL,
    applicationCategory: 'GameApplication',
    operatingSystem: 'Any',
    description:
      'A music guessing game. Hear a tenth of a second of a song and name it, with six tries and a longer snippet after every miss. Play your own Spotify playlists or a curated pool of decades, genres and weekly country charts.',
    // Free, and said in the way a search engine understands it.
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
    author: {
      '@type': 'Person',
      name: 'Carlos Veríssimo',
      url: 'https://carlosverissimo.com',
    },
  };

  return (
    <script
      type="application/ld+json"
      // The payload is ours, not user input, and JSON.stringify escapes it.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

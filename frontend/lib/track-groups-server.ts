import type { TrackGroupDto } from '@/sdk';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * The kinds a visitor with no session may see. SPECIAL is deliberately absent:
 * the server only shows it to a trusted linked account, and it must never
 * reach a sitemap or a generated route.
 */
const PUBLIC_TYPES = ['DECADE', 'GENRE', 'CHART'] as const;

/** Groups are reseeded rarely, so a build-time list with a daily revalidate. */
const REVALIDATE_SECONDS = 60 * 60 * 24;

export async function listPublicTrackGroups(): Promise<TrackGroupDto[]> {
  const results = await Promise.all(
    PUBLIC_TYPES.map(async (type) => {
      try {
        const res = await fetch(`${API_BASE}/track-groups?type=${type}`, {
          next: { revalidate: REVALIDATE_SECONDS },
        });
        if (!res.ok) return [];
        return (await res.json()) as TrackGroupDto[];
      } catch {
        // A sitemap missing a page beats a build that cannot produce one.
        return [];
      }
    }),
  );

  return results.flat();
}

export async function findPublicTrackGroup(
  slug: string,
): Promise<TrackGroupDto | undefined> {
  const groups = await listPublicTrackGroups();
  return groups.find((group) => group.slug === slug);
}

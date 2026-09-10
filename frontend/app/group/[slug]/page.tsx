import type { Metadata } from 'next';
import type { TrackGroupDto } from '@/sdk';
import {
  findPublicTrackGroup,
  listPublicTrackGroups,
} from '@/lib/track-groups-server';
import { GroupGameClient } from './GroupGameClient';

interface GroupPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * What somebody would type to look for this. A decade and a genre want
 * different phrasing, and the group's own name is the only part worth
 * repeating in both.
 *
 * Sentence case throughout: the names carry their own casing - "Hip hop",
 * "R&B & soul" - and title casing around them reads as a mistake.
 */
function describe(group: TrackGroupDto): {
  title: string;
  description: string;
} {
  const tracks = `${group.trackCount} songs`;

  switch (group.type) {
    case 'DECADE':
      return {
        title: `Guess ${group.name} songs`,
        description: `A music guessing game for the ${group.name}. Hear a tenth of a second of one of ${tracks} and name it, with six tries and a longer snippet after every miss. No account needed.`,
      };
    case 'CHART':
      return {
        title: `Guess the ${group.name} chart`,
        description: `Guess this week's ${group.name} chart from a tenth of a second. ${tracks}, six tries, a longer snippet after every miss. No account needed.`,
      };
    default:
      return {
        title: `Guess ${group.name} songs`,
        description: `A ${group.name.toLowerCase()} music guessing game. Hear a tenth of a second of one of ${tracks} and name it, with six tries and a longer snippet after every miss. No account needed.`,
      };
  }
}

/** SPECIAL groups are absent from the public list, so none is ever built. */
export async function generateStaticParams() {
  const groups = await listPublicTrackGroups();
  return groups.map((group) => ({ slug: group.slug }));
}

export async function generateMetadata({
  params,
}: GroupPageProps): Promise<Metadata> {
  const { slug } = await params;
  const group = await findPublicTrackGroup(slug);

  if (!group) {
    return {};
  }

  const { title, description } = describe(group);
  const url = `/group/${group.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function GroupGamePage({ params }: GroupPageProps) {
  const { slug } = await params;
  const group = await findPublicTrackGroup(slug);

  // A private group is not missing, but saying so would confirm it exists.
  // The client still resolves it for whoever is allowed to see it.
  if (!group) {
    return <GroupGameClient />;
  }

  // The heading goes through the game rather than above it: a banner over the
  // game's own chrome belonged to nothing on the page.
  return <GroupGameClient heading={describe(group).title} />;
}

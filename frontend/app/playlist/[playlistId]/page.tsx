import { permanentRedirect } from 'next/navigation';
import { spotifySetPath } from '@/lib/set-routes';

interface PlaylistPageProps {
  params: Promise<{ playlistId: string }>;
}

/** Every set opens at /group now. Links to this one are already out there. */
export default async function PlaylistGamePage({ params }: PlaylistPageProps) {
  const { playlistId } = await params;
  permanentRedirect(spotifySetPath(playlistId));
}

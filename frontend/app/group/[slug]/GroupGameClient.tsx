'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ShuffleGamePage } from '@/components/game/ShuffleGamePage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  isNotFound,
  useTrackGroupBySlug,
} from '@/hooks/track-groups/useTrackGroups';
import { groupHasFameTiers } from '@/lib/fame-tier';
import { useMe } from '@/hooks/auth/useMe';
import { setAuthReturnUrl } from '@/lib/auth-return';
import { spotifyPlaylistIdFrom } from '@/lib/set-routes';
import { useMyPlaylistLibrary } from '@/hooks/playlists/useMyPlaylistLibrary';

/**
 * The slug is what is shareable; the id is what starts a round. Resolving one
 * to the other here keeps the id out of the URL, so a link survives the pool
 * being reseeded.
 */
export function GroupGameClient({ heading }: { heading?: string }) {
  // Read once: picking another set rewrites the URL, and following it here
  // would restart the round on the set just picked.
  const params = useParams();
  const [slug] = useState(params.slug as string);
  // A Spotify playlist is not a track group: its songs are read live with the
  // player's own token. Same route, same page, different source.
  const spotifyPlaylistId = spotifyPlaylistIdFrom(slug);
  const { data: library } = useMyPlaylistLibrary();
  const playlistName = spotifyPlaylistId
    ? library?.items.find((item) => item.id === spotifyPlaylistId)?.name
    : undefined;
  // By slug rather than by searching a list: the list is one kind of group at
  // a time, so a special one was never in the one this page happened to ask
  // for.
  const {
    data: group,
    isPending,
    error,
    refetch,
  } = useTrackGroupBySlug(slug, { enabled: !spotifyPlaylistId });
  const {
    data: user,
    isPending: userPending,
    error: userError,
    refetch: refetchUser,
  } = useMe();
  const missing = isNotFound(error);

  if (spotifyPlaylistId) {
    return (
      <ShuffleGamePage
        canSignIn={false}
        syncUrl
        heading={playlistName ?? heading}
        initialPlaylistId={spotifyPlaylistId}
        initialPlaylistName={playlistName}
        // A playlist's songs are its own, so there is no pool to draw a
        // difficulty from.
        initialTiersApply={false}
      />
    );
  }

  if (isPending || (missing && userPending)) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="md" />
      </main>
    );
  }

  // A special set is only there for a linked account, so whoever it was made
  // for may simply not be signed in on this device. Every missing slug says
  // this to them, so it gives away nothing about which ones exist.
  // Only a real "no such set", and only once we know who is asking: a failed
  // request is not a reason to sign in.
  if ((error && !missing) || (missing && userError)) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black tracking-tight text-fg">
            Could not load this collection
          </h1>
          <p className="max-w-sm text-sm text-fg/50">
            Check your connection and try again.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void refetch();
            if (userError) void refetchUser();
          }}
          className="rounded-full bg-spotify-green px-6 py-3 text-sm font-bold text-black transition hover:brightness-110"
        >
          Try again
        </button>
      </main>
    );
  }

  if (!group && !user?.hasLinkedAccount) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black tracking-tight text-fg">
            Sign in to open this
          </h1>
          <p className="max-w-sm text-sm text-fg/50">
            Some collections are only for the people they were made for.
          </p>
        </div>
        <Link
          href="/signin"
          onClick={() => setAuthReturnUrl(`/group/${slug}`)}
          className="rounded-full bg-spotify-green px-6 py-3 text-sm font-bold text-black transition hover:brightness-110"
        >
          Sign in
        </Link>
      </main>
    );
  }

  if (!group) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-2xl font-black tracking-tight text-fg">
          No such collection
        </h1>
        <p className="max-w-sm text-sm text-fg/50">
          It may have been renamed since this link was made.
        </p>
      </main>
    );
  }

  // The shuffle screen, opened on this set: the player can still switch sets
  // and tiers in place, and the page reads the same as the landing.
  return (
    <ShuffleGamePage
      canSignIn={false}
      syncUrl
      heading={heading}
      initialTrackGroupId={group.id}
      initialTiersApply={groupHasFameTiers(group.type)}
    />
  );
}

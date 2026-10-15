import { redirect } from 'next/navigation';

/** The page moved under a name that covers playlists too. */
export default function Page() {
  redirect('/browse');
}

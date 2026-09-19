'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Calendar,
  Clock,
  Disc3,
  History,
  Info,
  ListMusic,
  LogIn,
  LogOut,
  MessageSquareWarning,
  Moon,
  Plus,
  Shuffle,
  Sun,
  Timer,
  Trophy,
  User,
  Users,
} from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useMe } from '@/hooks/auth/useMe';
import { useLogout } from '@/hooks/auth/useLogout';
import {
  isPlayable,
  useMyPlaylistLibrary,
} from '@/hooks/playlists/useMyPlaylistLibrary';
import { useTrackGroups } from '@/hooks/track-groups/useTrackGroups';
import { canImport } from '@/lib/can-import';
import {
  isEditable,
  onOpenCommandPalette,
  readRecent,
  rememberPick,
  type RecentPick,
} from '@/lib/command-palette';
import { spotifySetPath } from '@/lib/set-routes';
import { PlaylistItemKind, TrackGroupDtoTypeEnum } from '@/sdk';

const SET_KINDS = [
  { type: TrackGroupDtoTypeEnum.Artist, label: 'Artist' },
  { type: TrackGroupDtoTypeEnum.Decade, label: 'Decade' },
  { type: TrackGroupDtoTypeEnum.Genre, label: 'Genre' },
  { type: TrackGroupDtoTypeEnum.Chart, label: 'Chart' },
] as const;

const ITEM =
  'cursor-pointer gap-3 rounded-lg px-3 py-2.5 text-sm text-fg/80 data-[selected=true]:bg-fg/[0.08] data-[selected=true]:text-fg';

const TAG = 'ml-auto shrink-0 text-[11px] text-fg/35';

/**
 * Ctrl+K or Cmd+K from anywhere: a set, a playlist, a page or an action. Not
 * from inside a text field, so the guess box keeps the keystroke.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey))
        return;
      if (!open && isEditable(event.target)) return;
      event.preventDefault();
      setOpen((wasOpen) => !wasOpen);
    };
    window.addEventListener('keydown', onKey);
    const stopListening = onOpenCommandPalette(() => setOpen(true));
    return () => {
      window.removeEventListener('keydown', onKey);
      stopListening();
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="top-[12vh] w-[calc(100%-2rem)] max-w-xl translate-y-0 gap-0 overflow-hidden rounded-2xl border-fg/10 bg-surface p-0 shadow-2xl transition-none data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 sm:rounded-2xl [&>button]:hidden">
        <DialogTitle className="sr-only">Go to</DialogTitle>
        {/* Mounted only while open, so nothing is fetched for a closed box. */}
        {open && <PaletteBody onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function PaletteBody({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { data: user } = useMe();
  const logout = useLogout();
  const [search, setSearch] = useState('');
  const [recent] = useState(readRecent);

  const artists = useTrackGroups(TrackGroupDtoTypeEnum.Artist);
  const decades = useTrackGroups(TrackGroupDtoTypeEnum.Decade);
  const genres = useTrackGroups(TrackGroupDtoTypeEnum.Genre);
  const charts = useTrackGroups(TrackGroupDtoTypeEnum.Chart);
  const library = useMyPlaylistLibrary();

  const setsByKind = [artists, decades, genres, charts];
  const sets = SET_KINDS.flatMap(({ label }, i) =>
    (setsByKind[i].data ?? []).map((set) => ({
      id: `set:${set.slug}`,
      match: `${set.name} ${label} ${set.slug}`,
      label: set.name,
      tag: label,
      href: `/group/${set.slug}`,
    })),
  );

  const playlists = (library.data?.items ?? [])
    .filter(isPlayable)
    .map((item) => ({
      id: `playlist:${item.id}`,
      match: `${item.name} ${item.id}`,
      label: item.name,
      tag: item.kind === PlaylistItemKind.Spotify ? 'Spotify' : 'Imported',
      href:
        item.kind === PlaylistItemKind.Spotify
          ? spotifySetPath(item.id)
          : `/group/${item.slug}`,
    }));

  const pages = [
    { id: 'page:daily', label: 'Daily song', href: '/daily', Icon: Calendar },
    { id: 'page:shuffle', label: 'Shuffle', href: '/shuffle', Icon: Shuffle },
    {
      id: 'page:speed-run',
      label: 'Speed run',
      href: '/speed-run',
      Icon: Timer,
    },
    {
      id: 'page:friends',
      label: 'Play with friends',
      href: '/multiplayer/join',
      Icon: Users,
    },
    {
      id: 'page:leaderboard',
      label: 'Speed run leaderboard',
      href: '/speed-run/leaderboard',
      Icon: Trophy,
    },
    ...(user
      ? [
          {
            id: 'page:history',
            label: 'History',
            href: '/history',
            Icon: History,
          },
          {
            id: 'page:profile',
            label: 'Profile',
            href: '/profile',
            Icon: User,
          },
        ]
      : []),
    { id: 'page:about', label: 'About and FAQ', href: '/about', Icon: Info },
  ];

  function go(pick: RecentPick) {
    rememberPick(pick);
    onDone();
    router.push(pick.href);
  }

  function run(action: () => void) {
    onDone();
    action();
  }

  const light = theme === 'light';

  return (
    <Command
      loop
      className="bg-transparent [&_[cmdk-input-wrapper]]:border-fg/10 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-fg/40"
    >
      <CommandInput
        value={search}
        onValueChange={setSearch}
        placeholder="Search or jump to…"
        className="h-14 text-base text-fg placeholder:text-fg/35"
      />
      <CommandList className="max-h-[min(60vh,420px)] px-2 pb-2">
        <CommandEmpty className="py-10 text-center text-sm text-fg/40">
          Nothing by that name.
        </CommandEmpty>

        {!search && recent.length > 0 && (
          <CommandGroup heading="Recent">
            {recent.map((pick) => (
              <CommandItem
                key={`recent:${pick.id}`}
                value={`${pick.label} ${pick.id}`}
                onSelect={() => go(pick)}
                className={ITEM}
              >
                <Clock className="text-fg/40" />
                <span className="truncate">{pick.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {playlists.length > 0 && (
          <CommandGroup heading="Your playlists">
            {playlists.map((playlist) => (
              <CommandItem
                key={playlist.id}
                value={playlist.match}
                onSelect={() =>
                  go({
                    id: playlist.id,
                    label: playlist.label,
                    href: playlist.href,
                  })
                }
                className={ITEM}
              >
                <ListMusic className="text-fg/40" />
                <span className="truncate">{playlist.label}</span>
                <span className={TAG}>{playlist.tag}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Sets">
          {sets.map((set) => (
            <CommandItem
              key={set.id}
              value={set.match}
              onSelect={() =>
                go({ id: set.id, label: set.label, href: set.href })
              }
              className={ITEM}
            >
              <Disc3 className="text-fg/40" />
              <span className="truncate">{set.label}</span>
              <span className={TAG}>{set.tag}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Pages">
          {pages.map(({ Icon, ...page }) => (
            <CommandItem
              key={page.id}
              value={page.label}
              onSelect={() => go(page)}
              className={ITEM}
            >
              <Icon className="text-fg/40" />
              {page.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Actions">
          {canImport(user) && (
            <CommandItem
              value="Import a playlist add paste link"
              onSelect={() => run(() => router.push('/?import'))}
              className={ITEM}
            >
              <Plus className="text-fg/40" />
              Import a playlist
            </CommandItem>
          )}
          <CommandItem
            value="Switch theme light dark mode"
            onSelect={() => run(() => setTheme(light ? 'dark' : 'light'))}
            className={ITEM}
          >
            {light ? (
              <Moon className="text-fg/40" />
            ) : (
              <Sun className="text-fg/40" />
            )}
            {light ? 'Switch to dark mode' : 'Switch to light mode'}
          </CommandItem>
          <CommandItem
            value="Report a bug feedback idea"
            onSelect={() => run(() => router.push('/about#feedback'))}
            className={ITEM}
          >
            <MessageSquareWarning className="text-fg/40" />
            Report a bug or an idea
          </CommandItem>
          {user?.hasAccount ? (
            <CommandItem
              value="Sign out log out"
              onSelect={() => run(() => logout.mutate())}
              className={ITEM}
            >
              <LogOut className="text-fg/40" />
              Sign out
            </CommandItem>
          ) : (
            <CommandItem
              value="Sign in log in account"
              onSelect={() => run(() => router.push('/signin'))}
              className={ITEM}
            >
              <LogIn className="text-fg/40" />
              Sign in
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

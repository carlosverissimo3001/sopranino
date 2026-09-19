'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Info } from 'lucide-react';
import { useTheme } from 'next-themes';
import { AppHeader } from '@/components/features/AppHeader';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useMe } from '@/hooks/auth/useMe';
import { useLogout } from '@/hooks/auth/useLogout';
import {
  DEFAULT_PREFERENCES,
  useUserPreferences,
} from '@/hooks/user-preferences/useUserPreferences';
import { useUpdateUserPreferences } from '@/hooks/user-preferences/useUpdateUserPreferences';
import { SOLID_SURFACE_STYLE } from '@/lib/styles';
import type { UserPreferenceDto } from '@/sdk';
import { AvatarPicker } from './AvatarPicker';
import { EditableName } from './EditableName';
import { LinkAccountSection } from './LinkAccountSection';
import { EmailRow } from './EmailRow';

interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 px-5 py-3.5">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-fg">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-fg/50">{description}</span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spotify-green focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
          checked ? 'bg-spotify-green' : 'bg-fg/20'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-sm font-bold text-fg/50">{title}</h2>
      <div
        className="divide-y divide-fg/10 overflow-hidden rounded-2xl"
        style={SOLID_SURFACE_STYLE}
      >
        {children}
      </div>
    </section>
  );
}

export function ProfilePage({ canSignIn }: { canSignIn: boolean }) {
  // Nothing keyed on identity renders until this settles, or for a moment the
  // page would offer an account to somebody who already has one.
  const { data: user, isPending: isLoadingUser } = useMe();
  const logout = useLogout();
  const { data: preferences } = useUserPreferences();
  const { mutate: updatePreferences } = useUpdateUserPreferences();
  const { theme, setTheme } = useTheme();
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const prefs: UserPreferenceDto = preferences ?? DEFAULT_PREFERENCES;
  const toggle = (key: keyof UserPreferenceDto) => (value: boolean) =>
    updatePreferences({ [key]: value });

  return (
    <main className="relative flex min-h-screen flex-col overflow-x-hidden text-fg">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-spotify-black dark:via-[#0d1117] dark:to-[#161b22]" />
      </div>

      <AppHeader user={user} />

      <div className="relative z-10 mx-auto w-full max-w-xl flex-1 space-y-7 px-4 py-6 sm:px-6 sm:py-8">
        {user && (
          <header>
            <div className="flex items-center gap-4">
              <AvatarPicker onError={setAvatarError} />
              <div className="min-w-0">
                <h1 className="flex min-w-0 items-center gap-2 text-xl">
                  <EditableName className="min-w-0" />
                  {user.country && (
                    <Image
                      src={`https://flagcdn.com/16x12/${user.country.toLowerCase()}.png`}
                      alt={user.country}
                      width={16}
                      height={12}
                      className="shrink-0 rounded-[2px]"
                    />
                  )}
                </h1>
                {!user.hasAccount && (
                  <p className="mt-1 text-xs font-semibold text-fg/50">Guest</p>
                )}
              </div>
            </div>
            {avatarError && (
              <p role="alert" className="mt-3 text-xs text-red-400">
                {avatarError}
              </p>
            )}
          </header>
        )}

        {!isLoadingUser && user && !user.hasAccount && (
          <LinkAccountSection canSignIn={canSignIn} />
        )}

        <Card title="Settings">
          <ToggleRow
            label="Show guess history"
            checked={prefs.showGuessHistory}
            onChange={toggle('showGuessHistory')}
          />
          <ToggleRow
            label="Album art hint"
            description="A blurred cover that sharpens each round"
            checked={prefs.showAlbumHint}
            onChange={toggle('showAlbumHint')}
          />
          <ToggleRow
            label="Text hints"
            checked={prefs.showTextHints}
            onChange={toggle('showTextHints')}
          />
          <ToggleRow
            label="Name on leaderboards"
            description="Off, you still rank, as Anonymous"
            checked={prefs.showStatsToOthers}
            onChange={toggle('showStatsToOthers')}
          />
          <ToggleRow
            label="Light mode"
            checked={theme === 'light'}
            onChange={(value) => setTheme(value ? 'light' : 'dark')}
          />
        </Card>

        {!isLoadingUser && user?.hasAccount && (
          <Card title="Account">
            {user.email && <EmailRow user={user} />}
            <SpotifyRow linked={!!user.spotifyUserId} />
            <div className="px-5 py-3">
              <button
                type="button"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                className="cursor-pointer text-sm font-semibold text-red-400 transition-colors hover:text-red-300 disabled:cursor-default disabled:opacity-50"
              >
                {logout.isPending ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}

function SpotifyRow({ linked }: { linked: boolean }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-spotify-green">
        <Image src="/spotify-icon.svg" alt="" width={16} height={16} />
      </span>
      <p className="flex-1 text-sm font-bold text-fg">Spotify</p>
      <span
        className={`text-xs font-semibold ${linked ? 'text-spotify-green' : 'text-fg/40'}`}
      >
        {linked ? 'Linked' : 'Not linked'}
      </span>
      {/* A popover rather than a tooltip, so a tap on a phone opens it. */}
      <Popover>
        <PopoverTrigger
          aria-label="About linking Spotify"
          className="-m-1.5 rounded-full p-1.5 text-fg/35 outline-none transition-colors hover:text-fg/70 focus-visible:ring-2 focus-visible:ring-fg/20"
        >
          <Info className="h-4 w-4" />
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-64 border-fg/10 bg-surface/90 p-3 text-xs leading-relaxed text-fg/70 backdrop-blur-md"
        >
          Linking Spotify is invite-only: Spotify lets an app like this link
          five accounts. Anyone can play their own playlists through Deezer.
        </PopoverContent>
      </Popover>
    </div>
  );
}

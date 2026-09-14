'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Check, Pencil, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { useMe } from '@/hooks/auth/useMe';
import { useUpdateProfile } from '@/hooks/auth/useUpdateProfile';
import {
  DEFAULT_PREFERENCES,
  useUserPreferences,
} from '@/hooks/user-preferences/useUserPreferences';
import { LinkAccountSection } from './LinkAccountSection';
import { useUpdateUserPreferences } from '@/hooks/user-preferences/useUpdateUserPreferences';
import { SOLID_SURFACE_STYLE } from '@/lib/styles';
import type { UserPreferenceDto } from '@/sdk';
import { AvatarSection } from './AvatarSection';
import { VerifyEmailSection } from './VerifyEmailSection';
import { ChangePasswordSection } from './ChangePasswordSection';

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-fg">{label}</p>
        <p className="text-xs text-fg/50 mt-0.5">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954] focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
          checked ? 'bg-[#1DB954]' : 'bg-fg/20'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export function PreferencesPage({ canSignIn }: { canSignIn: boolean }) {
  // Nothing keyed on identity renders until this settles: for the moment it
  // is undefined the page would otherwise claim this is a guest with no
  // account, and offer to create one to somebody who already has it.
  const { data: user, isPending: isLoadingUser } = useMe();
  const { data: preferences } = useUserPreferences();
  const { mutate: updatePreferences } = useUpdateUserPreferences();
  const { theme, setTheme } = useTheme();
  const { mutate: updateProfile, isPending: isSavingName } = useUpdateProfile();

  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');

  const prefs: UserPreferenceDto = preferences ?? DEFAULT_PREFERENCES;

  function handleToggle(key: keyof UserPreferenceDto, value: boolean) {
    updatePreferences({ [key]: value });
  }

  return (
    <div
      className="h-screen h-[100dvh] p-4 sm:p-8 max-w-2xl mx-auto"
      style={{ background: 'rgb(var(--bg))' }}
    >
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-fg/60 hover:text-fg transition-colors text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      <div className="rounded-2xl overflow-hidden" style={SOLID_SURFACE_STYLE}>
        {/* User header */}
        <div className="relative p-6 border-b border-fg/10 flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-fg/5 border border-fg/10 shrink-0">
            {user?.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.displayName ?? ''}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg font-black text-fg">
                {user?.displayName?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            {editingName ? (
              <form
                className="flex items-center gap-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  const name = draftName.trim();
                  if (!name) return;
                  updateProfile(name, {
                    onSuccess: () => setEditingName(false),
                  });
                }}
              >
                <input
                  autoFocus
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  maxLength={50}
                  className="text-base font-black text-fg bg-transparent border-b border-fg/30 focus:border-[#1DB954] outline-none leading-tight w-40"
                />
                <button
                  type="submit"
                  disabled={isSavingName || !draftName.trim()}
                  className="text-[#1DB954] disabled:opacity-40"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingName(false)}
                  className="text-fg/40 hover:text-fg/70"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <p className="text-base font-black text-fg leading-tight flex items-center gap-2">
                {user?.displayName ?? (isLoadingUser ? '' : '—')}
                {user?.country && (
                  <Image
                    src={`https://flagcdn.com/16x12/${user.country.toLowerCase()}.png`}
                    alt={user.country}
                    width={16}
                    height={12}
                    className="rounded-[2px] font-normal"
                  />
                )}
              </p>
            )}
            {!editingName && (
              <button
                onClick={() => {
                  setDraftName(user?.displayName ?? '');
                  setEditingName(true);
                }}
                className="absolute top-3 right-3 p-2 text-fg/30 hover:text-fg/60 transition-colors"
                aria-label="Edit display name"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            <p className="text-xs font-bold text-[#1DB954] uppercase tracking-wider opacity-80 mt-0.5">
              {user?.isTrusted ? 'Trusted Player' : 'Player'}
            </p>
          </div>
        </div>

        {/* The one thing on this page that is not a preference: it decides
            whether anything else here survives losing the device. */}
        {!isLoadingUser && !user?.hasAccount && (
          <div className="px-6 py-5 border-b border-fg/10">
            <LinkAccountSection canSignIn={canSignIn} />
          </div>
        )}

        {/* Whether the address can get them back in, which the banner on the
            home page only asks about once before it can be dismissed. */}
        {!isLoadingUser && user?.email && (
          <div className="px-6 border-b border-fg/10">
            <VerifyEmailSection user={user}>
              <ChangePasswordSection />
            </VerifyEmailSection>
          </div>
        )}

        {/* Avatar */}
        <div className="px-6 border-b border-fg/10">
          <AvatarSection />
        </div>

        {/* Preferences */}
        <div className="px-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fg/30 pt-4 pb-1">
            Gameplay
          </p>

          <ToggleRow
            label="Show guess history"
            description="Display your previous guesses during a game"
            checked={prefs.showGuessHistory}
            onChange={(value) => handleToggle('showGuessHistory', value)}
          />

          <div className="-mx-6 border-t border-fg/10" />

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fg/30 pt-4 pb-1">
            Hints
          </p>

          <ToggleRow
            label="Album art hint"
            description="Show a progressively revealed album cover during gameplay"
            checked={prefs.showAlbumHint}
            onChange={(value) => handleToggle('showAlbumHint', value)}
          />

          <ToggleRow
            label="Text hints"
            description="Show genre, decade, and other clues as rounds progress"
            checked={prefs.showTextHints}
            onChange={(value) => handleToggle('showTextHints', value)}
          />

          <div className="-mx-6 border-t border-fg/10" />

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fg/30 pt-4 pb-1">
            Privacy
          </p>

          <ToggleRow
            label="Show my name on leaderboards"
            description="Off, you still rank — other players just see you as Anonymous"
            checked={prefs.showStatsToOthers}
            onChange={(value) => handleToggle('showStatsToOthers', value)}
          />

          <div className="-mx-6 border-t border-fg/10" />

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fg/30 pt-4 pb-1">
            Appearance
          </p>

          <ToggleRow
            label="Light mode"
            description="Switch to a light colour scheme"
            checked={theme === 'light'}
            onChange={(value) => setTheme(value ? 'light' : 'dark')}
          />

          <div className="pb-2" />
        </div>
      </div>
    </div>
  );
}

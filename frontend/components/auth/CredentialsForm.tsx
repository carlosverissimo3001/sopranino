'use client';

import { useMe } from '@/hooks/auth/useMe';
import { useUpdateProfile } from '@/hooks/auth/useUpdateProfile';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useLogin } from '@/hooks/auth/useLogin';
import { MIN_PASSWORD_LENGTH } from '@/lib/consts';
import { ForgotPassword } from './ForgotPassword';
import { useSignup } from '@/hooks/auth/useSignup';

export type CredentialsMode = 'signup' | 'login';
type Mode = CredentialsMode;

interface CredentialsFormProps {
  initialMode?: Mode;
  /**
   * Signs in as this address without showing it as a field. The returning
   * player is not editing their email — they are being greeted by it.
   */
  lockedEmail?: string;
  /**
   * Only where signing up creates a new person. On the profile it claims the
   * row the player already has, so there is nothing to start over from.
   */
  warnAboutSpotify?: boolean;
  /** Told which of the two finished, and for which address. */
  onDone?: (mode: Mode, email: string) => void;
}

export function CredentialsForm({
  initialMode = 'signup',
  lockedEmail,
  warnAboutSpotify = false,
  onDone,
}: CredentialsFormProps) {
  const [mode, setMode] = useState<Mode>(lockedEmail ? 'login' : initialMode);
  const [email, setEmail] = useState(lockedEmail ?? '');
  const [password, setPassword] = useState('');
  const [forgot, setForgot] = useState(false);

  const { data: user } = useMe();
  const [name, setName] = useState('');

  const signup = useSignup();
  const login = useLogin();
  const updateProfile = useUpdateProfile();
  const active = mode === 'signup' ? signup : login;

  const tooShort = mode === 'signup' && password.length < MIN_PASSWORD_LENGTH;
  const chosenName = name.trim();
  const needsName = mode === 'signup' && !chosenName;
  const canSubmit =
    !!email && !!password && !tooShort && !needsName && !active.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    active.mutate(
      { email, password },
      {
        onSuccess: () => {
          // Signup claims the guest row, so the name is changed on it after
          // the fact rather than being another field the endpoint has to take.
          if (mode === 'signup' && chosenName !== user?.displayName) {
            updateProfile.mutate(chosenName);
          }
          onDone?.(mode, email);
        },
      },
    );
  }

  if (forgot) {
    return (
      <ForgotPassword initialEmail={email} onCancel={() => setForgot(false)} />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
      {mode === 'signup' && (
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          aria-label="Your name"
          autoComplete="nickname"
          maxLength={50}
          required
          className="w-full rounded-full border border-fg/10 bg-fg/5 px-4 py-2.5 text-sm text-fg placeholder:text-fg/30 focus:border-spotify-green/50 focus:outline-none transition-colors"
        />
      )}

      {!lockedEmail && (
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
          className="w-full rounded-full border border-fg/10 bg-fg/5 px-4 py-2.5 text-sm text-fg placeholder:text-fg/30 focus:border-spotify-green/50 focus:outline-none transition-colors"
        />
      )}

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        // With the email known this is the only field, so it takes the cursor.
        autoFocus={!!lockedEmail}
        required
        className="w-full rounded-full border border-fg/10 bg-fg/5 px-4 py-2.5 text-sm text-fg placeholder:text-fg/30 focus:border-spotify-green/50 focus:outline-none transition-colors"
      />

      {mode === 'signup' && warnAboutSpotify && (
        <p className="rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-3 py-2 text-[11px] leading-relaxed text-amber-200/80">
          Played here before with Spotify? Don&apos;t create an account — it
          starts you over. Use your secret word to sign back in instead.
        </p>
      )}

      {mode === 'signup' && (
        <p className="px-1 text-[11px] text-fg/40">
          At least {MIN_PASSWORD_LENGTH} characters. We will email you a link to
          confirm your address, so you can reset it if you forget.
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-spotify-green text-sm font-black text-black transition-[background-color,opacity] hover:bg-spotify-green/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {active.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === 'signup' ? 'Create account' : 'Sign in'}
      </button>

      {active.isError && (
        <p role="alert" className="px-1 text-xs text-red-400">
          {active.error.message}
        </p>
      )}

      {/* The only way back into an account whose password is gone, so it sits
          on the form rather than behind anything. */}
      {mode === 'login' && (
        <button
          type="button"
          onClick={() => setForgot(true)}
          className="cursor-pointer px-1 text-left text-[11px] text-fg/45 underline-offset-2 hover:text-fg/70 hover:underline"
        >
          Forgot your password?
        </button>
      )}

      {!lockedEmail && (
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signup' ? 'login' : 'signup');
            signup.reset();
            login.reset();
          }}
          className="cursor-pointer px-1 text-left text-[11px] text-fg/45 underline-offset-2 hover:text-fg/70 hover:underline"
        >
          {mode === 'signup'
            ? 'Already have an account? Sign in'
            : 'No account yet? Create one'}
        </button>
      )}
    </form>
  );
}

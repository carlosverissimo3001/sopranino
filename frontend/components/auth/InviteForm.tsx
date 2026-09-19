'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSiteUnlock } from '@/hooks/auth/useSiteUnlock';

export function InviteForm() {
  const [secret, setSecret] = useState('');
  const { unlock, error, pending, clearError } = useSiteUnlock();
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // The cookie is read on the server, so only a refresh re-enables the button.
    if (await unlock(secret)) router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2.5">
      <p className="text-[11px] text-fg/40 leading-relaxed">
        Spotify caps development apps at 5 users, so playing with your own
        library is invite only for now.
      </p>
      <div className="flex w-full min-w-0 gap-2">
        <input
          type="password"
          value={secret}
          onChange={(e) => {
            setSecret(e.target.value);
            clearError();
          }}
          placeholder="Secret word"
          aria-label="Secret word"
          autoComplete="off"
          disabled={pending}
          className="min-w-0 flex-1 rounded-full border border-fg/10 bg-fg/5 px-4 py-2.5 text-sm text-fg placeholder:text-fg/30 focus:border-spotify-green/50 focus:outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={pending || !secret}
          className="shrink-0 cursor-pointer rounded-full bg-spotify-green px-5 text-sm font-black text-black transition-[background-color,opacity] hover:bg-spotify-green/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? '…' : 'Unlock'}
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-400">That is not the secret word.</p>
      )}
    </form>
  );
}

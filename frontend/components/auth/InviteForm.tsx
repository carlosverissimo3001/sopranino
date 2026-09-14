'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-3"
    >
      <p className="text-xs text-fg/40 leading-relaxed">
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
          className="min-w-0 flex-1 rounded-full border border-fg/20 bg-fg/10 px-5 py-3 text-sm text-fg placeholder:text-fg/40 focus:outline-none focus:ring-2 focus:ring-spotify-green"
        />
        <Button
          type="submit"
          variant="spotify"
          disabled={pending || !secret}
          className="!rounded-full px-6 shrink-0"
        >
          {pending ? '…' : 'Unlock'}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-red-400">That is not the secret word.</p>
      )}
    </form>
  );
}

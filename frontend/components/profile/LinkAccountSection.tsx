'use client';

import Image from 'next/image';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CredentialsForm } from '@/components/auth/CredentialsForm';

/** Where a guest turns into an account holder. */
export function LinkAccountSection({ canSignIn }: { canSignIn: boolean }) {
  return (
    <div className="rounded-2xl border border-spotify-green/25 bg-spotify-green/[0.06] p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-8 h-8 shrink-0 rounded-xl bg-spotify-green/15 text-spotify-green">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black tracking-tight text-fg">
            Keep your progress
          </p>
          <p className="mt-0.5 text-xs text-fg/60 leading-relaxed">
            Your rounds, stats and streak live in this browser. Create an
            account to keep them anywhere you sign in.
          </p>
        </div>
      </div>

      <CredentialsForm />

      {!canSignIn && (
        <p className="text-[11px] text-fg/40 leading-relaxed">
          Linking Spotify to play your own playlists is invite-only: Spotify
          limits apps like this one to a handful of accounts.
        </p>
      )}

      {canSignIn && (
        <>
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-fg/10" />
            <span className="text-[10px] uppercase tracking-widest text-fg/30">
              or
            </span>
            <span className="h-px flex-1 bg-fg/10" />
          </div>

          <a href="/api/auth/login" className="block">
            <Button
              variant="spotify"
              className="!h-11 !rounded-full text-sm font-black w-full"
            >
              <Image
                src="/spotify-icon.svg"
                alt=""
                width={16}
                height={16}
                // The icon ships dark, and this button is already green.
                className="mr-2.5 shrink-0"
              />
              Link Spotify
            </Button>
          </a>
          <p className="text-[11px] text-fg/40 leading-relaxed">
            Linking Spotify also lets you play your own playlists.
          </p>
        </>
      )}
    </div>
  );
}

'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { History, Zap } from 'lucide-react';
import type { AuthMeResponseDto } from '@/sdk';

interface AppHeaderProps {
  user: AuthMeResponseDto | undefined;
}

function AppHeaderComponent({ user }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 px-4 sm:px-6 py-3 sm:py-4 bg-surface/60 backdrop-blur-xl border-t border-fg/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="bg-spotify-green p-1.5 rounded-lg transform group-hover:rotate-12 transition-transform duration-300">
            <Zap className="w-5 h-5 text-black fill-black" />
          </div>
          <span className="text-base sm:text-xl font-black tracking-tighter uppercase italic">
            Sopranino
          </span>
        </Link>

        {user && (
          <nav className="flex items-center gap-1 sm:gap-3">
            <Link
              href="/history"
              aria-label="History"
              className="flex h-9 items-center gap-2 rounded-xl px-2.5 text-sm font-semibold text-fg/50 transition-colors hover:bg-fg/5 hover:text-fg"
            >
              <History className="h-4 w-4" />
              <span className="hidden md:inline">History</span>
            </Link>

            <Link
              href="/profile"
              aria-label="Profile"
              className="group flex items-center gap-2.5 rounded-xl p-0.5 transition-colors hover:bg-fg/5 sm:pr-3"
            >
              <span className="relative block h-9 w-9 overflow-hidden rounded-xl border border-fg/10 bg-fg/5 transition-colors group-hover:border-spotify-green/60">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="36px"
                    priority
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-sm font-black text-fg">
                    {user.displayName[0]?.toUpperCase()}
                  </span>
                )}
              </span>
              <span className="hidden max-w-[12rem] truncate text-sm font-bold text-fg sm:block">
                {user.displayName}
              </span>
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

export const AppHeader = memo(AppHeaderComponent);

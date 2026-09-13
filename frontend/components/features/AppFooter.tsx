'use client';

import { memo } from 'react';
import Link from 'next/link';

const AUTHOR = 'https://carlosverissimo.com';
const SOURCE = 'https://github.com/carlosverissimo3001/sopranino';

function AppFooterComponent() {
  return (
    <footer className="relative z-10 border-t border-fg/5 px-4 py-5 text-xs text-fg/45 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:gap-6 sm:text-left">
        <nav aria-label="Footer" className="flex items-center gap-5">
          <Link href="/about" className={linkClass}>
            About
          </Link>
          <External href={SOURCE}>Source</External>
        </nav>
        <p className="text-fg/35">
          Songs via Deezer and Spotify. Not affiliated with either.
        </p>
        <p>
          Built by <External href={AUTHOR}>Carlos Veríssimo</External>
        </p>
      </div>
    </footer>
  );
}

const linkClass =
  'text-fg/60 underline-offset-4 transition-colors hover:text-fg hover:underline';

function External({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={linkClass}>
      {children}
    </a>
  );
}

export const AppFooter = memo(AppFooterComponent);

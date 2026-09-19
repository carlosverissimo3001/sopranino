import Link from 'next/link';
import { Zap } from 'lucide-react';

/**
 * The name rather than a Back link: the game screen is the way in for a new
 * visitor, and the logo is the way home for everyone else.
 */
export function GameLogo() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2">
      <span className="rounded-lg bg-spotify-green p-1.5">
        <Zap className="h-4 w-4 fill-black text-black" />
      </span>
      <span className="text-sm font-black uppercase italic tracking-tighter sm:text-base">
        Sopranino
      </span>
    </Link>
  );
}

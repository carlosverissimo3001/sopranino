'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function GameScreenLoading() {
  return (
    <div
      className="h-screen h-[100dvh] flex items-center justify-center"
      style={{ background: 'rgb(var(--bg))' }}
    >
      <LoadingSpinner size="lg" />
    </div>
  );
}

interface GameScreenErrorProps {
  error: unknown;
  fallbackMessage?: string;
  backHref?: string;
  backLabel?: string;
}

export function GameScreenError({
  error,
  fallbackMessage = 'Something went wrong',
  backHref = '/',
  backLabel = 'Back',
}: GameScreenErrorProps) {
  return (
    <div
      className="h-screen h-[100dvh] flex items-center justify-center p-4 sm:p-6"
      style={{ background: 'rgb(var(--bg))' }}
    >
      <div className="text-center max-w-md">
        <p className="text-red-400 mb-4">
          {error instanceof Error ? error.message : fallbackMessage}
        </p>
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-[#1DB954] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </Link>
      </div>
    </div>
  );
}

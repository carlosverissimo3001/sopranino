'use client';

/** Four bars bouncing out of step, where the play control will be. */
export function Equalizer({ className = '' }: { className?: string }) {
  return (
    <div className={`flex h-8 items-center gap-1 ${className}`} aria-hidden>
      {[0, -0.45, -0.2, -0.65].map((delay) => (
        <span
          key={delay}
          className="motion-waiting h-full w-1.5 origin-center rounded-full bg-spotify-green"
          style={{
            animation: 'round-wave 0.9s ease-in-out infinite',
            animationDelay: `${delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * What is being picked, said only once a start is slow: the delay is in the
 * animation, so a fast start is over before it could show. No height of its
 * own either, so neither its arrival nor the round's moves anything.
 */
export function StartingLine({ text }: { text: string }) {
  return (
    <div className="relative h-0">
      <p
        role="status"
        className="motion-waiting absolute inset-x-0 bottom-1.5 text-center text-xs font-medium text-fg/50"
        style={{ animation: 'rise-in 300ms ease-out 800ms both' }}
      >
        {text}
      </p>
    </div>
  );
}

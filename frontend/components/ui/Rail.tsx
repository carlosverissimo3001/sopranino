'use client';

import Link from 'next/link';
import { Children, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRail } from '@/hooks/misc/useRail';

interface RailProps {
  title: ReactNode;
  /** Plain text of the title, for the labels a screen reader reads. */
  titleLabel: string;
  /** Where "See all" goes, shown only once the row overflows. */
  seeAll?: { href: string; count: number };
  /** Beside the title: a filter, an action, whatever the section owns. */
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * A section whose contents run sideways rather than down, so a catalogue can
 * grow without the page growing with it.
 */
export function Rail({
  title,
  titleLabel,
  seeAll,
  actions,
  children,
}: RailProps) {
  const card = useRef<HTMLDivElement>(null);
  const rail = useRail(() => {
    const width = card.current?.getBoundingClientRect().width ?? 220;
    return width + 16;
  });
  const { overflows, progress, visible, dragging, moving } = rail.state;
  /** The eye aligns the arrows to the artwork, not to the whole card. */
  const [coverCentre, setCoverCentre] = useState<number | null>(null);

  useEffect(() => {
    const measure = () => {
      const first = card.current;
      const cover = first?.querySelector('div.aspect-square');
      if (!first || !cover) return;
      const box = cover.getBoundingClientRect();
      setCoverCentre(
        box.top - first.getBoundingClientRect().top + box.height / 2,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (card.current) observer.observe(card.current);
    return () => observer.disconnect();
  }, [children]);

  const thumb = Math.max(8, visible * 100);

  return (
    <section className="group/rail relative">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1">
        <h2 className="text-xl font-black tracking-tighter text-fg sm:text-2xl">
          {title}
        </h2>
        <div className="flex items-center gap-3">
          {actions}
          {seeAll && overflows && (
            <Link
              href={seeAll.href}
              className="shrink-0 text-xs font-bold text-fg/40 transition-colors hover:text-fg"
            >
              See all {seeAll.count}
            </Link>
          )}
        </div>
      </div>

      <div className="relative">
        <div
          ref={rail.ref}
          onScroll={rail.onScroll}
          {...rail.handlers}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') rail.nudge(1);
            if (event.key === 'ArrowLeft') rail.nudge(-1);
          }}
          tabIndex={overflows ? 0 : -1}
          role="group"
          aria-label={`${titleLabel}, scrollable`}
          className={`-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-spotify-green/40 sm:gap-4 [&::-webkit-scrollbar]:hidden ${
            dragging ? 'cursor-grabbing select-none' : 'cursor-grab'
          }`}
        >
          {/* Flattened: a caller passing a list and a trailing card would
              otherwise put the whole list in one cell. */}
          {Children.toArray(children).map((child, index) => (
            <div
              key={index}
              ref={index === 0 ? card : undefined}
              className="w-[42%] shrink-0 sm:w-[220px]"
            >
              {child}
            </div>
          ))}
        </div>

        {overflows && progress > 0.01 && (
          <Step side="left" y={coverCentre} onClick={() => rail.nudge(-1)} />
        )}
        {overflows && progress < 0.99 && (
          <Step side="right" y={coverCentre} onClick={() => rail.nudge(1)} />
        )}
      </div>

      {/* The space is kept whether or not the row scrolls, or a filter that
          empties it would shift everything below. */}
      <div
        {...(overflows ? rail.scrub : {})}
        aria-hidden={!overflows}
        className={`group/bar mt-1 touch-none py-2 transition-opacity duration-300 ${
          overflows
            ? `cursor-grab active:cursor-grabbing ${moving || dragging ? 'opacity-100' : 'opacity-0'} group-hover/rail:opacity-100`
            : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-fg/[0.07] transition-[height] duration-150 group-hover/bar:h-2.5">
          <div
            className="h-full rounded-full bg-fg/40 transition-colors group-hover/bar:bg-fg/60"
            style={{
              width: `${thumb}%`,
              transform: `translateX(${(progress * (100 - thumb) * 100) / thumb}%)`,
            }}
          />
        </div>
      </div>
    </section>
  );
}

/** Over the artwork, under the pointer, and nowhere at rest. */
function Step({
  side,
  y,
  onClick,
}: {
  side: 'left' | 'right';
  y: number | null;
  onClick: () => void;
}) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Back' : 'On'}
      style={y === null ? undefined : { top: `${y}px` }}
      className={`absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-bg/70 text-fg opacity-0 shadow-lg backdrop-blur transition-opacity duration-200 hover:bg-bg/90 group-hover/rail:opacity-100 [@media(hover:hover)]:flex ${
        side === 'left' ? 'left-1' : 'right-1'
      }`}
    >
      <Icon className="h-5 w-5" aria-hidden />
    </button>
  );
}

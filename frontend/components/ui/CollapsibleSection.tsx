'use client';

import { ReactNode, useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
  title: ReactNode;
  /** Plain text of the title, for the labels a screen reader reads. */
  titleLabel: string;
  /** Sits beside the title, like the playlist count. */
  badge?: ReactNode;
  /** Controls for the section. On the title's row, and only while it is open. */
  actions?: ReactNode;
  /**
   * One control for the title's own row on a phone, where `actions` drop to a
   * row of their own. Only while open, like `actions`.
   */
  titleAction?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

function Chevron({
  open,
  label,
  onClick,
  className,
}: {
  open: boolean;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? `Collapse ${label}` : `Expand ${label}`}
      className={`cursor-pointer p-1 text-fg/30 transition-colors hover:text-fg/70 ${className ?? ''}`}
    >
      <ChevronDown
        aria-hidden
        className={`h-5 w-5 shrink-0 transition-transform duration-300 ${
          open ? '' : '-rotate-90'
        }`}
      />
    </button>
  );
}

export function CollapsibleSection({
  title,
  titleLabel,
  badge,
  actions,
  titleAction,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  const toggle = () => setOpen(!open);

  return (
    <section className="overflow-hidden rounded-2xl border border-fg/10">
      <div className="px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-3 sm:flex-1">
            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              aria-controls={contentId}
              className="group flex flex-1 cursor-pointer items-baseline gap-2 text-left sm:gap-3"
            >
              <span className="text-xl font-black tracking-tighter text-fg transition-colors sm:text-3xl">
                {title}
              </span>
              {badge}
            </button>

            <div className="flex items-center gap-1 sm:hidden">
              {open && titleAction}
              <Chevron open={open} label={titleLabel} onClick={toggle} />
            </div>
          </div>

          {open && actions ? (
            <div className="flex items-center gap-3">
              {actions}
              <Chevron
                open={open}
                label={titleLabel}
                onClick={toggle}
                className="hidden sm:inline-flex"
              />
            </div>
          ) : (
            <Chevron
              open={open}
              label={titleLabel}
              onClick={toggle}
              className="hidden sm:inline-flex"
            />
          )}
        </div>
      </div>

      {/* Rendered or not, rather than animated to a height. Collapsing by
          grid row needs the track to shrink below its content, which it would
          not do here whatever the minimum was set to — and a section that
          silently refuses to close is worse than one that closes instantly. */}
      {open && (
        <div id={contentId} className="px-4 pb-5 pt-1 sm:px-6 sm:pb-6 sm:pt-2">
          {children}
        </div>
      )}
    </section>
  );
}

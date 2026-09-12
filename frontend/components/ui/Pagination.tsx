'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Build the page items array: numbers and ellipsis markers.
 *
 *   [1] 2 3 ... 12        (near start)
 *   1 ... 5 [6] 7 ... 12  (middle)
 *   1 ... 10 11 [12]       (near end)
 */
function getPageItems(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const items: (number | '...')[] = [];
  items.push(1);

  if (current <= 3) {
    items.push(2, 3, 4, '...', total);
  } else if (current >= total - 2) {
    items.push('...', total - 3, total - 2, total - 1, total);
  } else {
    items.push('...', current - 1, current, current + 1, '...', total);
  }

  return items;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const items = getPageItems(currentPage, totalPages);
  const isFirst = currentPage === 1;
  const isLast = currentPage === totalPages;

  return (
    <nav aria-label="Pagination" className="flex flex-col items-center gap-1.5">
      {/* "Page X of Y" — hidden on mobile, shown sm+ */}
      <span className="hidden sm:block text-[10px] font-bold uppercase tracking-[0.2em] text-fg/30">
        Page {currentPage} of {totalPages}
      </span>

      {/* ── Desktop: full numbered bar (hidden below sm) ── */}
      <div className="hidden sm:inline-flex items-center gap-1 p-1.5 rounded-2xl bg-fg/[0.04] border border-fg/[0.08]">
        <NavButton
          direction="prev"
          disabled={isFirst}
          onClick={() => onPageChange(currentPage - 1)}
        />

        {items.map((item, idx) =>
          item === '...' ? (
            <span
              key={`ellipsis-${idx}`}
              className="flex items-center justify-center w-9 h-9 text-fg/20 text-xs select-none"
              aria-hidden
            >
              ...
            </span>
          ) : (
            <PageButton
              key={item}
              page={item}
              isActive={item === currentPage}
              onClick={() => onPageChange(item)}
            />
          ),
        )}

        <NavButton
          direction="next"
          disabled={isLast}
          onClick={() => onPageChange(currentPage + 1)}
        />
      </div>

      {/* ── Mobile: compact bar (shown below sm) ── */}
      <div className="inline-flex sm:hidden items-center gap-0.5 p-1 rounded-xl bg-fg/[0.04] border border-fg/[0.08]">
        <NavButton
          direction="prev"
          disabled={isFirst}
          onClick={() => onPageChange(currentPage - 1)}
          compact
        />

        <span className="px-3 text-[11px] font-semibold text-fg/60 tabular-nums select-none">
          <span className="text-spotify-green font-bold">{currentPage}</span>
          <span className="text-fg/25 mx-1">/</span>
          {totalPages}
        </span>

        <NavButton
          direction="next"
          disabled={isLast}
          onClick={() => onPageChange(currentPage + 1)}
          compact
        />
      </div>
    </nav>
  );
}

/* ── Sub-components ── */

function NavButton({
  direction,
  disabled,
  onClick,
  compact,
}: {
  direction: 'prev' | 'next';
  disabled: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight;
  const size = compact ? 'w-7 h-7' : 'w-9 h-9';
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={direction === 'prev' ? 'Previous page' : 'Next page'}
      className={`flex items-center justify-center ${size} rounded-xl transition-colors disabled:opacity-20 disabled:cursor-not-allowed text-fg/60 hover:text-fg hover:bg-fg/[0.08] active:scale-90`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

function PageButton({
  page,
  isActive,
  onClick,
}: {
  page: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Page ${page}`}
      aria-current={isActive ? 'page' : undefined}
      className="relative flex items-center justify-center w-9 h-9 rounded-xl text-xs font-semibold transition-colors active:scale-90"
    >
      {isActive && (
        <motion.div
          layoutId="active-page"
          className="absolute inset-0 rounded-xl bg-spotify-green/20 border border-spotify-green/30"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <span
        className={`relative z-10 ${
          isActive ? 'text-spotify-green font-bold' : 'text-fg/50 hover:text-fg'
        }`}
      >
        {page}
      </span>
    </button>
  );
}

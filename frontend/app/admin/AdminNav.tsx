'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_SECTIONS } from './sections';

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin sections"
      className="flex items-center gap-1 overflow-x-auto rounded-full border border-fg/10 bg-fg/5 p-1"
    >
      {ADMIN_SECTIONS.map(({ href, label, icon: Icon, tone }) => {
        const isCurrent = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={isCurrent ? 'page' : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
              isCurrent
                ? 'bg-fg/[0.14] text-fg shadow-[0_1px_3px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]'
                : 'text-fg/40 hover:text-fg/70'
            }`}
          >
            <Icon className={`h-4 w-4 ${isCurrent ? tone : ''}`} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

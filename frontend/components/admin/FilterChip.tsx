'use client';

export function FilterChip({
  isActive,
  onClick,
  activeClasses,
  children,
}: {
  isActive: boolean;
  onClick: () => void;
  activeClasses: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
        isActive
          ? `${activeClasses} shadow-[0_1px_3px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]`
          : 'text-fg/40 hover:text-fg/70'
      }`}
    >
      {children}
    </button>
  );
}

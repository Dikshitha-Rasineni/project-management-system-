export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill={inverted ? '#ffffff' : '#1B2433'} />
        <rect x="7" y="9" width="18" height="3" rx="1.5" fill="#2952CC" />
        <rect x="7" y="15" width="12" height="3" rx="1.5" fill="#F2B544" />
        <rect x="7" y="21" width="7" height="3" rx="1.5" fill="#3BAA78" />
      </svg>
      <span className={`text-[17px] font-semibold tracking-tight ${inverted ? 'text-white' : 'text-ink'}`}>Tasklane</span>
    </span>
  );
}

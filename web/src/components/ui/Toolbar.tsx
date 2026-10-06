import clsx from 'clsx';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Pagination as PaginationMeta } from '../../types';

export function SearchInput({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <div className="relative min-w-0 flex-1 sm:max-w-xs">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-mute" aria-hidden="true" />
      <input
        type="search"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={100}
        className="h-10 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface pr-9 pl-9 text-sm placeholder:text-ink-mute focus:border-action focus:ring-3 focus:ring-action/15 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-ink-mute hover:text-ink"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

interface Option<T extends string> {
  value: T;
  label: string;
}

/** Segmented filter control — all options visible, one click to switch. */
export function SegmentedFilter<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T | '';
  onChange: (v: T | '') => void;
  options: Option<T>[];
  label: string;
}) {
  const all: Option<T | ''>[] = [{ value: '', label: 'All' }, ...options];
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex h-10 shrink-0 items-center rounded-[var(--radius-control)] border border-line-strong bg-surface p-1"
    >
      {all.map((o) => (
        <button
          key={o.value || 'all'}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'h-full rounded-[6px] px-3 text-[13px] font-medium whitespace-nowrap transition-colors',
            value === o.value ? 'bg-ink text-white' : 'text-ink-soft hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">{children}</div>;
}

export function Pagination({ meta, onPage }: { meta: PaginationMeta; onPage: (p: number) => void }) {
  if (meta.totalPages <= 1) return null;
  const from = (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4 pt-2 text-sm text-ink-soft">
      <span>
        {from}–{to} of {meta.total}
      </span>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => onPage(meta.page - 1)}
          disabled={meta.page <= 1}
          className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-control)] border border-line-strong bg-surface px-2.5 hover:bg-paper disabled:opacity-40"
        >
          <ChevronLeft className="size-4" /> Previous
        </button>
        <button
          type="button"
          onClick={() => onPage(meta.page + 1)}
          disabled={meta.page >= meta.totalPages}
          className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-control)] border border-line-strong bg-surface px-2.5 hover:bg-paper disabled:opacity-40"
        >
          Next <ChevronRight className="size-4" />
        </button>
      </div>
    </nav>
  );
}

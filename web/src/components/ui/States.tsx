import clsx from 'clsx';
import type { ReactNode } from 'react';
import { CloudOff, RotateCw } from 'lucide-react';

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={clsx('animate-spin', className ?? 'size-5')} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-ink-mute">
      <Spinner className="size-6 text-action" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={clsx('animate-pulse rounded-md bg-line/70', className)} />;
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({ icon, title, description, action, compact }: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center rounded-[var(--radius-box)] border border-dashed border-line-strong bg-surface text-center',
        compact ? 'px-6 py-10' : 'px-6 py-16',
      )}
    >
      {icon && <div className="mb-3 text-ink-mute">{icon}</div>}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-[var(--radius-box)] border border-danger/30 bg-danger-tint/50 px-6 py-12 text-center"
    >
      <CloudOff className="mb-3 size-7 text-danger" aria-hidden="true" />
      <h3 className="text-base font-semibold text-ink">Couldn’t load this</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-soft">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-[var(--radius-control)] border border-line-strong bg-surface px-4 py-2 text-sm font-medium hover:bg-paper"
        >
          <RotateCw className="size-4" aria-hidden="true" /> Try again
        </button>
      )}
    </div>
  );
}

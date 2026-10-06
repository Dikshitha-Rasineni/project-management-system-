import clsx from 'clsx';

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={clsx('h-1.5 overflow-hidden rounded-full bg-line', className)}
    >
      <div className={clsx('h-full rounded-full', pct === 100 ? 'bg-done-bar' : 'bg-action')} style={{ width: `${pct}%` }} />
    </div>
  );
}

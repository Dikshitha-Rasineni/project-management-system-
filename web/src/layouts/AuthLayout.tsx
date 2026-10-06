import type { ReactNode } from 'react';
import { Logo } from '../components/Logo';

/**
 * Two-column auth screen. The right panel previews the product's core idea —
 * work split into pending / in progress / done — rather than stock imagery.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-[28px] font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-[15px] text-ink-soft">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-sm text-ink-soft">{footer}</div>
        </div>
        <p className="text-xs text-ink-mute">One account for the web app and the Android app.</p>
      </div>

      <div className="relative hidden overflow-hidden bg-ink lg:flex lg:flex-col lg:justify-center lg:px-16">
        <div className="max-w-md">
          <p className="text-[34px] leading-[1.15] font-semibold tracking-tight text-white">
            See where every project stands, from your desk or your phone.
          </p>
          <div className="mt-10 rounded-[14px] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-baseline justify-between text-white">
              <span className="text-sm font-medium">Website Redesign</span>
              <span className="text-sm text-white/60">8 of 12 tasks done</span>
            </div>
            <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-white/10">
              <span className="animate-grow-x bg-done-bar" style={{ width: '66%' }} />
              <span className="animate-grow-x bg-progress-bar" style={{ width: '17%', animationDelay: '120ms' }} />
            </div>
            <ul className="mt-5 space-y-3 text-sm">
              {[
                ['Build responsive navigation', 'In progress', 'bg-progress-bar'],
                ['Implement login page', 'Pending', 'bg-white/40'],
                ['Design homepage wireframes', 'Completed', 'bg-done-bar'],
              ].map(([name, status, dot]) => (
                <li key={name} className="flex items-center justify-between gap-4 text-white/85">
                  <span className="truncate">{name}</span>
                  <span className="flex shrink-0 items-center gap-1.5 text-xs text-white/60">
                    <span className={`size-1.5 rounded-full ${dot}`} />
                    {status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

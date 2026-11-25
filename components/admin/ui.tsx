'use client';

import type { ReactNode } from 'react';

/* Shared admin primitives, built on the same tokens as the chatbot: paper background,
   ink foreground, hairline borders, square corners, one bronze accent. */

export const panel = 'border border-foreground/20 rounded-xs';
export const control = 'h-9 rounded-xs border border-foreground/30 bg-background px-3 text-xs text-foreground outline-none transition-colors placeholder:text-foreground/60 focus:border-foreground';
export const button = 'inline-flex h-9 items-center justify-center gap-2 rounded-xs border border-foreground/40 px-3.5 text-xs transition-colors hover:bg-foreground/10 disabled:opacity-40 disabled:hover:bg-transparent';
export const buttonSolid = 'inline-flex h-9 items-center justify-center gap-2 rounded-xs bg-foreground px-3.5 text-xs text-background transition-opacity hover:opacity-85 disabled:opacity-30';
export const th = 'px-3 py-2.5 text-left text-[11px] font-medium whitespace-nowrap text-foreground/65';
export const td = 'px-3 py-3 align-top';

export type Tone = 'neutral' | 'good' | 'warn' | 'bad';

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  const tones: Record<Tone, string> = {
    neutral: 'border-foreground/25 text-foreground/75',
    good: 'border-emerald-800/40 text-emerald-800 dark:border-emerald-300/40 dark:text-emerald-300',
    warn: 'border-market-accent/50 text-market-accent',
    bad: 'border-red-800/40 text-red-800 dark:border-red-300/40 dark:text-red-300',
  };
  return <span className={`inline-flex items-center gap-1 rounded-xs border px-1.5 py-0.5 text-[11px] leading-4 whitespace-nowrap ${tones[tone]}`}>{children}</span>;
}

export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="m-0 font-editorial text-[26px] leading-tight font-normal tracking-[-0.03em] text-balance">{title}</h1>
        <p className="mt-2 mb-0 max-w-[68ch] text-[13px] leading-6 text-foreground/70">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

/** Says where the numbers on screen come from, so sample data is never read as real. */
export function SourceNote({ children, sample = false }: { children: ReactNode; sample?: boolean }) {
  return (
    <p className="mt-5 mb-0 flex flex-wrap items-center gap-2 text-xs leading-5 text-foreground/70">
      <Badge tone={sample ? 'warn' : 'good'}>{sample ? 'Dữ liệu mẫu' : 'Kết quả thật'}</Badge>
      <span>{children}</span>
    </p>
  );
}

export function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly (readonly [T, string])[]; onChange: (value: T) => void }) {
  return (
    <div role="group" aria-label={label} className="inline-flex max-w-full overflow-x-auto rounded-xs border border-foreground/25 p-0.5">
      {options.map(([id, text]) => (
        <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)} className={`h-8 shrink-0 rounded-xs px-3 text-xs whitespace-nowrap transition-colors ${value === id ? 'bg-foreground text-background' : 'text-foreground/70 hover:bg-foreground/10 hover:text-foreground'}`}>{text}</button>
      ))}
    </div>
  );
}

export function download(name: string, content: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

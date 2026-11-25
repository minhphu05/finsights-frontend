// Placeholders shown while data loads. Blocks tint the current text colour, so they work on dark and light sections.
import { homeStyles as ui } from './home-styles';

export function Skeleton({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`block animate-pulse rounded-xs bg-current/10 motion-reduce:animate-none ${className}`} />;
}

/** Announces the wait to screen readers; the blocks inside are decorative. */
export function SkeletonGroup({ label, className = '', children }: { label: string; className?: string; children: React.ReactNode }) {
  return <div role="status" className={className}><span className="sr-only">{label}</span>{children}</div>;
}

const times = (count: number) => Array.from({ length: count }, (_, index) => index);

export function RowsSkeleton({ label, rows = 5, className = '' }: { label: string; rows?: number; className?: string }) {
  return (
    <SkeletonGroup label={label} className={className}>
      {times(rows).map((row) => (
        <div key={row} className="flex items-center gap-4 border-t border-solid border-current/15 py-5">
          <div className="min-w-0 flex-1"><Skeleton className="h-3.5 w-1/4" /><Skeleton className="mt-2.5 h-3 w-1/2" /></div>
          <Skeleton className="h-3.5 w-16" />
        </div>
      ))}
    </SkeletonGroup>
  );
}

export function ArticleRowsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <>
      {times(rows).map((row) => (
        <div key={row} className="grid grid-cols-[38%_1fr] gap-6 border-t border-solid border-current/15 py-7 max-[560px]:grid-cols-1 max-[560px]:gap-4">
          <Skeleton className="aspect-[16/10] w-full" />
          <div><Skeleton className="h-3 w-1/3" /><Skeleton className="mt-4 h-6 w-full" /><Skeleton className="mt-2 h-6 w-2/3" /><Skeleton className="mt-5 h-3 w-full" /><Skeleton className="mt-2 h-3 w-4/5" /></div>
        </div>
      ))}
    </>
  );
}

export function NewsFeedSkeleton() {
  return (
    <section className="relative z-10 bg-background text-foreground">
      <SkeletonGroup label="Đang tải tin tức…" className={ui.wrap}>
        <div className="grid items-center gap-10 py-12 md:grid-cols-[1.25fr_1fr] md:gap-14 md:py-16">
          <Skeleton className="aspect-[16/10] w-full" />
          <div><Skeleton className="h-3 w-1/3" /><Skeleton className="mt-5 h-9 w-full" /><Skeleton className="mt-3 h-9 w-3/4" /><Skeleton className="mt-6 h-3 w-full" /><Skeleton className="mt-3 h-3 w-5/6" /></div>
        </div>
        <div className="border-t border-solid border-current/15 py-12 lg:pr-[384px]"><ArticleRowsSkeleton /></div>
      </SkeletonGroup>
    </section>
  );
}

export function IndexCellsSkeleton({ cells = 5 }: { cells?: number }) {
  return (
    <>
      {times(cells).map((cell) => (
        <div key={cell} className="px-5 py-6 md:px-7"><Skeleton className="h-3 w-2/3" /><Skeleton className="mt-4 h-8 w-full" /><Skeleton className="mt-3 h-3 w-1/2" /></div>
      ))}
    </>
  );
}

export function MarketSkeleton() {
  return (
    <SkeletonGroup label="Đang tải dữ liệu thị trường…" className="text-foreground">
      <div className="mt-10 grid grid-cols-2 border-y border-solid border-current/15 md:grid-cols-5"><IndexCellsSkeleton /></div>
      <div className="grid gap-10 border-b border-solid border-current/15 py-10 lg:grid-cols-[minmax(0,2.8fr)_minmax(240px,1fr)] lg:gap-12">
        <div><Skeleton className="h-8 w-56" /><Skeleton className="mt-7 h-10 w-40" /><Skeleton className="mt-7 h-[240px] w-full sm:h-[280px]" /></div>
        <div><Skeleton className="h-8 w-40" />{times(5).map((row) => <Skeleton key={row} className="mt-5 h-10 w-full" />)}</div>
      </div>
      <div className="pt-12 pb-6"><Skeleton className="h-9 w-60" />{times(6).map((row) => <Skeleton key={row} className="mt-5 h-12 w-full" />)}</div>
    </SkeletonGroup>
  );
}

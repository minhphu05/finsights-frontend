import { Skeleton, SkeletonGroup } from '@/components/skeleton';

export default function Loading() {
  return (
    <main data-article-page className="container article-page">
      <SkeletonGroup label="Đang tải bài viết…" className="article-column">
        <div className="article-body">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="mt-3 h-11 w-2/3" />
          <Skeleton className="mt-7 h-4 w-full" />
          <Skeleton className="mt-3 h-3 w-1/3" />
          <Skeleton className="mt-8 aspect-[16/9] w-full" />
          {['w-full', 'w-11/12', 'w-full', 'w-4/5', 'w-full', 'w-2/3'].map((width, line) => <Skeleton key={line} className={`mt-5 h-4 ${width}`} />)}
        </div>
      </SkeletonGroup>
    </main>
  );
}

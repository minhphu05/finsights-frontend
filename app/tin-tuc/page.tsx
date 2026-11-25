import { Suspense } from 'react';
import type { Metadata } from 'next';
import News from '@/components/news';
import { NewsFeedSkeleton, Skeleton } from '@/components/skeleton';
import { homeStyles as ui } from '@/components/home-styles';
export const metadata: Metadata = { title: 'Tin tức & góc nhìn' };
function Fallback() {
  return (
    <main data-home className="bg-ink text-primary">
      <div className={`${ui.wrap} pt-[150px] pb-10 max-[560px]:pt-[120px]`}><Skeleton className="h-3 w-64" /><Skeleton className="mt-6 h-14 w-full max-w-[640px]" /><Skeleton className="mt-6 h-4 w-full max-w-[520px]" /><Skeleton className="mt-10 h-11 w-80 max-w-full" /></div>
      <NewsFeedSkeleton />
    </main>
  );
}
export default function NewsPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <News />
    </Suspense>
  );
}

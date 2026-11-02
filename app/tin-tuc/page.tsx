import { Suspense } from 'react';
import type { Metadata } from 'next';
import News from '@/components/news';
export const metadata: Metadata = { title: 'Tin tức & góc nhìn' };
export default function NewsPage() {
  return (
    <Suspense fallback={<main className="container loading-view">Đang mở tin tức…</main>}>
      <News />
    </Suspense>
  );
}

import { Suspense } from 'react';
import type { Metadata } from 'next';
import Market from '@/components/market';
export const metadata: Metadata = { title: 'Danh sách theo dõi' };
export default function WatchPage() {
  return (
    <Suspense fallback={<main className="container loading-view">Đang mở danh sách…</main>}>
      <Market watchOnly />
    </Suspense>
  );
}

import type { Metadata } from 'next';
import Watchlist from '@/components/watchlist';
export const metadata: Metadata = { title: 'Danh sách theo dõi' };
export default function WatchPage() {
  return <Watchlist />;
}

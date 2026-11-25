import type { Metadata } from 'next';
import AdminConsole from '@/components/admin-console';

export const metadata: Metadata = {
  title: 'AI Evaluation Console',
  description: 'Không gian quản trị và đánh giá các model AI của Finsight.',
};

export default function AdminPage() {
  return <AdminConsole />;
}

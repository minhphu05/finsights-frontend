import { Suspense } from 'react';
import type { Metadata } from 'next';
import FinancialReports from '@/components/financial-reports';
export const metadata: Metadata = { title: 'Báo cáo tài chính' };
export default function FinancialReportsPage() {
  return <Suspense fallback={<main className="container py-32 text-sm text-foreground/65">Đang mở báo cáo…</main>}><FinancialReports /></Suspense>;
}

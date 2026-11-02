import type { Metadata, Viewport } from 'next';
import 'lenis/dist/lenis.css';
import './globals.css';
import LandingMotion from '@/components/landing-motion';
import PageTransition from '@/components/page-transition';
import Preloader from '@/components/preloader';
import { AppProvider, Header, Footer } from '@/components/shell';


export const metadata: Metadata = {
  icons: { icon: '/favicon.png' },
  title: { default: 'Turtock — Mai rùa thị trường', template: '%s · Turtock' },
  description:
    'Xem cổ phiếu Việt Nam qua mai rùa VN30 và đọc tin doanh nghiệp được chọn lọc. Bản thiết kế tương tác với dữ liệu minh họa.',
};
export const viewport: Viewport = { themeColor: '#0e1e1d', colorScheme: 'dark' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" data-loaded="instant" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try { document.documentElement.dataset.theme = localStorage.getItem('finsight-theme') === 'dark' ? 'dark' : 'light'; } catch { document.documentElement.dataset.theme = 'light'; } try { if (sessionStorage.getItem('finsight-intro-seen')) document.documentElement.dataset.introSeen = ''; } catch {}` }} />
        <link rel="stylesheet" href="/fonts/fonts.css" />
      </head>
      <body>
        <AppProvider>
          <Preloader />
          <LandingMotion />
          <PageTransition />
          <Header />
          {children}
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}

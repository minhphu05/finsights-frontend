'use client';

import Script from 'next/script';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft } from '@/components/icons';
import { API_UNAVAILABLE_MESSAGE, GOOGLE_CLIENT_ID } from '@/lib/api';
import { signInWithGoogle } from '@/lib/auth-actions';
import { Brand, useAppData } from '@/components/shell';

declare global {
  interface Window {
    google?: {
      accounts: { id: {
        initialize: (options: { client_id: string; callback: (response: { credential?: string }) => void; auto_select?: boolean }) => void;
        renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
      } };
    };
  }
}

export default function SignInPage() {
  const router = useRouter();
  const button = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const { userEmail } = useAppData();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const initializeGoogle = useCallback(() => {
    if (!window.google || !button.current || initialized.current) return;
    initialized.current = true;
    if (!GOOGLE_CLIENT_ID) { setError('Thiếu NEXT_PUBLIC_GOOGLE_CLIENT_ID'); return; }
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async ({ credential }) => {
        if (!credential) { setError('Google chưa trả về thông tin xác thực.'); return; }
        setBusy(true); setError('');
        try {
          const result = await signInWithGoogle(credential);
          if (!result.ok) {
            setError(result.status === 0 || result.status >= 500
              ? API_UNAVAILABLE_MESSAGE
              : 'Đăng nhập Google chưa hoàn tất. Kiểm tra Authorized JavaScript origins và thử lại.');
            return;
          }
          window.dispatchEvent(new Event('finsight-auth-change'));
          router.replace('/');
        } catch {
          setError(API_UNAVAILABLE_MESSAGE);
        } finally { setBusy(false); }
      },
      auto_select: false,
    });
    window.google.accounts.id.renderButton(button.current, { theme: 'outline', size: 'large', shape: 'rectangular', text: 'continue_with', logo_alignment: 'center', width: Math.min(400, button.current.clientWidth || 400), locale: 'vi' });
  }, [router]);
  useEffect(() => { if (userEmail) router.replace('/'); }, [userEmail, router]);
  return (
    <main data-home className="flex min-h-dvh flex-col bg-background font-sans text-foreground">
      <header className="mx-auto flex w-[93%] max-w-[1560px] items-center justify-between gap-4 border-b border-solid border-foreground/15 px-[2.5%] py-5">
        <Link href="/" aria-label="Finsights — Trang chủ"><Brand height={48} /></Link>
        <Link href="/" className="group flex min-h-10 items-center gap-2.5 font-['Lora',serif] text-lg font-semibold no-underline"><ArrowLeft size={20} aria-hidden="true" className="transition-transform duration-300 ease-out group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5 motion-reduce:transition-none" />Trang chủ</Link>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-6 pt-6 pb-12 text-center" aria-labelledby="signin-title">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/finsights-fox-news.webp" alt="" width={960} height={804} className="h-auto w-[min(430px,86vw,46dvh)]" />
        <h1 id="signin-title" className="mt-8 font-['Lora',serif] text-[clamp(34px,4.6vw,66px)] leading-[1.2] font-bold tracking-[-0.02em] text-balance">Đăng nhập Finsights</h1>
        <p className="mt-2 text-[clamp(15px,1.4vw,20px)] leading-7 text-foreground/85">Theo dõi cổ phiếu và trò chuyện với trợ lý AI.</p>
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={initializeGoogle} />
        {/* Hidden, not removed, while busy: Google renders into this element only once. */}
        <div className="mt-8 min-h-11 w-full max-w-[400px]">
          <div ref={button} className={`w-full justify-center [color-scheme:light] ${busy ? 'hidden' : 'flex'}`} />
          {busy && <p role="status" className="py-3 text-sm text-foreground/65">Đang xác thực tài khoản…</p>}
        </div>
        {error && <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-400">{error}</p>}
      </section>
    </main>
  );
}

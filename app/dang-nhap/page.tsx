'use client';

import Script from 'next/script';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check } from '@/components/icons';
import { homeStyles as ui } from '@/components/home-styles';
import { API_UNAVAILABLE_MESSAGE, GOOGLE_CLIENT_ID } from '@/lib/api';
import { signInWithGoogle } from '@/lib/auth-actions';
import { useAppData } from '@/components/shell';

const perks = ['Lưu danh sách cổ phiếu theo dõi', 'Đồng bộ giữa các thiết bị', 'Hỏi trợ lý AI về thị trường'];

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
    window.google.accounts.id.renderButton(button.current, { theme: 'outline', size: 'large', shape: 'rectangular', text: 'signin_with', width: Math.min(320, button.current.clientWidth || 320), locale: 'vi' });
  }, [router]);
  useEffect(() => { if (userEmail) router.replace('/'); }, [userEmail, router]);
  return (
    <main data-home className="grid min-h-dvh bg-background font-sans text-foreground lg:grid-cols-[1.15fr_1fr]">
      {/* The same market picture and type as the home hero. */}
      <div className="relative flex items-end overflow-hidden bg-ink text-primary max-lg:hidden">
        <video className="absolute inset-0 h-full w-full object-cover object-[62%_50%] saturate-[0.85]" src="/videos/finsight-hero.mp4" autoPlay muted loop playsInline preload="auto" aria-hidden="true" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,#111_0%,#111c_28%,#1112_65%,#111a_100%)]" />
        <div className="relative w-full px-[11%] pb-16">
          <p className={`${ui.eyebrow} mb-5 text-primary/80`}>FINANCE × INSIGHT × INTELLIGENCE</p>
          <p className="max-w-[560px] font-editorial text-[clamp(34px,3.3vw,54px)] leading-[1.15] font-normal tracking-[-0.035em]">Hiểu bối cảnh.<span className="block">Thấy rõ chuyển động.</span></p>
        </div>
      </div>

      <section className="flex min-w-0 items-center justify-center px-6 pt-[126px] pb-16 max-[560px]:pt-[108px]" aria-labelledby="signin-title">
        <div className="w-full max-w-[420px]">
          <p className={`${ui.eyebrow} text-foreground/65`}>TÀI KHOẢN</p>
          <h1 id="signin-title" className="mt-4 font-editorial text-[clamp(32px,3.2vw,48px)] leading-[1.15] font-normal tracking-[-0.035em] text-foreground">Đăng nhập Finsight</h1>
          <p className="mt-4 text-[13px] leading-7 text-foreground/65">Dùng tài khoản Google để theo dõi thị trường theo cách của bạn.</p>
          <ul className="mt-8 list-none border-t border-solid border-foreground/20 p-0">
            {perks.map(perk => <li key={perk} className="flex items-center gap-4 border-b border-solid border-foreground/20 py-4 text-[13px]"><Check size={16} strokeWidth={1.4} className="shrink-0" aria-hidden="true" />{perk}</li>)}
          </ul>
          <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={initializeGoogle} />
          {/* Hidden, not removed, while busy: Google renders into this element only once. */}
          <div className="mt-8 min-h-11">
            <div ref={button} className={`w-full justify-center [color-scheme:light] ${busy ? 'hidden' : 'flex'}`} />
            {busy && <p role="status" className="py-3 text-center text-sm text-foreground/65">Đang xác thực tài khoản…</p>}
          </div>
          {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
          <p className="mt-6 text-center text-xs leading-6 text-foreground/55">Finsight không nhận mật khẩu Google của bạn.</p>
          <Link href="/" className="mx-auto mt-6 flex w-fit items-center gap-2 text-xs text-foreground/70 underline-offset-4 hover:text-foreground hover:underline"><ArrowLeft size={15} />Về trang chủ</Link>
        </div>
      </section>
    </main>
  );
}

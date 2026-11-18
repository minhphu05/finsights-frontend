'use client';

import Script from 'next/script';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ShieldCheck } from '@/components/icons';
import { APIError, AUTH_STORAGE_KEY, GOOGLE_CLIENT_ID, loginWithGoogle } from '@/lib/api';
import { useAppData } from '@/components/shell';

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
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async ({ credential }) => {
        if (!credential) { setError('Google chưa trả về thông tin xác thực.'); return; }
        setBusy(true); setError('');
        try {
          const response = await loginWithGoogle(credential);
          sessionStorage.setItem(AUTH_STORAGE_KEY, response.access_token);
          sessionStorage.setItem('finsight-user-email', response.email);
          window.dispatchEvent(new Event('finsight-auth-change'));
          router.replace('/');
        } catch (reason) {
          setError(reason instanceof APIError && reason.status === 0
            ? 'Không kết nối được API. Hãy thử lại sau.'
            : 'Đăng nhập Google chưa hoàn tất. Kiểm tra Authorized JavaScript origins và thử lại.');
        } finally { setBusy(false); }
      },
      auto_select: false,
    });
    window.google.accounts.id.renderButton(button.current, { theme: 'outline', size: 'large', shape: 'rectangular', text: 'signin_with', width: 320, locale: 'vi' });
  }, [router]);
  useEffect(() => { if (userEmail) router.replace('/'); }, [userEmail, router]);
  return (
    <main className="container grid min-h-[76svh] place-items-center py-24">
      <section className="w-full max-w-lg border border-solid border-foreground/20 bg-background p-8 sm:p-12" aria-labelledby="signin-title">
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-foreground/65"><ArrowLeft size={16} />Trang chủ</Link>
        <div className="mt-9 flex items-center gap-3 text-foreground/65"><ShieldCheck size={18} /><span className="text-[10px] tracking-[0.18em] uppercase">Đăng nhập bảo mật</span></div>
        <h1 id="signin-title" className="mt-4 font-editorial text-4xl font-normal tracking-[-0.03em]">Chào mừng đến Finsight.</h1>
        <p className="mt-4 text-sm leading-7 text-foreground/65">Dùng tài khoản Google để lưu danh sách theo dõi và đồng bộ dữ liệu giữa các thiết bị.</p>
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={initializeGoogle} />
        <div className="mt-8 min-h-11">{!busy && <div ref={button} />}{busy && <p className="py-3 text-sm text-foreground/65">Đang xác thực tài khoản…</p>}</div>
        {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
        <p className="mt-8 border-t border-solid border-foreground/15 pt-5 text-xs leading-6 text-foreground/55">Finsight chỉ nhận ID token đã ký từ Google và kiểm tra token ở backend. Mật khẩu Google không được chia sẻ với Finsight.</p>
      </section>
    </main>
  );
}

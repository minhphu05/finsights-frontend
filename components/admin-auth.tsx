'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logoutAdminAction, verifyAdminSessionAction, type AdminProfile } from '@/lib/admin-actions';

type AdminSession = { admin: AdminProfile; signOut: () => Promise<void> };
const AdminSessionContext = createContext<AdminSession | null>(null);

export function useAdminSession() {
  const session = useContext(AdminSessionContext);
  if (!session) throw new Error('useAdminSession must be rendered inside AdminAuthGate');
  return session;
}

// Local UI preview only: `next dev` skips the login gate; production builds still enforce it.
const DEV_ADMIN: AdminProfile | null = process.env.NODE_ENV === 'development' ? { admin_id: 'local-dev', username: 'local-dev' } : null;

export default function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminProfile | null>(DEV_ADMIN);
  const [checking, setChecking] = useState(!DEV_ADMIN);

  useEffect(() => {
    if (DEV_ADMIN) return;
    let mounted = true;
    verifyAdminSessionAction().then((result) => {
      if (!mounted) return;
      if (result.ok) setAdmin(result.data);
      else router.replace('/admin/login/');
      setChecking(false);
    }).catch(() => {
      if (!mounted) return;
      router.replace('/admin/login/');
      setChecking(false);
    });
    return () => { mounted = false; };
  }, [router]);

  const value = useMemo<AdminSession | null>(() => {
    if (!admin) return null;
    return {
      admin,
      async signOut() {
        await logoutAdminAction();
        setAdmin(null);
        router.replace('/admin/login/');
      },
    };
  }, [admin, router]);

  if (checking || !value) {
    return <main className="grid min-h-screen place-items-center bg-[#fff8f3] px-5 text-[#2e1c13]"><div className="rounded-2xl border border-[#f6e0d2] bg-white px-8 py-7 text-center shadow-sm"><span className="mx-auto grid size-10 place-items-center rounded-xl bg-[#fff1e6] text-[#c2410c]">F</span><p className="mt-4 text-sm font-semibold">Đang xác thực phiên quản trị</p><p className="mt-1 text-xs text-[#836e63]">Trang admin chỉ dành cho tài khoản quản trị.</p></div></main>;
  }
  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}

'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { Brand } from '@/components/shell';
import { adminLoginAction } from '@/lib/admin-actions';

// Square, quiet fields; the orange focus ring is the only accent inside the form.
const field = 'h-14 w-full rounded-[3px] border border-solid border-[#a8968c] bg-transparent px-4 text-base outline-none transition-colors focus:border-[#d9430a] focus:ring-3 focus:ring-[#d9430a]/20';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await adminLoginAction(username, password);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.replace('/admin/');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không đăng nhập được.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main data-home className="flex min-h-dvh flex-col bg-[#fcf7f3] font-sans text-[#2e1c13] [color-scheme:light]">
      <header className="mx-auto flex w-[95%] max-w-[1600px] items-center justify-between gap-4 border-b border-solid border-[#d9430a]/40 px-[1.5%] py-4">
        <Link href="/" aria-label="Finsights — Trang chủ"><Brand height={48} /></Link>
        <Link href="/" className="group flex min-h-10 items-center gap-2 text-[15px] no-underline">Về trang chủ<ArrowUpRight size={20} aria-hidden="true" className="text-[#d9430a] transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none" /></Link>
      </header>

      <div className="mx-auto grid w-[95%] max-w-[1600px] flex-1 items-center border-b border-solid border-[#d9430a]/40 py-8 lg:grid-cols-[1.25fr_1fr]">
        <div className="flex h-full items-center justify-center border-r border-solid border-[#d9430a]/40 pr-6 max-lg:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/finsights-admin-fox.webp" alt="" width={1448} height={1086} className="h-auto max-h-[calc(100dvh-200px)] w-full object-contain mix-blend-multiply" />
        </div>
        <section className="mx-auto w-full max-w-[560px] px-3 lg:px-12" aria-labelledby="admin-signin-title">
          <h1 id="admin-signin-title" className="font-['Lora',serif] text-[clamp(32px,3.7vw,56px)] leading-[1.2] font-bold tracking-[-0.025em] text-balance">Đăng nhập quản trị</h1>
          <form onSubmit={(event) => { void submit(event); }} className="mt-10 space-y-7">
            <label className="block"><span className="mb-2.5 block text-base">Tên đăng nhập</span><input autoComplete="username" required maxLength={64} value={username} onChange={(event) => setUsername(event.target.value)} className={field} /></label>
            <label className="block"><span className="mb-2.5 block text-base">Mật khẩu</span><span className="relative block"><input autoComplete="current-password" required type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} className={`${field} pr-14`} /><button type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword((current) => !current)} className="absolute inset-y-0 right-0 grid w-14 place-items-center text-[#6b574c] hover:text-[#2e1c13]">{showPassword ? <EyeOff size={22} strokeWidth={1.6} /> : <Eye size={22} strokeWidth={1.6} />}</button></span></label>
            {error && <p role="alert" className="rounded-[3px] border border-solid border-[#e9b9a8] bg-[#fdeee8] px-3 py-2 text-sm leading-6 text-[#a3321a]">{error}</p>}
            <button type="submit" disabled={busy} className="h-14 w-full rounded-[3px] bg-[#d9430a] text-base font-semibold text-white transition-colors hover:bg-[#c2390a] disabled:cursor-wait disabled:opacity-60">{busy ? 'Đang xác thực…' : 'Đăng nhập'}</button>
          </form>
        </section>
      </div>
      <div className="h-10 shrink-0" />
    </main>
  );
}

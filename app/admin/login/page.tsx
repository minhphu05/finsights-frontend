'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import Link from 'next/link';
import { adminLoginAction } from '@/lib/admin-actions';

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
    <main className="grid min-h-screen bg-[#f5f3ed] px-5 py-12 text-[#22221e] lg:grid-cols-[1fr_0.9fr]">
      <section className="mx-auto flex w-full max-w-[490px] flex-col justify-center py-10 lg:py-0">
        <Link href="/" className="mb-12 inline-flex w-fit items-center gap-2 text-xs text-[#817e75] hover:text-[#292821]"><ArrowLeft size={14} />Về trang Finsight</Link>
        <div className="mb-8 grid size-12 place-items-center rounded-2xl bg-[#171813] text-[#e5d2a6]"><LockKeyhole size={21} /></div>
        <p className="text-[10px] font-semibold tracking-[0.18em] text-[#9a8359] uppercase">Finsight · Admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Đăng nhập quản trị</h1>
        <p className="mt-2 max-w-sm text-sm leading-6 text-[#817e75]">Dùng tên đăng nhập và mật khẩu admin. Tài khoản Google của người dùng không thể truy cập trang này.</p>
        <form onSubmit={(event) => { void submit(event); }} className="mt-9 space-y-5">
          <label className="block"><span className="mb-2 block text-xs font-medium text-[#555248]">Tên đăng nhập</span><input autoComplete="username" required maxLength={64} value={username} onChange={(event) => setUsername(event.target.value)} className="h-12 w-full rounded-xl border border-[#ded9ce] bg-white px-4 text-sm outline-none transition focus:border-[#b99a63] focus:ring-4 focus:ring-[#c7ac7a]/15" placeholder="adminbase" /></label>
          <label className="block"><span className="mb-2 block text-xs font-medium text-[#555248]">Mật khẩu</span><span className="relative block"><input autoComplete="current-password" required type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 w-full rounded-xl border border-[#ded9ce] bg-white px-4 pr-12 text-sm outline-none transition focus:border-[#b99a63] focus:ring-4 focus:ring-[#c7ac7a]/15" placeholder="Nhập mật khẩu admin" /><button type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword((current) => !current)} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-[#89867e]">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></span></label>
          {error && <p role="alert" className="rounded-lg border border-[#ead5ce] bg-[#fbf0ec] px-3 py-2 text-xs leading-5 text-[#9b493a]">{error}</p>}
          <button type="submit" disabled={busy} className="h-12 w-full rounded-xl bg-[#171813] text-sm font-semibold text-[#f4efe4] transition hover:bg-[#2a2a23] disabled:cursor-wait disabled:opacity-55">{busy ? 'Đang xác thực…' : 'Đăng nhập admin'}</button>
          <p className="text-center text-[11px] leading-5 text-[#96938b]">Phiên quản trị được lưu trong tab hiện tại và có thời hạn giới hạn.</p>
        </form>
      </section>
      <aside className="relative hidden overflow-hidden rounded-[28px] bg-[#171813] p-12 text-[#f3eee2] lg:flex lg:flex-col lg:justify-between">
        <div><p className="text-xs font-semibold tracking-[0.2em] text-[#d9c79f]">FINSIGHT</p><h2 className="mt-10 max-w-lg text-4xl font-medium leading-[1.15] tracking-[-0.045em]">Một không gian riêng để đánh giá chất lượng AI.</h2><p className="mt-5 max-w-md text-sm leading-7 text-[#aaa696]">Quản lý bộ câu hỏi, so sánh các provider và theo dõi lịch sử evaluate.</p></div>
        <div className="grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><p className="text-[10px] text-[#aaa696]">TRUY CẬP</p><p className="mt-2 text-sm font-medium">Tài khoản admin riêng</p></div><div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><p className="text-[10px] text-[#aaa696]">BẢO VỆ</p><p className="mt-2 text-sm font-medium">Tách khỏi Google sign-in</p></div></div>
      </aside>
    </main>
  );
}

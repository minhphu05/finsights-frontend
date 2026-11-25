'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { LoaderCircle, Plus, ShieldCheck, X } from 'lucide-react';
import { createAdminAccountAction, listAdminAccountsAction, type AdminRecord } from '@/lib/admin-actions';
import { useAdminSession } from '@/components/admin-auth';

function localDate(value: string) {
  if (!value) return 'Chưa đăng nhập';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export default function AdminManagementDialog({ onClose }: { onClose: () => void }) {
  const { admin } = useAdminSession();
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listAdminAccountsAction();
      if (!result.ok) throw new Error(result.message);
      setAdmins(result.data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không tải được danh sách admin.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    const normalized = username.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(normalized)) {
      setError('Tên đăng nhập dài 3–64 ký tự; dùng chữ thường, số, dấu chấm, gạch dưới hoặc gạch ngang.');
      return;
    }
    if (password.length < 16 || new TextEncoder().encode(password).length > 72) {
      setError('Mật khẩu phải dài từ 16 đến 72 byte.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await createAdminAccountAction(normalized, password);
      if (!result.ok) throw new Error(result.message);
      setUsername('');
      setPassword('');
      setSuccess(`Đã tạo tài khoản ${normalized}. Hãy chuyển mật khẩu ban đầu cho người dùng qua kênh riêng.`);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không tạo được tài khoản admin.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[#10110e]/55 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="admin-management-title" className="max-h-[92vh] w-full max-w-[900px] overflow-auto rounded-2xl border border-[#e6e1d7] bg-[#fdfcf9] shadow-[0_24px_80px_rgba(10,10,8,0.28)]">
        <header className="flex items-start justify-between border-b border-[#ece8df] px-5 py-4 sm:px-7 sm:py-5"><div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#f4ecdb] text-[#9b773d]"><ShieldCheck size={17} /></span><div><h2 id="admin-management-title" className="text-[15px] font-semibold text-[#282720]">Quản lý quản trị viên</h2><p className="mt-1 text-[10px] text-[#89867e]">Đang đăng nhập: <strong className="font-medium text-[#5e584a]">{admin.username}</strong></p></div></div><button type="button" aria-label="Đóng" onClick={onClose} className="grid size-8 place-items-center rounded-lg text-[#7e7b72] hover:bg-[#f0eee8]"><X size={16} /></button></header>
        <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="overflow-hidden rounded-xl border border-[#e9e4da] bg-white"><div className="flex items-center justify-between border-b border-[#efede7] px-4 py-3"><div><h3 className="text-xs font-semibold text-[#37362f]">Tài khoản admin</h3><p className="mt-1 text-[9px] text-[#918e85]">Thông tin mật khẩu không được hiển thị trong danh sách.</p></div><button type="button" onClick={() => { void refresh(); }} className="text-[9px] text-[#80643b] hover:underline">Tải lại</button></div>
            {loading ? <div className="flex items-center justify-center gap-2 p-8 text-xs text-[#817e75]"><LoaderCircle size={14} className="animate-spin" />Đang tải danh sách</div> : admins.length === 0 ? <p className="p-6 text-xs text-[#817e75]">Chưa có tài khoản admin.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-left text-[10px]"><thead className="bg-[#faf9f6] text-[9px] tracking-[0.06em] text-[#8c8981] uppercase"><tr><th className="px-4 py-3">Tên đăng nhập</th><th className="px-4 py-3">Người tạo</th><th className="px-4 py-3">Đăng nhập gần nhất</th><th className="px-4 py-3">Trạng thái</th></tr></thead><tbody className="divide-y divide-[#f0ede7]">{admins.map((item) => <tr key={item.admin_id} className="text-[#605e56]"><td className="px-4 py-3 font-semibold text-[#34332e]">{item.username}{item.username === admin.username && <span className="ml-2 rounded-full bg-[#f4ecdb] px-2 py-0.5 text-[8px] font-medium text-[#80643b]">Bạn</span>}</td><td className="px-4 py-3">{item.created_by || 'Bootstrap'}</td><td className="px-4 py-3">{localDate(item.last_login_at)}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[9px] ${item.is_active ? 'bg-[#edf5ef] text-[#426c4d]' : 'bg-[#f8ece8] text-[#945341]'}`}>{item.is_active ? 'Đang hoạt động' : 'Đã khóa'}</span></td></tr>)}</tbody></table></div>}
          </section>
          <section className="rounded-xl border border-[#e9e4da] bg-white p-4 sm:p-5"><h3 className="text-xs font-semibold text-[#37362f]">Tạo admin mới</h3><p className="mt-1 text-[10px] leading-5 text-[#89867e]">Mật khẩu được băm trong backend. Chỉ chia sẻ mật khẩu ban đầu với người nhận qua kênh riêng.</p><form onSubmit={(event) => { void submit(event); }} className="mt-4 space-y-3"><label className="block"><span className="mb-1.5 block text-[10px] font-medium text-[#5c594f]">Tên đăng nhập</span><input required minLength={3} maxLength={64} autoComplete="off" value={username} onChange={(event) => setUsername(event.target.value)} className="h-10 w-full rounded-lg border border-[#e4dfd5] bg-[#fffefa] px-3 text-xs outline-none focus:border-[#b99a63]" placeholder="admin.second" /></label><label className="block"><span className="mb-1.5 block text-[10px] font-medium text-[#5c594f]">Mật khẩu ban đầu</span><input required type="password" minLength={16} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-10 w-full rounded-lg border border-[#e4dfd5] bg-[#fffefa] px-3 text-xs outline-none focus:border-[#b99a63]" placeholder="Ít nhất 16 ký tự" /><small className="mt-1 block text-[9px] text-[#96938b]">Khuyến nghị tạo ngẫu nhiên, tối đa 72 byte.</small></label>{error && <p role="alert" className="rounded-lg border border-[#ead5ce] bg-[#fbf0ec] px-3 py-2 text-[10px] leading-4 text-[#9b493a]">{error}</p>}{success && <p role="status" className="rounded-lg border border-[#d8e7dc] bg-[#f3f8f3] px-3 py-2 text-[10px] leading-4 text-[#426c4d]">{success}</p>}<button type="submit" disabled={submitting} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#171813] px-4 text-[10px] font-semibold text-[#f4efe4] hover:bg-[#292a22] disabled:opacity-50"><Plus size={13} />{submitting ? 'Đang tạo…' : 'Tạo tài khoản admin'}</button></form></section>
        </div>
      </section>
    </div>
  );
}

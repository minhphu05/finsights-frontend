'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff, Pencil } from 'lucide-react';
import { deleteProviderKeyAction, listProviderKeysAction, saveProviderKeyAction, type ProviderKey } from '@/lib/admin-actions';
import { PageHeader, button, buttonSolid, control, panel } from './ui';

// Display names per key id of the AI service; an unknown id still gets a row.
const META: Record<string, { name: string; prefix?: string; secret?: boolean }> = {
  deepseek: { name: 'DeepSeek', prefix: 'sk-' },
  anthropic: { name: 'Anthropic', prefix: 'sk-ant-' },
  openai: { name: 'OpenAI', prefix: 'sk-' },
  voyage: { name: 'Voyage AI', prefix: 'pa-' },
  typesafe: { name: 'TypeSafe (Jev)' },
  cloudflare: { name: 'Cloudflare API token' },
  cloudflare_account_id: { name: 'Cloudflare account ID', secret: false },
};

function KeyRow({ entry, onChange }: { entry: ProviderKey; onChange: (next: ProviderKey) => void }) {
  const meta = META[entry.provider] ?? { name: entry.provider };
  const secret = meta.secret !== false;
  const [draft, setDraft] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
  const value = draft.trim();
  const oddPrefix = value.length > 6 && meta.prefix && !value.startsWith(meta.prefix);
  // A saved key shows as dots until the admin chooses to replace it.
  const masked = entry.configured && !editing;

  function cancelEdit() {
    setEditing(false); setDraft(''); setVisible(false); setMessage(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (/\s/.test(value)) return setMessage({ error: true, text: 'Key không được chứa khoảng trắng. Hãy chép lại nguyên key.' });
    if (value.length < 8 || value.length > 512) return setMessage({ error: true, text: 'Key phải dài từ 8 đến 512 ký tự. Kiểm tra xem đã chép đủ chưa.' });
    setBusy(true); setMessage(null); setConfirming(false);
    const result = await saveProviderKeyAction(entry.provider, value).catch(() => null);
    setBusy(false);
    if (!result?.ok) return setMessage({ error: true, text: result?.message ?? 'Không lưu được key. Hãy thử lại.' });
    onChange(result.data);
    setDraft(''); setVisible(false); setEditing(false);
  }

  async function remove() {
    setBusy(true); setMessage(null);
    const result = await deleteProviderKeyAction(entry.provider).catch(() => null);
    setBusy(false); setConfirming(false);
    if (!result?.ok) return setMessage({ error: true, text: result?.message ?? 'Không xóa được key. Hãy thử lại.' });
    onChange({ provider: entry.provider, configured: false, last4: null, updated_at: null });
    setDraft(''); setVisible(false); setEditing(false);
    setMessage({ error: false, text: 'Đã xóa key.' });
  }

  return (
    <li className="grid gap-x-6 gap-y-3 border-b border-foreground/15 p-5 last:border-b-0 xl:grid-cols-[minmax(320px,1fr)_minmax(0,1.2fr)] xl:items-center">
      <div className="min-w-0">
        <h3 className="m-0 text-sm font-medium">{meta.name}</h3>
        {entry.updated_at && <p className="mt-1 mb-0 text-[11px] text-foreground/60">Cập nhật {new Date(entry.updated_at).toLocaleString('vi-VN')}</p>}
      </div>
      <form onSubmit={submit} noValidate className="min-w-0">
        <div className="flex flex-wrap gap-2">
          {masked ? (
            <>
              <div role="img" aria-label={`${meta.name}: đã nhập`} className={`${control} flex min-h-9 min-w-[220px] flex-1 items-center bg-foreground/5 font-mono tracking-[0.2em] text-foreground/70 select-none`}>••••••••••••••••</div>
              {confirming
                ? <><button type="button" className={`${button} text-red-800 dark:text-red-300`} disabled={busy} onClick={remove}>Xác nhận xóa</button><button type="button" className={button} disabled={busy} onClick={() => setConfirming(false)}>Hủy</button></>
                : <><button key="edit" type="button" className={button} disabled={busy} onClick={() => { setEditing(true); setMessage(null); }}><Pencil size={14} strokeWidth={1.5} />Sửa</button><button type="button" className={button} disabled={busy} onClick={() => setConfirming(true)}>Xóa</button></>}
            </>
          ) : (
            <>
              <div className="relative min-w-[220px] flex-1">
                <input autoFocus={editing} className={`${control} w-full pr-10 font-mono`} type={visible || !secret ? 'text' : 'password'} value={draft} onChange={(e) => { setDraft(e.target.value); setMessage(null); }} onKeyDown={(e) => { if (e.key === 'Escape' && editing) cancelEdit(); }} aria-label={meta.name} aria-invalid={Boolean(message?.error)} autoComplete="off" spellCheck={false} data-1p-ignore data-lpignore="true" />
                {secret && draft && <button type="button" className="absolute top-0 right-0 grid size-9 place-items-center text-foreground/65 hover:text-foreground" onClick={() => setVisible(!visible)} aria-label={visible ? 'Ẩn key' : 'Hiện key'}>{visible ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}</button>}
              </div>
              <button key="save" type="submit" className={buttonSolid} disabled={!value || busy}>{busy ? 'Đang lưu…' : 'Lưu'}</button>
              {editing && <button type="button" className={button} disabled={busy} onClick={cancelEdit}>Hủy</button>}
            </>
          )}
        </div>
        {message && <p role={message.error ? 'alert' : 'status'} className={`mt-2 mb-0 text-xs leading-5 ${message.error ? 'text-red-800 dark:text-red-300' : 'text-foreground/70'}`}>{message.text}</p>}
        {!message && oddPrefix && <p className="mt-2 mb-0 text-xs text-market-accent">Key {meta.name} thường bắt đầu bằng “{meta.prefix}”. Kiểm tra lại nhà cung cấp.</p>}
      </form>
    </li>
  );
}

export default function ApiKeys() {
  const [keys, setKeys] = useState<ProviderKey[] | null>(null);
  const [keysError, setKeysError] = useState('');

  const loadKeys = useCallback(async () => {
    setKeysError('');
    const result = await listProviderKeysAction().catch(() => null);
    if (result?.ok) setKeys(result.data);
    else setKeysError(result?.message ?? 'Không tải được danh sách key.');
  }, []);

  useEffect(() => { void loadKeys(); }, [loadKeys]);

  const saved = keys?.filter((k) => k.configured).length ?? 0;

  return (
    <>
      <PageHeader
        title="API key"
        description="Quản lý key của các nhà cung cấp model"
      />

      <div className="mt-6 mb-3 flex flex-wrap items-center gap-3 text-xs text-foreground/70" aria-live="polite">
        {keys && <span>{saved} / {keys.length} mục đã có key</span>}
      </div>

      {keysError ? (
        <div role="alert" className={`${panel} flex flex-wrap items-center justify-between gap-3 p-5 text-xs`}><span className="text-red-800 dark:text-red-300">{keysError}</span><button type="button" className={button} onClick={() => { void loadKeys(); }}>Thử lại</button></div>
      ) : !keys ? (
        <div className={`${panel} space-y-3 p-5`} aria-busy="true" aria-label="Đang tải danh sách key">{[0, 1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse bg-foreground/5" />)}</div>
      ) : (
        <ul className={`${panel} m-0 list-none p-0`}>
          {keys.map((entry) => <KeyRow key={entry.provider} entry={entry} onChange={(next) => setKeys((all) => all?.map((k) => (k.provider === next.provider ? next : k)) ?? null)} />)}
        </ul>
      )}
    </>
  );
}

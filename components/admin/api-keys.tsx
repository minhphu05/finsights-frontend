'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { deleteProviderKeyAction, listProviderKeysAction, providersHealthAction, saveProviderKeyAction, type HealthStatus, type ProviderKey, type ProvidersHealth } from '@/lib/admin-actions';
import { Badge, PageHeader, button, buttonSolid, control, panel, td, th, type Tone } from './ui';

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
const STATUS: Record<HealthStatus, [Tone, string]> = { ok: ['good', 'Hoạt động'], error: ['bad', 'Lỗi'], not_configured: ['neutral', 'Chưa cấu hình'] };
const TIERS = ['strong', 'standard', 'cheap'];

type Service = { label: string; model: string; status: HealthStatus; latency: number | null; detail: string | null; used: boolean; keys: string[] };

function services(health: ProvidersHealth): Service[] {
  const row = (label: string) => (p: ProvidersHealth['jev']): Service => ({ label, model: p.model, status: p.status, latency: p.latency_ms, detail: p.detail, used: p.default, keys: p.keys });
  return [
    ...health.embedding.map(row('Embedding')),
    ...health.rerank.map(row('Rerank')),
    row('Jev')(health.jev),
    // LLM profiles are only checked for a key and a model name, never called.
    ...Object.entries(health.llm).map(([name, p]): Service => ({ label: `LLM · ${name}`, model: [...new Set(Object.values(p.models))].join(', '), status: p.status, latency: p.latency_ms, detail: p.detail, used: false, keys: p.keys })),
  ];
}

function StatusBadge({ service }: { service: Service }) {
  const [tone, text] = STATUS[service.status];
  // An LLM "ok" only means the key and model name are present.
  return <Badge tone={tone}>{service.status === 'ok' && service.label.startsWith('LLM') ? 'Đủ cấu hình' : text}</Badge>;
}

function KeyRow({ entry, uses, onChange }: { entry: ProviderKey; uses: Service[]; onChange: (next: ProviderKey) => void }) {
  const meta = META[entry.provider] ?? { name: entry.provider };
  const secret = meta.secret !== false;
  const [draft, setDraft] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
  const value = draft.trim();
  const oddPrefix = value.length > 6 && meta.prefix && !value.startsWith(meta.prefix);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (/\s/.test(value)) return setMessage({ error: true, text: 'Key không được chứa khoảng trắng. Hãy chép lại nguyên key.' });
    if (value.length < 8 || value.length > 512) return setMessage({ error: true, text: 'Key phải dài từ 8 đến 512 ký tự. Kiểm tra xem đã chép đủ chưa.' });
    setBusy(true); setMessage(null); setConfirming(false);
    const result = await saveProviderKeyAction(entry.provider, value).catch(() => null);
    setBusy(false);
    if (!result?.ok) return setMessage({ error: true, text: result?.message ?? 'Không lưu được key. Hãy thử lại.' });
    onChange(result.data);
    setDraft(''); setVisible(false);
    setMessage({ error: false, text: 'Đã lưu. Key chưa được kiểm tra; bấm “Kiểm tra lại” hoặc chạy eval để biết có dùng được không.' });
  }

  async function remove() {
    setBusy(true); setMessage(null);
    const result = await deleteProviderKeyAction(entry.provider).catch(() => null);
    setBusy(false); setConfirming(false);
    if (!result?.ok) return setMessage({ error: true, text: result?.message ?? 'Không xóa được key. Hãy thử lại.' });
    onChange({ provider: entry.provider, configured: false, last4: null, updated_at: null });
    setMessage({ error: false, text: 'Đã xóa key.' });
  }

  return (
    <li className="grid gap-x-6 gap-y-3 border-b border-foreground/15 p-5 last:border-b-0 xl:grid-cols-[minmax(320px,1fr)_minmax(0,1.2fr)]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2"><h3 className="m-0 text-sm font-medium">{meta.name}</h3>{entry.configured ? <Badge tone="good">Đã lưu ••••{entry.last4}</Badge> : <Badge>Chưa nhập</Badge>}</div>
        {entry.updated_at && <p className="mt-1 mb-0 text-[11px] text-foreground/60">Cập nhật {new Date(entry.updated_at).toLocaleString('vi-VN')}</p>}
        {uses.length > 0 && (
          <ul className="mt-3 mb-0 list-none space-y-2 p-0">
            {uses.map((s) => (
              <li key={s.label + s.model} className="text-xs leading-5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><StatusBadge service={s} /><span>{s.label}</span><span className="font-mono text-[11px] text-foreground/65">{s.model}</span>{s.used && <span className="text-[11px] text-foreground/55">mặc định</span>}{s.latency !== null && <span className="text-[11px] text-foreground/55 tabular-nums">{s.latency} ms</span>}</div>
                {s.detail && <p className="m-0 mt-0.5 text-[11px] break-words text-foreground/60">{s.detail}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
      <form onSubmit={submit} noValidate className="min-w-0">
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1">
            <input className={`${control} w-full pr-10 font-mono`} type={visible || !secret ? 'text' : 'password'} value={draft} onChange={(e) => { setDraft(e.target.value); setMessage(null); }} placeholder={entry.configured ? 'Dán giá trị mới để thay' : `Dán ${secret ? 'API key' : 'account ID'}${meta.prefix ? ` (${meta.prefix}…)` : ''}`} aria-label={meta.name} aria-invalid={Boolean(message?.error)} autoComplete="off" spellCheck={false} data-1p-ignore data-lpignore="true" />
            {secret && <button type="button" className="absolute top-0 right-0 grid size-9 place-items-center text-foreground/65 hover:text-foreground" onClick={() => setVisible(!visible)} aria-label={visible ? 'Ẩn key' : 'Hiện key'}>{visible ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}</button>}
          </div>
          <button type="submit" className={buttonSolid} disabled={!value || busy}>{busy && !confirming ? 'Đang lưu…' : 'Lưu'}</button>
          {entry.configured && (confirming
            ? <><button type="button" className={`${button} text-red-800 dark:text-red-300`} disabled={busy} onClick={remove}>Xác nhận xóa</button><button type="button" className={button} disabled={busy} onClick={() => setConfirming(false)}>Hủy</button></>
            : <button type="button" className={button} disabled={busy} onClick={() => setConfirming(true)}>Xóa</button>)}
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
  const [health, setHealth] = useState<ProvidersHealth | null>(null);
  const [healthError, setHealthError] = useState('');
  const [checking, setChecking] = useState(false);
  const started = useRef(false);

  const loadKeys = useCallback(async () => {
    setKeysError('');
    const result = await listProviderKeysAction().catch(() => null);
    if (result?.ok) setKeys(result.data);
    else setKeysError(result?.message ?? 'Không tải được danh sách key.');
  }, []);

  const check = useCallback(async () => {
    setChecking(true); setHealthError('');
    const result = await providersHealthAction().catch(() => null);
    if (result?.ok) setHealth(result.data);
    else { setHealth(null); setHealthError(result?.message ?? 'Không kiểm tra được provider.'); }
    setChecking(false);
  }, []);

  useEffect(() => {
    // Once per visit: each health check sends a small paid request to the providers with a key.
    if (started.current) return;
    started.current = true;
    void loadKeys().then(check);
  }, [loadKeys, check]);

  const list = health ? services(health) : [];
  const saved = keys?.filter((k) => k.configured).length ?? 0;

  return (
    <>
      <PageHeader
        title="API key"
        description="Quản lý key của các nhà cung cấp model"
        actions={<button type="button" className={button} disabled={checking || !keys} onClick={check}><RefreshCw size={14} strokeWidth={1.5} className={checking ? 'animate-spin' : ''} />{checking ? 'Đang kiểm tra…' : 'Kiểm tra lại'}</button>}
      />
      <p className="mt-4 mb-0 max-w-[75ch] text-xs leading-6 text-foreground/70">Key được lưu trên server AI service và chỉ hiện lại 4 ký tự cuối. Lưu không kiểm tra key. Kiểm tra trạng thái sẽ gửi một request rất nhỏ (có tính phí) tới embedding, rerank và Jev; LLM chỉ được kiểm tra là đã có key.</p>

      <div className="mt-6 mb-3 flex flex-wrap items-center gap-3 text-xs text-foreground/70" aria-live="polite">
        {keys && <span>{saved} / {keys.length} mục đã có key</span>}
        {health && <span className="flex items-center gap-2">Trạng thái chung <Badge tone={STATUS[health.status][0]}>{STATUS[health.status][1]}</Badge></span>}
        {checking && <span>Đang gọi các provider, tối đa khoảng 15 giây…</span>}
      </div>
      {healthError && !keysError && <p role="alert" className="mt-0 mb-3 text-xs text-red-800 dark:text-red-300">{healthError}</p>}

      {keysError ? (
        <div role="alert" className={`${panel} flex flex-wrap items-center justify-between gap-3 p-5 text-xs`}><span className="text-red-800 dark:text-red-300">{keysError}</span><button type="button" className={button} onClick={() => { void loadKeys().then(check); }}>Thử lại</button></div>
      ) : !keys ? (
        <div className={`${panel} space-y-3 p-5`} aria-busy="true" aria-label="Đang tải danh sách key">{[0, 1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse bg-foreground/5" />)}</div>
      ) : (
        <ul className={`${panel} m-0 list-none p-0`}>
          {keys.map((entry) => <KeyRow key={entry.provider} entry={entry} uses={list.filter((s) => s.keys.includes(entry.provider))} onChange={(next) => { setKeys((all) => all?.map((k) => (k.provider === next.provider ? next : k)) ?? null); setHealth(null); }} />)}
        </ul>
      )}

      {health && (
        <>
          <h2 className="mt-8 mb-0 text-[15px] font-medium">Profile model</h2>
          <p className="mt-2 mb-0 text-xs leading-6 text-foreground/70">Mỗi profile chọn model cho ba bậc, cấu hình trong <code>configs/models.yaml</code> của AI service.</p>
          <div className={`${panel} mt-3 overflow-x-auto`}>
            <table className="w-full min-w-[560px] border-collapse text-xs">
              <thead className="border-b border-foreground/20"><tr>{['Profile', ...TIERS, 'Trạng thái'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
              <tbody>{Object.entries(health.llm).map(([name, p]) => <tr key={name} className="border-b border-foreground/10 last:border-b-0"><th scope="row" className={`${td} text-left font-medium`}>{name}</th>{TIERS.map((tier) => <td key={tier} className={`${td} font-mono`}>{p.models[tier] ?? '—'}</td>)}<td className={td}><StatusBadge service={{ label: 'LLM', model: '', status: p.status, latency: null, detail: null, used: false, keys: [] }} /></td></tr>)}</tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

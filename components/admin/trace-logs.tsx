'use client';

import { useState } from 'react';
import { Check, Download, Search, X } from 'lucide-react';
import { AdminSelect, Badge, PageHeader, SourceNote, button, control, download, panel, td, th } from './ui';

// Same fields the AI service stores per turn (message columns + ai_trace).
type ToolCall = { name: string; args: Record<string, unknown>; ok: boolean };
type Trace = {
  id: string;
  at: string;
  user: string;
  session: string;
  model: string;
  question: string;
  answer: string;
  status: 'complete' | 'failed';
  errorCode?: 'timeout' | 'no_answer' | 'provider_error';
  verified: boolean;
  unsupported: string[];
  toolCalls: ToolCall[];
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  cacheReadTokens: number;
};

const oct = { date_from: '2026-10-01', date_to: '2026-10-31' };

const TRACES: Trace[] = [
  { id: 'turn-0191', at: '25/11/2026 17:31:08', user: 'user01@example.com', session: 'ses-7f3a', model: 'deepseek-v4-flash', question: 'Tin mới nhất về VCB?', answer: 'Có 3 bài mới về VCB trong tuần này, tập trung vào kế hoạch cổ tức và tăng trưởng tín dụng.', status: 'complete', verified: true, unsupported: [], toolCalls: [{ name: 'search_news', args: { symbol: 'VCB', limit: 8 }, ok: true }], latencyMs: 4120, promptTokens: 5210, completionTokens: 402, cacheReadTokens: 2048 },
  { id: 'turn-0190', at: '25/11/2026 17:24:51', user: 'user02@example.com', session: 'ses-1c90', model: 'deepseek-v4-flash', question: 'So sánh số bài về VCB và TCB trong tháng 10/2026, VCB nhiều hơn bao nhiêu phần trăm?', answer: 'VCB có nhiều bài hơn TCB trong tháng 10/2026. Tỷ lệ chênh lệch được tính từ hai kết quả đếm.', status: 'complete', verified: true, unsupported: [], toolCalls: [{ name: 'count_news', args: { symbol: 'VCB', ...oct }, ok: true }, { name: 'count_news', args: { symbol: 'TCB', ...oct }, ok: true }, { name: 'calculate', args: { expression: '(a - b) / b * 100', variables: { a: 214, b: 168 } }, ok: true }], latencyMs: 7385, promptTokens: 8944, completionTokens: 511, cacheReadTokens: 5120 },
  { id: 'turn-0189', at: '25/11/2026 17:02:13', user: 'user03@example.com', session: 'ses-aa21', model: 'deepseek-v4-flash', question: 'Hòa Phát gần đây có tin gì?', answer: 'Hòa Phát (HPG) gần đây được nhắc nhiều quanh dự án ray đường sắt cao tốc.', status: 'complete', verified: false, unsupported: ['2027'], toolCalls: [{ name: 'resolve_security', args: { query: 'Hòa Phát' }, ok: true }, { name: 'search_news', args: { symbol: 'HPG', limit: 8 }, ok: true }], latencyMs: 9870, promptTokens: 11820, completionTokens: 688, cacheReadTokens: 6144 },
  { id: 'turn-0188', at: '25/11/2026 16:47:40', user: 'user01@example.com', session: 'ses-7f3a', model: 'deepseek-v4-flash', question: 'Mỗi ngày trong tuần trước có bao nhiêu bài về ngành thép?', answer: 'The agent run timed out.', status: 'failed', errorCode: 'timeout', verified: false, unsupported: [], toolCalls: [], latencyMs: 60004, promptTokens: 14032, completionTokens: 120, cacheReadTokens: 7168 },
  { id: 'turn-0187', at: '25/11/2026 16:15:02', user: 'user04@example.com', session: 'ses-39de', model: 'deepseek-v4-flash', question: 'VCB có nên mua không?', answer: 'Mình không đưa ra khuyến nghị mua bán. Mình có thể tổng hợp tin gần đây về VCB để bạn tự đánh giá.', status: 'complete', verified: true, unsupported: [], toolCalls: [], latencyMs: 1630, promptTokens: 2480, completionTokens: 96, cacheReadTokens: 2048 },
  { id: 'turn-0186', at: '25/11/2026 15:58:27', user: 'user02@example.com', session: 'ses-1c90', model: 'deepseek-v4-pro', question: 'Trong tháng 10/2026, mã nào được nhắc đến nhiều nhất trong tin?', answer: 'Bảng xếp hạng mã được nhắc nhiều nhất trong tháng 10/2026 đã được lấy từ dữ liệu tin.', status: 'complete', verified: true, unsupported: [], toolCalls: [{ name: 'count_news', args: { group_by: 'symbol', ...oct }, ok: true }], latencyMs: 5240, promptTokens: 4710, completionTokens: 377, cacheReadTokens: 1024 },
  { id: 'turn-0185', at: '25/11/2026 15:21:19', user: 'user05@example.com', session: 'ses-c4b8', model: 'deepseek-v4-flash', question: 'Cho tôi toàn văn bài báo về lãi suất liên ngân hàng', answer: 'The model provider request failed.', status: 'failed', errorCode: 'provider_error', verified: false, unsupported: [], toolCalls: [{ name: 'search_news', args: { query: 'lãi suất liên ngân hàng' }, ok: true }, { name: 'get_news_article', args: { url: 'https://example.com/bai-viet' }, ok: false }], latencyMs: 12310, promptTokens: 6900, completionTokens: 88, cacheReadTokens: 3072 },
];

const TOOLS = ['search_news', 'count_news', 'get_news_article', 'resolve_security', 'calculate'];
const FILTERS = [['all', 'Mọi trạng thái'], ['ok', 'Đạt'], ['unverified', 'Chưa xác minh'], ['failed', 'Lỗi']] as const;
type Filter = (typeof FILTERS)[number][0];

const stateOf = (trace: Trace): Exclude<Filter, 'all'> => (trace.status === 'failed' ? 'failed' : trace.verified ? 'ok' : 'unverified');
const seconds = (ms: number) => `${(ms / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} s`;
const count = (value: number) => value.toLocaleString('vi-VN');
// Mirrors usage_store.billable_tokens: fresh input + output + a tenth of cache reads.
const billable = (t: Trace) => t.promptTokens - t.cacheReadTokens + t.completionTokens + Math.round(t.cacheReadTokens / 10);

function StateBadge({ trace }: { trace: Trace }) {
  const state = stateOf(trace);
  if (state === 'failed') return <Badge tone="bad">Lỗi · {trace.errorCode}</Badge>;
  return state === 'ok' ? <Badge tone="good">Đạt</Badge> : <Badge tone="warn">Chưa xác minh</Badge>;
}

export default function TraceLogs() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [tool, setTool] = useState('');
  const [selectedId, setSelectedId] = useState(TRACES[0].id);
  const needle = query.trim().toLowerCase();
  const rows = TRACES.filter((t) =>
    (filter === 'all' || stateOf(t) === filter)
    && (!tool || t.toolCalls.some((call) => call.name === tool))
    && (!needle || `${t.question} ${t.user} ${t.session} ${t.id}`.toLowerCase().includes(needle)));
  const selected = rows.find((t) => t.id === selectedId) ?? rows[0];

  return (
    <>
      <PageHeader
        title="Trace log truy xuất"
        description="Mỗi dòng là một lượt hỏi của người dùng: agent đã gọi tool nào, với tham số gì, verifier kết luận ra sao và tốn bao nhiêu token."
        actions={<button type="button" className={button} disabled={!rows.length} onClick={() => download('finsight-traces-sample.json', JSON.stringify(rows, null, 2), 'application/json')}><Download size={14} strokeWidth={1.5} />Xuất JSON ({rows.length})</button>}
      />
      <SourceNote sample>Chưa có API đọc trace cho admin. Cấu trúc bám theo <code>ai_trace</code> mà AI service đang lưu.</SourceNote>

      <div className="mt-5 flex flex-wrap gap-2">
        <label className="relative min-w-[220px] flex-1">
          <Search size={14} strokeWidth={1.5} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-foreground/60" />
          <input className={`${control} w-full pl-9`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm câu hỏi, email, session, mã lượt" aria-label="Tìm trace" />
        </label>
        <div className="w-[180px]"><AdminSelect hideLabel mono={false} label="Lọc theo trạng thái" value={filter} options={FILTERS} onChange={(next) => setFilter(next as Filter)} /></div>
        <div className="w-[200px]"><AdminSelect hideLabel mono={false} label="Lọc theo tool" value={tool} options={[['', 'Mọi tool'], ...TOOLS.map((name) => [name, name] as const)]} onChange={setTool} /></div>
      </div>

      <div className="mt-4 grid items-start gap-4 2xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,1fr)]">
        <div className={`${panel} overflow-x-auto`}>
          <table className="w-full min-w-[480px] border-collapse text-xs">
            <thead className="border-b border-foreground/20"><tr><th className={th}>Câu hỏi</th><th className={th}>Tool</th><th className={`${th} text-right`}>Thời gian</th><th className={th}>Trạng thái</th></tr></thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} onClick={() => setSelectedId(t.id)} className={`cursor-pointer border-b border-foreground/10 last:border-b-0 ${selected?.id === t.id ? 'bg-foreground/10' : 'hover:bg-foreground/5'}`}>
                  <td className={`${td} w-full max-w-0 min-w-[200px]`}><button type="button" aria-current={selected?.id === t.id} className="block w-full truncate text-left text-xs text-foreground">{t.question}</button><span className="mt-1 block truncate text-[11px] text-foreground/60 tabular-nums">{t.at} · {t.user} · {t.session}</span></td>
                                    <td className={`${td} tabular-nums`}>{t.toolCalls.length}</td>
                  <td className={`${td} text-right whitespace-nowrap tabular-nums`}>{seconds(t.latencyMs)}</td>
                  <td className={td}><StateBadge trace={t} /></td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={4} className="px-3 py-10 text-center text-foreground/65">Không có lượt nào khớp bộ lọc. <button type="button" className="underline underline-offset-4" onClick={() => { setQuery(''); setFilter('all'); setTool(''); }}>Xóa bộ lọc</button></td></tr>}
            </tbody>
          </table>
        </div>

        {selected && (
          <aside className={`${panel} p-5`} aria-label="Chi tiết lượt hỏi">
            <div className="flex items-center justify-between gap-3"><span className="text-[11px] text-foreground/60">{selected.id}</span><StateBadge trace={selected} /></div>
            <h2 className="mt-3 mb-0 text-[15px] leading-6 font-medium">{selected.question}</h2>
            <dl className="mt-4 mb-0 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-foreground/15 py-4 text-xs sm:grid-cols-3">
              {([['Người dùng', selected.user], ['Session', selected.session], ['Thời điểm', selected.at], ['Model', selected.model], ['Thời gian', seconds(selected.latencyMs)], ['Token tính quota', count(billable(selected))], ['Token vào', count(selected.promptTokens)], ['Đọc từ cache', count(selected.cacheReadTokens)], ['Token ra', count(selected.completionTokens)]] as const).map(([k, v]) => <div key={k} className="min-w-0"><dt className="text-[11px] text-foreground/60">{k}</dt><dd className="m-0 mt-0.5 truncate tabular-nums" title={v}>{v}</dd></div>)}
            </dl>
            <h3 className="mt-5 mb-0 text-xs font-medium">Các bước truy xuất</h3>
            {selected.toolCalls.length === 0 ? <p className="mt-2 mb-0 text-xs text-foreground/65">Lượt này không ghi nhận lời gọi tool nào.</p> : (
              <ol className="mt-3 mb-0 list-none space-y-3 p-0">
                {selected.toolCalls.map((call, index) => (
                  <li key={index} className="grid grid-cols-[20px_minmax(0,1fr)] gap-2.5">
                    <span className={`mt-0.5 grid size-5 place-items-center rounded-full border ${call.ok ? 'border-emerald-800/50 text-emerald-800 dark:text-emerald-300' : 'border-red-800/50 text-red-800 dark:text-red-300'}`} title={call.ok ? 'Thành công' : 'Thất bại'}>{call.ok ? <Check size={11} aria-label="Thành công" /> : <X size={11} aria-label="Thất bại" />}</span>
                    <div className="min-w-0"><p className="m-0 font-mono text-xs">{call.name}</p><pre className="mt-1.5 mb-0 overflow-x-auto rounded-xs bg-foreground/5 p-2.5 font-mono text-[11px] leading-5">{JSON.stringify(call.args, null, 2)}</pre></div>
                  </li>
                ))}
              </ol>
            )}
            <h3 className="mt-5 mb-0 text-xs font-medium">{selected.status === 'failed' ? 'Thông báo lỗi' : 'Câu trả lời'}</h3>
            <p className="mt-2 mb-0 text-xs leading-6 text-foreground/85">{selected.answer}</p>
            {selected.unsupported.length > 0 && <p className="mt-3 mb-0 text-xs leading-6 text-market-accent">Verifier không tìm thấy nguồn cho: {selected.unsupported.join(', ')}</p>}
          </aside>
        )}
      </div>
    </>
  );
}

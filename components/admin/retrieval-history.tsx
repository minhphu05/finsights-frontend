'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import { Skeleton } from '../skeleton';
import StockTableHighlight from '../stock-table-highlight';
import RunResults, { duration, exportRun, fromApi, money } from './retrieval-results';
import { listEvalRunsAction, type EvalApiRun } from '@/lib/admin-actions';
import { Badge, button, panel, td, th } from './ui';

const STATUS: Record<EvalApiRun['status'], string> = { queued: 'Đang chờ', running: 'Đang chạy', done: 'Xong', failed: 'Thất bại', interrupted: 'Bị gián đoạn' };
const unfinished = (run: EvalApiRun) => run.status === 'queued' || run.status === 'running';
const COLUMNS = ['Thời gian chạy', 'Bộ câu hỏi', 'Embedding', 'Rerank', 'Model quyết định', 'Thời lượng', 'Chi phí'];
// Widths of the placeholders, one per column, close to what the loaded text takes.
const PLACEHOLDERS = ['w-36', 'w-44', 'w-14', 'w-24', 'w-20', 'w-20', 'w-16'];

export default function RetrievalHistory() {
  // The list, or the results of the run that was clicked.
  const [openId, setOpenId] = useState<string | null>(null);
  const [live, setLive] = useState<EvalApiRun[] | null>(null); // null: not loaded yet
  const [error, setError] = useState('');

  // Refreshes while a run is unfinished.
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      // A server action rejects when the request itself fails, e.g. offline.
      const result = await listEvalRunsAction().catch(() => ({ ok: false as const, message: 'Không kết nối được máy chủ. Hãy tải lại trang.' }));
      if (stopped) return;
      if (!result.ok) return setError(result.message);
      setError('');
      setLive(result.data);
      if (result.data.some(unfinished)) timer = setTimeout(() => void refresh(), 5000);
    }
    void refresh();
    return () => { stopped = true; clearTimeout(timer); };
  }, []);

  const loading = live === null && !error;
  const rows = (live ?? []).map((run) => ({ item: fromApi(run), run }));
  const open = rows.find((row) => row.item.id === openId)?.item;

  if (open) {
    return (
      <>
        <button type="button" className={`${button} mt-5`} onClick={() => setOpenId(null)}><ArrowLeft size={14} strokeWidth={1.5} />Quay lại lịch sử</button>
        <RunResults item={open} />
      </>
    );
  }

  return (
    <>
    {error && <p role="alert" className="mt-5 mb-0 text-xs text-red-800 dark:text-red-300">Không tải được lịch sử chạy: {error}</p>}
    {loading && <p role="status" className="sr-only">Đang tải lịch sử chạy…</p>}
    {(loading || live) && <div className={`${panel} mt-5 overflow-x-auto`} aria-busy={loading}>
      <StockTableHighlight attribute="data-row">
      <table className="relative z-10 w-full min-w-[1020px] border-collapse text-xs tabular-nums">
        <thead className="border-b border-foreground/20"><tr>{COLUMNS.map((label) => <th key={label} className={th}>{label}</th>)}<th className={th}><span className="sr-only">Thao tác</span></th></tr></thead>
        <tbody>
        {loading && Array.from({ length: 4 }, (_, row) => (
          <tr key={row} aria-hidden="true" className="border-b border-foreground/10 last:border-b-0">
            {PLACEHOLDERS.map((width, column) => <td key={column} className={td}><Skeleton className={`my-0.5 h-3.5 ${width}`} /></td>)}
            <td className="px-3 py-2"><Skeleton className="ml-auto h-9 w-28" /></td>
          </tr>
        ))}
        {live?.length === 0 && <tr><td colSpan={COLUMNS.length + 1} className="px-3 py-8 text-center text-foreground/65">Chưa có lần chạy nào. Mở tab “Chạy mới” để bắt đầu.</td></tr>}
        {rows.map(({ item, run }) => (
          <tr key={item.id} data-row={item.id} onClick={() => setOpenId(item.id)} className="cursor-pointer border-b border-foreground/10 last:border-b-0">
            <td className={`${td} whitespace-nowrap`}><button type="button" className="mr-2 text-left text-xs text-foreground">{item.when}</button>{run.status !== 'done' ? <Badge tone={unfinished(run) ? 'neutral' : 'bad'}>{STATUS[run.status]}{unfinished(run) && run.progress.total > 0 && ` ${run.progress.done}/${run.progress.total}`}</Badge> : <Badge tone="good">Thật</Badge>}</td>
            <td className={td}><span className="font-mono">{item.dataset}</span>{item.results[0] && ` · ${item.results[0].overall.cases} câu`}</td>
            <td className={`${td} font-mono`}>{item.embedding}</td>
            <td className={`${td} font-mono`}>{item.rerank}</td>
            <td className={`${td} font-mono`}>{item.decision}</td>
            <td className={`${td} whitespace-nowrap`}>{duration(item.seconds)}</td>
            <td className={`${td} whitespace-nowrap`}>{money(item.spend)}</td>
            <td className="px-3 py-2 text-right"><button type="button" className={button} disabled={!item.results.length} onClick={(e) => { e.stopPropagation(); exportRun(item); }}><Download size={14} strokeWidth={1.5} />Xuất Excel</button></td>
          </tr>
        ))}
        </tbody>
      </table>
      </StockTableHighlight>
    </div>}
    </>
  );
}

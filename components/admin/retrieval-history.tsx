'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import StockTableHighlight from '../stock-table-highlight';
import report from './retrieval-report.json';
import RunResults, { duration, exportRun, fromApi, money, type EvalRun, type Run } from './retrieval-results';
import { listEvalRunsAction, type EvalApiRun } from '@/lib/admin-actions';
import { Badge, button, panel, td, th } from './ui';

// The report made with the CLI (finsights-ai-service/evals/reports) before the admin page could
// start runs; it does not record model names.
const RUNS: EvalRun[] = [
  { id: 'v2-snapshot', dataset: 'news_topics_v2', when: '22–24/11/2026', embedding: 'Không ghi', rerank: 'Không ghi', decision: 'Không ghi', sample: false, results: report as unknown as Run[] },
];

const STATUS: Record<EvalApiRun['status'], string> = { queued: 'Đang chờ', running: 'Đang chạy', done: 'Xong', failed: 'Thất bại', interrupted: 'Bị gián đoạn' };
const unfinished = (run: EvalApiRun) => run.status === 'queued' || run.status === 'running';

export default function RetrievalHistory() {
  // The list, or the results of the run that was clicked.
  const [openId, setOpenId] = useState<string | null>(null);
  const [live, setLive] = useState<EvalApiRun[]>([]);
  const [error, setError] = useState('');

  // Refreshes while a run is unfinished.
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      const result = await listEvalRunsAction();
      if (stopped) return;
      if (!result.ok) return setError(result.message);
      setError('');
      setLive(result.data);
      if (result.data.some(unfinished)) timer = setTimeout(() => void refresh(), 5000);
    }
    void refresh();
    return () => { stopped = true; clearTimeout(timer); };
  }, []);

  const rows: { item: EvalRun; run?: EvalApiRun }[] = [
    ...live.map((run) => ({ item: fromApi(run), run })),
    ...RUNS.map((item) => ({ item })),
  ];
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
    <div className={`${panel} mt-5 overflow-x-auto`}>
      <StockTableHighlight attribute="data-row">
      <table className="relative z-10 w-full min-w-[1020px] border-collapse text-xs tabular-nums">
        <thead className="border-b border-foreground/20"><tr>{['Thời gian chạy', 'Bộ câu hỏi', 'Embedding', 'Rerank', 'Model quyết định', 'Thời lượng', 'Chi phí'].map((label) => <th key={label} className={th}>{label}</th>)}<th className={th}><span className="sr-only">Thao tác</span></th></tr></thead>
        <tbody>{rows.map(({ item, run }) => (
          <tr key={item.id} data-row={item.id} onClick={() => setOpenId(item.id)} className="cursor-pointer border-b border-foreground/10 last:border-b-0">
            <td className={`${td} whitespace-nowrap`}><button type="button" className="mr-2 text-left text-xs text-foreground">{item.when}</button>{run && run.status !== 'done' ? <Badge tone={unfinished(run) ? 'neutral' : 'bad'}>{STATUS[run.status]}{unfinished(run) && run.progress.total > 0 && ` ${run.progress.done}/${run.progress.total}`}</Badge> : <Badge tone={item.sample ? 'warn' : 'good'}>{item.sample ? 'Mẫu' : 'Thật'}</Badge>}</td>
            <td className={td}><span className="font-mono">{item.dataset}</span>{item.results[0] && ` · ${item.results[0].overall.cases} câu`}</td>
            <td className={`${td} font-mono`}>{item.embedding}</td>
            <td className={`${td} font-mono`}>{item.rerank}</td>
            <td className={`${td} font-mono`}>{item.decision}</td>
            <td className={`${td} whitespace-nowrap`}>{duration(item.seconds)}</td>
            <td className={`${td} whitespace-nowrap`}>{money(item.spend)}</td>
            <td className="px-3 py-2 text-right"><button type="button" className={button} disabled={!item.results.length} onClick={(e) => { e.stopPropagation(); exportRun(item); }}><Download size={14} strokeWidth={1.5} />Xuất Excel</button></td>
          </tr>
        ))}</tbody>
      </table>
      </StockTableHighlight>
    </div>
    </>
  );
}

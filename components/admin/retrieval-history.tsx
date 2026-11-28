'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import StockTableHighlight from '../stock-table-highlight';
import report from './retrieval-report.json';
import RunResults, { STRATEGIES, duration, exportRun, fromApi, money, type EvalRun, type Run, type Scores } from './retrieval-results';
import { listEvalRunsAction, type EvalApiRun } from '@/lib/admin-actions';
import { Badge, button, panel, td, th } from './ui';

const REPORTS = report as unknown as Run[];
const DATASETS = ['news_topics_v2', 'news_topics'] as const;

// Sample runs made to design the screen; runs of the AI service are listed above them.
// Each shifts the real report by a few points; a strategy without a report borrows a neighbour's numbers.
const BORROW: Record<string, string> = { 'hybrid-jev80': 'jev-point80', 'hybrid-gate10': 'gate10' };
const shifted = (scores: Scores, shift: number, cases: number): Scores => {
  const move = (value?: number | null) => (value === null || value === undefined ? value : Math.min(1, Math.max(0, +(value + shift).toFixed(3))));
  return { ...scores, cases, 'mrr@10': move(scores['mrr@10']), 'hit@5': move(scores['hit@5']), 'precision@5': move(scores['precision@5']), 'evidence@5': move(scores['evidence@5']) };
};
const sampleResults = (shift: number, share: number): Run[] => STRATEGIES.map(({ id }) => {
  const source = REPORTS.find((result) => result.id === (BORROW[id] ?? id))!;
  const cases = (count: number) => Math.max(1, Math.round(count * share));
  return { id, overall: shifted(source.overall, shift, cases(source.overall.cases)), byCategory: Object.fromEntries(Object.entries(source.byCategory).map(([name, scores]) => [name, shifted(scores, shift, cases(scores.cases))])) };
});

const RUNS: EvalRun[] = [
  // The only real one: the reports in finsights-ai-service/evals/reports, which do not record model names.
  { id: 'v2-snapshot', dataset: DATASETS[0], when: '22–24/11/2026', embedding: 'Không ghi', rerank: 'Không ghi', decision: 'Không ghi', sample: false, results: REPORTS },
  { id: 'v2-1911', dataset: DATASETS[0], when: '19/11/2026 11:12', embedding: 'bge-m3', rerank: 'rerank-3', decision: 'jev-1.14.0', sample: true, results: sampleResults(-0.034, 1) },
  { id: 'v1-1811', dataset: DATASETS[1], when: '18/11/2026 10:30', embedding: 'voyage-4', rerank: 'rerank-3', decision: 'jev-1.14.0', sample: true, results: sampleResults(-0.018, 0.4) },
  { id: 'v1-1711', dataset: DATASETS[1], when: '17/11/2026 15:55', embedding: 'voyage-4', rerank: 'Không dùng', decision: 'Không dùng', sample: true, results: sampleResults(-0.041, 0.4) },
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

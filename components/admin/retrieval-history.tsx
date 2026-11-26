'use client';

import { useState } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import StockTableHighlight from '../stock-table-highlight';
import report from './retrieval-report.json';
import RunResults, { STRATEGIES, exportRun, type EvalRun, type Run, type Scores } from './retrieval-results';
import { Badge, button, panel, td, th } from './ui';

const REPORTS = report as unknown as Run[];
const DATASETS = ['news_topics_v2', 'news_topics'] as const;

// Sample runs to design the screen: the AI service does not store evaluation runs yet.
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

export default function RetrievalHistory() {
  // The list, or the results of the run that was clicked.
  const [openId, setOpenId] = useState<string | null>(null);
  const open = RUNS.find((item) => item.id === openId);

  if (open) {
    return (
      <>
        <button type="button" className={`${button} mt-5`} onClick={() => setOpenId(null)}><ArrowLeft size={14} strokeWidth={1.5} />Quay lại lịch sử</button>
        <RunResults item={open} />
      </>
    );
  }

  return (
    <div className={`${panel} mt-5 overflow-x-auto`}>
      <StockTableHighlight attribute="data-row">
      <table className="relative z-10 w-full min-w-[860px] border-collapse text-xs tabular-nums">
        <thead className="border-b border-foreground/20"><tr>{['Thời gian chạy', 'Bộ câu hỏi', 'Embedding', 'Rerank', 'Model quyết định'].map((label) => <th key={label} className={th}>{label}</th>)}<th className={th}><span className="sr-only">Thao tác</span></th></tr></thead>
        <tbody>{RUNS.map((item) => (
          <tr key={item.id} data-row={item.id} onClick={() => setOpenId(item.id)} className="cursor-pointer border-b border-foreground/10 last:border-b-0">
            <td className={`${td} whitespace-nowrap`}><button type="button" className="mr-2 text-left text-xs text-foreground">{item.when}</button><Badge tone={item.sample ? 'warn' : 'good'}>{item.sample ? 'Mẫu' : 'Thật'}</Badge></td>
            <td className={td}><span className="font-mono">{item.dataset}</span> · {item.results[0].overall.cases} câu</td>
            <td className={`${td} font-mono`}>{item.embedding}</td>
            <td className={`${td} font-mono`}>{item.rerank}</td>
            <td className={`${td} font-mono`}>{item.decision}</td>
            <td className="px-3 py-2 text-right"><button type="button" className={button} onClick={(e) => { e.stopPropagation(); exportRun(item); }}><Download size={14} strokeWidth={1.5} />Xuất Excel</button></td>
          </tr>
        ))}</tbody>
      </table>
      </StockTableHighlight>
    </div>
  );
}

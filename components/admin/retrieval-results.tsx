'use client';

import { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import StockTableHighlight from '../stock-table-highlight';
import { workbook, type Cell } from './agent-benchmark';
import { AdminSelect, Badge, Segmented, button, download, panel, td, th } from './ui';

export type Metric = 'hit@5' | 'mrr@10' | 'precision@5' | 'evidence@5';
export type Scores = Partial<Record<Metric, number | null>> & { cases: number; 'unjudged@10': number; 'chars@5'?: number };
export type Run = { id: string; overall: Scores; byCategory: Record<string, Scores> };

// The strategies compared here. `id` is the retriever of evals.runners.retrieval; one without a result has not been run.
export const STRATEGIES = [
  { id: 'dense', name: 'dense', about: 'Voyage embedding trên tóm tắt' },
  { id: 'like', name: 'like', about: 'SQL LIKE trên tiêu đề và tóm tắt' },
  { id: 'bm25', name: 'bm25', about: 'Từ khóa BM25 trên chunk' },
  { id: 'hybrid', name: 'hybrid', about: 'BM25 + dense, gộp bằng RRF' },
  { id: 'rerank80', name: 'dense rerank', about: 'Dense 80 chunk rồi rerank' },
  { id: 'hybrid-rerank80', name: 'hybrid rerank', about: 'Hybrid 80 chunk rồi rerank' },
  { id: 'jev-point80', name: 'dense + jev', about: 'Dense 80 chunk, Jev chấm từng đoạn' },
  { id: 'hybrid-jev80', name: 'hybrid + jev', about: 'Hybrid 80 chunk, Jev chấm từng đoạn' },
  { id: 'gate10', name: 'dense rerank + jev', about: 'Dense rerank rồi Jev lọc ngưỡng 0,1' },
  { id: 'hybrid-gate10', name: 'hybrid rerank + jev', about: 'Hybrid rerank rồi Jev lọc ngưỡng 0,1' },
];

/** One question set evaluated at one moment, with the results of every strategy. */
export type EvalRun = { id: string; dataset: string; when: string; embedding: string; rerank: string; decision: string; sample: boolean; results: Run[] };

const BASELINE = 'like'; // search_news in production still matches with SQL LIKE.
export const METRICS = [['mrr@10', 'MRR@10'], ['hit@5', 'Hit@5'], ['precision@5', 'Precision@5'], ['evidence@5', 'Evidence@5']] as const;
const HELP: Record<Metric, string> = {
  'mrr@10': 'Nghịch đảo thứ hạng của bài đúng đầu tiên trong top 10. Càng gần 100% thì bài đúng càng đứng đầu.',
  'hit@5': 'Tỷ lệ câu hỏi có ít nhất một bài đúng trong top 5.',
  'precision@5': 'Tỷ lệ bài đúng trong số bài đã chấm ở top 5. Bài chưa chấm không bị tính là sai.',
  'evidence@5': 'Chỉ tính nhóm detail: đoạn văn trả về có chứa đúng câu bằng chứng hay không.',
};

export const percent = (v?: number | null) => (v === null || v === undefined ? '—' : `${(v * 100).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`);
const heat = (v?: number | null) => ({ backgroundColor: v ? `color-mix(in srgb, var(--color-market-accent) ${Math.round(v ** 3 * 34)}%, transparent)` : undefined });
const withResults = (results: Run[]) => STRATEGIES.map((strategy) => ({ ...strategy, run: results.find((result) => result.id === strategy.id) }));

/** Every strategy of the run, per overall score and per question category. */
export function exportRun(item: EvalRun) {
  const score = (value?: number | null): Cell => (value === null || value === undefined ? '' : +(value * 100).toFixed(1));
  const heads = METRICS.map(([, text]) => `${text} (%)`);
  const rows = withResults(item.results);
  const summary: Cell[][] = [
    ['Finsight · Benchmark truy xuất'],
    ...(item.sample ? [['LƯU Ý', 'Dữ liệu mẫu, không phải kết quả chạy thật']] : []),
    ['Bộ câu hỏi', item.dataset], ['Thời gian chạy', item.when], ['Model embedding', item.embedding], ['Model rerank', item.rerank], ['Model quyết định', item.decision], [],
    ['Chiến lược', 'Cách làm', 'Trạng thái', ...heads, 'Ký tự@5', 'Chưa chấm'],
    ...rows.map(({ name, about, run }): Cell[] => (run ? [name, about, 'Đã chạy', ...METRICS.map(([key]) => score(run.overall[key])), run.overall['chars@5'] ?? '', run.overall['unjudged@10']] : [name, about, 'Chưa chạy'])),
  ];
  const byCategory: Cell[][] = [
    ['Chiến lược', 'Loại câu hỏi', 'Số câu', ...heads],
    ...rows.flatMap(({ name, run }) => Object.entries(run?.byCategory ?? {}).map(([category, scores]): Cell[] => [name, category, scores.cases, ...METRICS.map(([key]) => score(scores[key]))])),
  ];
  const bytes = workbook([{ name: 'Tổng quan', rows: summary }, { name: 'Theo loại câu hỏi', rows: byCategory }]);
  download(`finsight-retrieval-${item.sample ? 'sample-' : ''}${item.id}.xlsx`, bytes.buffer as ArrayBuffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

export default function RunResults({ item }: { item: EvalRun }) {
  const [metric, setMetric] = useState<Metric>('mrr@10');
  const [selectedId, setSelectedId] = useState('hybrid-rerank80');
  const [copied, setCopied] = useState(false);
  const rows = withResults(item.results);
  // Strategies that have not run sort last.
  const ranked = [...rows].sort((a, b) => (b.run?.overall[metric] ?? -1) - (a.run?.overall[metric] ?? -1));
  const measured = rows.flatMap((row) => (row.run ? [{ ...row, run: row.run }] : []));
  const baseline = measured.find((row) => row.id === BASELINE)!;
  const selected = measured.find((row) => row.id === selectedId) ?? baseline;
  const categories = Object.keys(baseline.run.byCategory);
  const label = METRICS.find(([id]) => id === metric)![1];
  const delta = ((selected.run.overall[metric] ?? 0) - (baseline.run.overall[metric] ?? 0)) * 100;
  const command = `uv run --env-file .env python -m evals.runners.retrieval --retriever ${selected.id} --dataset evals/datasets/news_topics_v2.jsonl`;

  async function copy() {
    try { await navigator.clipboard.writeText(command); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  }

  return (
    <section className="mt-5" aria-labelledby="run-detail">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="run-detail" className="m-0 flex flex-wrap items-center gap-2 text-[15px] font-medium">{item.dataset} · {item.when}<Badge tone={item.sample ? 'warn' : 'good'}>{item.sample ? 'Dữ liệu mẫu' : 'Kết quả thật'}</Badge></h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={button} onClick={() => download(`finsight-retrieval-${item.sample ? 'sample-' : ''}${item.id}.json`, JSON.stringify(item, null, 2), 'application/json')}><Download size={14} strokeWidth={1.5} />Tải JSON</button>
          <button type="button" className={button} onClick={() => exportRun(item)}><Download size={14} strokeWidth={1.5} />Xuất Excel</button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Segmented label="Chỉ số xếp hạng" value={metric} options={METRICS} onChange={setMetric} />
        <p className="m-0 min-w-[240px] flex-1 text-xs leading-5 text-foreground/65">{HELP[metric]}</p>
      </div>

      <p className="mt-5 mb-0 text-[15px] leading-7" aria-live="polite">
        <strong className="font-medium">{selected.name}</strong> đạt {label} {percent(selected.run.overall[metric])}, {selected.id === BASELINE ? 'đây là mốc production.' : <>so với <strong className="font-medium">like</strong> (production) {percent(baseline.run.overall[metric])}: <span className={delta >= 0 ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300'}>{delta >= 0 ? '+' : '−'}{Math.abs(delta).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} điểm</span>.</>}
      </p>

      <div className={`${panel} mt-4 overflow-x-auto`}>
        <StockTableHighlight attribute="data-row">
        <table className="relative z-10 w-full min-w-[820px] border-collapse text-xs">
          <thead className="border-b border-foreground/20"><tr><th className={th}>Chiến lược</th><th className={`${th} w-[30%]`}>{label}</th>{METRICS.filter(([id]) => id !== metric).map(([id, text]) => <th key={id} className={`${th} text-right`}>{text}</th>)}<th className={`${th} text-right`} title="Số ký tự trung bình đưa cho model trong top 5">Ký tự@5</th><th className={`${th} text-right`} title="Bài trả về trong top 10 chưa được chấm liên quan">Chưa chấm</th></tr></thead>
          <tbody>
            {ranked.map(({ id, name, about, run }) => {
              const value = run?.overall[metric];
              const on = id === selected.id;
              return (
                <tr key={id} data-row={run ? id : undefined} onClick={run ? () => setSelectedId(id) : undefined} className={`border-b border-foreground/10 last:border-b-0 ${!run ? 'text-foreground/60' : on ? 'cursor-pointer bg-foreground/10' : 'cursor-pointer'}`}>
                  <td className={td}><button type="button" disabled={!run} aria-pressed={on} className="flex items-center gap-2 text-left text-xs text-foreground disabled:text-foreground/60"><span className="font-mono">{name}</span>{id === BASELINE && <Badge tone="warn">production</Badge>}</button><span className="mt-1 block text-[11px] text-foreground/60">{about}</span></td>
                  {run ? <>
                    <td className={td}><div className="flex items-center gap-3"><div className="h-2 flex-1 bg-foreground/10"><div className={`h-full transition-[width] duration-200 ${on ? 'bg-market-accent' : 'bg-foreground/55'}`} style={{ width: `${(value ?? 0) * 100}%` }} /></div><span className="w-14 text-right font-medium tabular-nums">{percent(value)}</span></div></td>
                    {METRICS.filter(([key]) => key !== metric).map(([key]) => <td key={key} className={`${td} text-right tabular-nums`}>{percent(run.overall[key])}</td>)}
                    <td className={`${td} text-right tabular-nums`}>{run.overall['chars@5']?.toLocaleString('vi-VN') ?? '—'}</td>
                    <td className={`${td} text-right tabular-nums`}>{run.overall['unjudged@10']}</td>
                  </> : <td colSpan={6} className={`${td} text-right`}>Chưa chạy</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
        </StockTableHighlight>
      </div>

      <section className="mt-8" aria-labelledby="by-category">
        <h2 id="by-category" className="m-0 text-[15px] font-medium">{label} theo loại câu hỏi</h2>
        {metric === 'evidence@5' && <p className="mt-2 mb-0 text-xs text-foreground/65">Chỉ nhóm detail có chỉ số này, các nhóm khác hiển thị “—”.</p>}
        <div className={`${panel} mt-3 overflow-x-auto`}>
          <table className="w-full min-w-[720px] border-collapse text-xs tabular-nums">
            <thead className="border-b border-foreground/20"><tr><th className={th}>Chiến lược</th>{categories.map((c) => <th key={c} className={`${th} text-right`}>{c} <span className="text-foreground/50">({baseline.run.byCategory[c].cases})</span></th>)}</tr></thead>
            <tbody>{ranked.map(({ id, name, run }) => <tr key={id} onClick={run ? () => setSelectedId(id) : undefined} className={`border-b border-foreground/10 last:border-b-0 ${run ? 'cursor-pointer' : 'text-foreground/60'}`}><th scope="row" className={`px-3 py-2 text-left font-mono font-normal whitespace-nowrap ${id === selected.id ? 'bg-foreground text-background' : ''}`}>{name}</th>{categories.map((c) => <td key={c} className="px-3 py-2 text-right" style={heat(run?.byCategory[c]?.[metric])}>{percent(run?.byCategory[c]?.[metric])}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className={`${panel} mt-8 p-5`} aria-labelledby="rerun">
        <h2 id="rerun" className="m-0 text-[15px] font-medium">Chạy lại trên máy</h2>
        <p className="mt-2 mb-0 text-xs leading-6 text-foreground/70">Chưa có API chạy benchmark từ trang admin. Chạy lệnh này trong <code>finsights-ai-service</code>; các retriever dùng embedding hoặc rerank sẽ gọi dịch vụ trả phí.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <div className="w-[220px]"><AdminSelect hideLabel label="Chọn retriever" value={selected.id} options={measured.map((row) => [row.id, row.name] as const)} onChange={setSelectedId} /></div>
          <code className="min-w-0 flex-1 basis-[320px] rounded-xs bg-foreground/5 px-3 py-2.5 font-mono text-[11px] overflow-hidden whitespace-nowrap">{command}</code>
          <button type="button" className={button} onClick={copy}>{copied ? <Check size={14} /> : <Copy size={14} strokeWidth={1.5} />}{copied ? 'Đã chép' : 'Chép lệnh'}</button>
        </div>
      </section>
    </section>
  );
}

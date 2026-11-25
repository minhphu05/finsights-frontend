'use client';

import { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import report from './retrieval-report.json';
import { Badge, PageHeader, Segmented, SourceNote, button, control, download, panel, td, th } from './ui';

// Snapshot of finsights-ai-service/evals/reports/v2_*.json (87 cases, Sep – 20 Nov 2026).
type Metric = 'hit@5' | 'mrr@10' | 'precision@5' | 'evidence@5';
type Scores = Partial<Record<Metric, number | null>> & { cases: number; 'unjudged@10': number; 'chars@5'?: number };
type Run = { id: string; overall: Scores; byCategory: Record<string, Scores> };
const RUNS = report as unknown as Run[];
const BASELINE = 'like'; // search_news in production still matches with SQL LIKE.

const METRICS = [['mrr@10', 'MRR@10'], ['hit@5', 'Hit@5'], ['precision@5', 'Precision@5'], ['evidence@5', 'Evidence@5']] as const;
const HELP: Record<Metric, string> = {
  'mrr@10': 'Nghịch đảo thứ hạng của bài đúng đầu tiên trong top 10. Càng gần 100% thì bài đúng càng đứng đầu.',
  'hit@5': 'Tỷ lệ câu hỏi có ít nhất một bài đúng trong top 5.',
  'precision@5': 'Tỷ lệ bài đúng trong số bài đã chấm ở top 5. Bài chưa chấm không bị tính là sai.',
  'evidence@5': 'Chỉ tính nhóm detail: đoạn văn trả về có chứa đúng câu bằng chứng hay không.',
};
const ABOUT: Record<string, string> = {
  like: 'SQL LIKE trên tiêu đề và tóm tắt',
  bm25: 'Từ khóa BM25 trên chunk',
  dense: 'Voyage embedding trên tóm tắt',
  'chunks-top2': 'Dense trên chunk, 2 đoạn mỗi bài',
  structure: 'Chunk theo cấu trúc bài',
  hybrid: 'BM25 + dense, gộp bằng RRF',
  rerank80: 'Dense 80 chunk rồi Voyage rerank',
  'hybrid-rerank80': 'Hybrid rồi Voyage rerank 80',
  'rerank80_rerank-3-lite': 'rerank80 với rerank-3-lite',
  'rerank80_rerank-3': 'rerank80 với rerank-3',
  'structure-rerank80_rerank-3-lite': 'Structure + rerank-3-lite',
  'structure-rerank80_rerank-3': 'Structure + rerank-3',
  'jev-point80': 'Rerank bằng Jev, chấm từng đoạn',
  gate10: 'Rerank rồi Jev lọc ngưỡng 0,1',
  gate30: 'Rerank rồi Jev lọc ngưỡng 0,3',
  gate50: 'Rerank rồi Jev lọc ngưỡng 0,5',
  gate70: 'Rerank rồi Jev lọc ngưỡng 0,7',
};

const percent = (v?: number | null) => (v === null || v === undefined ? '—' : `${(v * 100).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`);
const heat = (v?: number | null) => ({ backgroundColor: v ? `color-mix(in srgb, var(--color-market-accent) ${Math.round(v ** 3 * 34)}%, transparent)` : undefined });

export default function RetrievalBenchmark() {
  const [metric, setMetric] = useState<Metric>('mrr@10');
  const [selectedId, setSelectedId] = useState('structure-rerank80_rerank-3');
  const [copied, setCopied] = useState(false);
  const ranked = [...RUNS].sort((a, b) => (b.overall[metric] ?? -1) - (a.overall[metric] ?? -1));
  const baseline = RUNS.find((run) => run.id === BASELINE)!;
  const selected = RUNS.find((run) => run.id === selectedId)!;
  const categories = Object.keys(baseline.byCategory);
  const label = METRICS.find(([id]) => id === metric)![1];
  const delta = ((selected.overall[metric] ?? 0) - (baseline.overall[metric] ?? 0)) * 100;
  // Reports named "<retriever>_<model>" differ only by rerank model, which is not a CLI choice.
  const command = `uv run --env-file .env python -m evals.runners.retrieval --retriever ${selectedId.split('_')[0]} --dataset evals/datasets/news_topics_v2.jsonl`;

  async function copy() {
    try { await navigator.clipboard.writeText(command); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  }

  return (
    <>
      <PageHeader
        title="Benchmark truy xuất"
        description="So sánh các chiến lược tìm tin trên cùng bộ 87 câu hỏi. Chọn một dòng để đối chiếu với cách tìm đang chạy trên production."
        actions={<button type="button" className={button} onClick={() => download('finsight-retrieval-v2.json', JSON.stringify(RUNS, null, 2), 'application/json')}><Download size={14} strokeWidth={1.5} />Tải báo cáo</button>}
      />
      <SourceNote>Ảnh chụp từ <code>finsights-ai-service/evals/reports/v2_*.json</code>. Chưa tự cập nhật qua API.</SourceNote>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Segmented label="Chỉ số xếp hạng" value={metric} options={METRICS} onChange={setMetric} />
        <p className="m-0 min-w-[240px] flex-1 text-xs leading-5 text-foreground/65">{HELP[metric]}</p>
      </div>

      <p className="mt-5 mb-0 text-[15px] leading-7" aria-live="polite">
        <strong className="font-medium">{selected.id}</strong> đạt {label} {percent(selected.overall[metric])}, {selected.id === BASELINE ? 'đây là mốc production.' : <>so với <strong className="font-medium">like</strong> (production) {percent(baseline.overall[metric])}: <span className={delta >= 0 ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300'}>{delta >= 0 ? '+' : '−'}{Math.abs(delta).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} điểm</span>.</>}
      </p>

      <div className={`${panel} mt-4 overflow-x-auto`}>
        <table className="w-full min-w-[820px] border-collapse text-xs">
          <thead className="border-b border-foreground/20"><tr><th className={th}>Chiến lược</th><th className={`${th} w-[30%]`}>{label}</th>{METRICS.filter(([id]) => id !== metric).map(([id, text]) => <th key={id} className={`${th} text-right`}>{text}</th>)}<th className={`${th} text-right`} title="Số ký tự trung bình đưa cho model trong top 5">Ký tự@5</th><th className={`${th} text-right`} title="Bài trả về trong top 10 chưa được chấm liên quan">Chưa chấm</th></tr></thead>
          <tbody>
            {ranked.map((run) => {
              const value = run.overall[metric];
              const on = run.id === selectedId;
              return (
                <tr key={run.id} onClick={() => setSelectedId(run.id)} className={`cursor-pointer border-b border-foreground/10 last:border-b-0 ${on ? 'bg-foreground/10' : 'hover:bg-foreground/5'}`}>
                  <td className={td}><button type="button" aria-pressed={on} className="flex items-center gap-2 text-left text-xs text-foreground"><span className="font-mono">{run.id}</span>{run.id === BASELINE && <Badge tone="warn">production</Badge>}</button><span className="mt-1 block text-[11px] text-foreground/60">{ABOUT[run.id]}</span></td>
                  <td className={td}><div className="flex items-center gap-3"><div className="h-2 flex-1 bg-foreground/10"><div className={`h-full transition-[width] duration-200 ${on ? 'bg-market-accent' : 'bg-foreground/55'}`} style={{ width: `${(value ?? 0) * 100}%` }} /></div><span className="w-14 text-right font-medium tabular-nums">{percent(value)}</span></div></td>
                  {METRICS.filter(([id]) => id !== metric).map(([id]) => <td key={id} className={`${td} text-right tabular-nums`}>{percent(run.overall[id])}</td>)}
                  <td className={`${td} text-right tabular-nums`}>{run.overall['chars@5']?.toLocaleString('vi-VN') ?? '—'}</td>
                  <td className={`${td} text-right tabular-nums`}>{run.overall['unjudged@10']}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="mt-8" aria-labelledby="by-category">
        <h2 id="by-category" className="m-0 text-[15px] font-medium">{label} theo loại câu hỏi</h2>
        {metric === 'evidence@5' && <p className="mt-2 mb-0 text-xs text-foreground/65">Chỉ nhóm detail có chỉ số này, các nhóm khác hiển thị “—”.</p>}
        <div className={`${panel} mt-3 overflow-x-auto`}>
          <table className="w-full min-w-[720px] border-collapse text-xs tabular-nums">
            <thead className="border-b border-foreground/20"><tr><th className={th}>Chiến lược</th>{categories.map((c) => <th key={c} className={`${th} text-right`}>{c} <span className="text-foreground/50">({baseline.byCategory[c].cases})</span></th>)}</tr></thead>
            <tbody>{ranked.map((run) => <tr key={run.id} onClick={() => setSelectedId(run.id)} className="cursor-pointer border-b border-foreground/10 last:border-b-0"><th scope="row" className={`px-3 py-2 text-left font-mono font-normal whitespace-nowrap ${run.id === selectedId ? 'bg-foreground text-background' : ''}`}>{run.id}</th>{categories.map((c) => <td key={c} className="px-3 py-2 text-right" style={heat(run.byCategory[c]?.[metric])}>{percent(run.byCategory[c]?.[metric])}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className={`${panel} mt-8 p-5`} aria-labelledby="rerun">
        <h2 id="rerun" className="m-0 text-[15px] font-medium">Chạy lại trên máy</h2>
        <p className="mt-2 mb-0 text-xs leading-6 text-foreground/70">Chưa có API chạy benchmark từ trang admin. Chạy lệnh này trong <code>finsights-ai-service</code>; các retriever dùng embedding hoặc rerank sẽ gọi dịch vụ trả phí.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <select className={control} value={selectedId} onChange={(e) => setSelectedId(e.target.value)} aria-label="Chọn retriever">{RUNS.map((run) => <option key={run.id}>{run.id}</option>)}</select>
          <code className="min-w-0 flex-1 basis-[320px] overflow-x-auto rounded-xs bg-foreground/5 px-3 py-2.5 font-mono text-[11px] whitespace-nowrap">{command}</code>
          <button type="button" className={button} onClick={copy}>{copied ? <Check size={14} /> : <Copy size={14} strokeWidth={1.5} />}{copied ? 'Đã chép' : 'Chép lệnh'}</button>
        </div>
      </section>
    </>
  );
}

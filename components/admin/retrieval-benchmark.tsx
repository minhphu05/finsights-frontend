'use client';

import { useRef, useState } from 'react';
import { FileJson2, Upload, X } from 'lucide-react';
import RetrievalHistory from './retrieval-history';
import { AdminSelect, PageHeader, Segmented, button, buttonSolid, download, panel } from './ui';

// Models of finsights-ai-service/configs/models.yaml and app/integrations/jev. No API lists them yet.
const NONE = 'none';
const EMBEDDINGS = [['voyage-4', 'voyage-4'], ['bge-m3', 'bge-m3']] as const;
const RERANKS = [['rerank-3', 'rerank-3'], [NONE, 'Không dùng']] as const;
const DECISIONS = [['jev-1.14.0', 'jev-1.14.0'], [NONE, 'Không dùng']] as const;
const SAMPLE = [{ id: 'sample-1', question: 'Chuyên gia nhận định thế nào về chu kỳ lãi suất cao trong tháng 9/2026?', query: 'chu kỳ lãi suất cao', date_from: '2026-09-01', date_to: '2026-09-30', relevant: ['<article_uid>'] }];

type Question = { question: string };

/** Reads a JSON array, `{ "questions": [...] }`, or JSON Lines like the eval datasets. */
function readQuestions(text: string): Question[] {
  let value: unknown;
  try { value = JSON.parse(text); }
  catch {
    value = text.split('\n').filter((line) => line.trim()).map((line, index) => {
      try { return JSON.parse(line) as unknown; } catch { throw new Error(`Dòng ${index + 1} không phải JSON hợp lệ.`); }
    });
  }
  const list = Array.isArray(value) ? value : (value as { questions?: unknown } | null)?.questions;
  if (!Array.isArray(list)) throw new Error('File cần là một mảng câu hỏi, object có trường questions, hoặc JSON Lines.');
  // The datasets start with a {"max_article_id": N} line, which is not a question.
  const rows = list.filter((row) => !(row && typeof row === 'object' && 'max_article_id' in row));
  if (!rows.length) throw new Error('File chưa có câu hỏi nào.');
  if (rows.length > 1000) throw new Error('Một tập dữ liệu tối đa 1.000 câu hỏi.');
  return rows.map((row, index) => {
    const question = (row as { question?: unknown } | null)?.question;
    if (typeof question !== 'string' || !question.trim()) throw new Error(`Câu hỏi ${index + 1} cần có trường question dạng chuỗi.`);
    return { question: question.trim() };
  });
}

function NewRun() {
  const [dataset, setDataset] = useState<{ name: string; questions: Question[] } | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [embedding, setEmbedding] = useState<string>(EMBEDDINGS[0][0]);
  const [rerank, setRerank] = useState<string>(RERANKS[0][0]);
  const [decision, setDecision] = useState<string>(DECISIONS[0][0]);
  const file = useRef<HTMLInputElement>(null);

  async function load(picked?: File) {
    if (!picked) return;
    setError('');
    if (!/\.jsonl?$/i.test(picked.name)) return setError('Chỉ hỗ trợ file .json hoặc .jsonl.');
    if (picked.size > 5 * 1024 * 1024) return setError('File vượt quá 5 MB. Hãy chia nhỏ bộ câu hỏi.');
    try { setDataset({ name: picked.name, questions: readQuestions(await picked.text()) }); }
    catch (reason) { setDataset(null); setError(reason instanceof Error ? reason.message : 'Không đọc được file.'); }
  }

  return (
    <section className={`${panel} mt-5 p-5`} aria-labelledby="new-run">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="new-run" className="m-0 text-[15px] font-medium">Chạy benchmark mới</h2>
        <button type="button" className={button} onClick={() => download('finsight-retrieval-questions.sample.json', JSON.stringify({ questions: SAMPLE }, null, 2), 'application/json')}><FileJson2 size={14} strokeWidth={1.5} />Tải JSON mẫu</button>
      </div>
      <input ref={file} type="file" accept=".json,.jsonl,application/json" className="sr-only" onChange={(e) => { void load(e.currentTarget.files?.[0]); e.currentTarget.value = ''; }} />
      <button type="button" onClick={() => file.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); void load(e.dataTransfer.files[0]); }} className={`mt-4 flex w-full flex-col items-center gap-2 rounded-xs border border-dashed px-4 py-7 text-center transition-colors ${dragging ? 'border-foreground bg-foreground/10' : 'border-foreground/35 hover:border-foreground/70 hover:bg-foreground/5'}`}>
        <Upload size={18} strokeWidth={1.5} /><span className="text-[13px]">Kéo file câu hỏi vào đây hoặc bấm để chọn</span><span className="text-[11px] text-foreground/60">.json hoặc .jsonl, tối đa 5 MB và 1.000 câu hỏi</span>
      </button>
      {error && <p role="alert" className="mt-3 mb-0 text-xs text-red-800 dark:text-red-300">{error}</p>}
      {dataset && (
        <div className="mt-3 rounded-xs bg-foreground/5 px-4 py-3 text-xs">
          <div className="flex items-center justify-between gap-3"><span className="min-w-0 truncate"><strong className="font-medium">{dataset.name}</strong> · {dataset.questions.length} câu hỏi</span><button type="button" className="p-1 text-foreground/65 hover:text-foreground" onClick={() => setDataset(null)} aria-label="Bỏ file"><X size={14} /></button></div>
          <ol className="mt-2 mb-0 max-h-40 overflow-y-auto pl-5 leading-6 text-foreground/70" data-lenis-prevent>{dataset.questions.map((row, index) => <li key={index}>{row.question}</li>)}</ol>
        </div>
      )}
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <AdminSelect label="Model embedding" value={embedding} options={EMBEDDINGS} onChange={setEmbedding} />
        <AdminSelect label="Model rerank" value={rerank} options={RERANKS} onChange={setRerank} />
        <AdminSelect label="Model quyết định" value={decision} options={DECISIONS} onChange={setDecision} />
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
        <span className="text-[11px] text-foreground/60">Chưa có API chạy benchmark từ trang admin.</span>
        <button type="button" className={buttonSolid} disabled>Chạy benchmark</button>
      </div>
    </section>
  );
}

const VIEWS = [['new', 'Chạy mới'], ['history', 'Lịch sử']] as const;

export default function RetrievalBenchmark() {
  const [view, setView] = useState<(typeof VIEWS)[number][0]>('history');
  return (
    <>
      <PageHeader title="Benchmark truy xuất" description="Chạy benchmark trên một bộ câu hỏi và xem lại kết quả của từng lần chạy." />
      <div className="mt-5"><Segmented label="Nội dung" value={view} options={VIEWS} onChange={setView} /></div>
      {/* Stays mounted so the chosen file and models survive a tab switch. */}
      <div hidden={view !== 'new'}><NewRun /></div>
      {view === 'history' && <RetrievalHistory />}
    </>
  );
}

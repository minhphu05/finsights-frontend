'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Newspaper, Search } from '@/components/icons';
import { getStockFinancials, listFinancialDocuments, type FinancialDocument, type FinancialPeriod } from '@/lib/api';
import { number } from '@/lib/data';
import { useAppData } from './shell';

const inputClass = 'rounded-xs border border-solid border-foreground/25 bg-background px-3 py-2.5 text-xs text-foreground';
const familyName = (value: string) => ({ balance_sheet: 'Bảng cân đối kế toán', income_statement: 'Kết quả kinh doanh', cash_flow: 'Lưu chuyển tiền tệ', ratios: 'Chỉ số tài chính' }[value] || value || 'Chỉ tiêu khác');
function displayValue(raw: string, unit: string, multiplier: string) {
  const value = Number(raw);
  if (!Number.isFinite(value)) return raw || '—';
  const factor = Number(multiplier || '1');
  const normalized = value * (Number.isFinite(factor) ? factor : 1);
  const formatted = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(normalized);
  return `${formatted}${unit ? ` ${unit}` : ''}`;
}
function formatDate(timestamp: number) {
  return timestamp ? new Date(timestamp).toLocaleDateString('vi-VN', { dateStyle: 'medium' }) : 'Ngày chưa rõ';
}

export default function FinancialReports() {
  const params = useSearchParams();
  const { stocks } = useAppData();
  const [symbol, setSymbol] = useState('');
  const [periodType, setPeriodType] = useState('quarter');
  const [query, setQuery] = useState('');
  const [documents, setDocuments] = useState<FinancialDocument[]>([]);
  const [periods, setPeriods] = useState<FinancialPeriod[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { setSymbol((params.get('ma') || '').toUpperCase()); }, [params]);
  useEffect(() => {
    let active = true;
    setLoadingDocs(true);
    listFinancialDocuments({ symbol: symbol || undefined, limit: 100 })
      .then((result) => { if (active) setDocuments(result.documents || []); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Không tải được tài liệu.'); })
      .finally(() => { if (active) setLoadingDocs(false); });
    if (!symbol) { setPeriods([]); setLoadingPeriods(false); return () => { active = false; }; }
    setLoadingPeriods(true);
    getStockFinancials(symbol, periodType)
      .then((result) => { if (active) { setPeriods(result.periods || []); setError(''); } })
      .catch((reason) => { if (active) { setPeriods([]); setError(reason instanceof Error ? reason.message : 'Không tải được báo cáo tài chính.'); } })
      .finally(() => { if (active) setLoadingPeriods(false); });
    return () => { active = false; };
  }, [symbol, periodType]);

  const visibleDocuments = useMemo(() => documents.filter((document) => `${document.title} ${document.summary} ${document.symbol} ${document.kind} ${document.source_code}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'))), [documents, query]);
  const families = useMemo(() => Array.from(new Set(periods.flatMap((period) => period.values.map((value) => value.statement_family || value.metric_group || 'other')))), [periods]);
  return (
    <main className="container py-28 sm:py-36">
      <header className="mb-12 border-b border-solid border-foreground/20 pb-8">
        <p className="text-[10px] tracking-[0.18em] text-foreground/60 uppercase">HỒ SƠ DOANH NGHIỆP</p>
        <h1 className="mt-4 max-w-3xl font-editorial text-[clamp(36px,5vw,64px)] leading-tight font-normal tracking-[-0.04em]">Báo cáo tài chính & công bố.</h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-foreground/65">Tra cứu báo cáo theo quý, năm và mở tài liệu gốc do doanh nghiệp hoặc cơ quan quản lý công bố.</p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <label className="sr-only" htmlFor="report-symbol">Mã cổ phiếu</label>
          <select id="report-symbol" className={inputClass} value={symbol} onChange={(event) => setSymbol(event.target.value)}><option value="">Tất cả doanh nghiệp</option>{stocks.map((stock) => <option key={stock.symbol} value={stock.symbol}>{stock.symbol} · {stock.short}</option>)}</select>
          {symbol && <label className="sr-only" htmlFor="period-type">Kỳ báo cáo</label>}
          {symbol && <select id="period-type" className={inputClass} value={periodType} onChange={(event) => setPeriodType(event.target.value)}><option value="quarter">Theo quý</option><option value="year">Theo năm</option></select>}
          <Link className="text-xs underline underline-offset-4" href={symbol ? `/?ma=${symbol}` : '/'}>Xem biểu đồ giá {symbol || 'thị trường'}</Link>
        </div>
      </header>

      {symbol && <section className="mb-16" aria-labelledby="statements-heading">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] tracking-[0.16em] text-foreground/55 uppercase">DỮ LIỆU CÓ CẤU TRÚC</p><h2 id="statements-heading" className="mt-2 font-editorial text-3xl font-normal">{symbol} · {periodType === 'quarter' ? 'Báo cáo theo quý' : 'Báo cáo theo năm'}</h2></div><span className="text-xs text-foreground/55">Đơn vị và trạng thái kiểm toán lấy từ nguồn dữ liệu</span></div>
        {loadingPeriods ? <p className="py-8 text-sm text-foreground/60">Đang tải các kỳ báo cáo…</p> : periods.length ? <div className="mt-6 space-y-8">{families.map((family) => {
          const byLine = new Map<string, FinancialPeriod['values'][number]>();
          for (const period of periods) for (const value of period.values) if ((value.statement_family || value.metric_group || 'other') === family) byLine.set(value.line_key, value);
          const lines = Array.from(byLine.values()).sort((a, b) => a.row_order - b.row_order);
          return <section key={family} className="overflow-hidden border border-solid border-foreground/15"><h3 className="border-b border-solid border-foreground/15 bg-foreground/[0.03] px-4 py-3 text-xs font-medium">{familyName(family)}</h3><div className="overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-left text-xs tabular-nums"><thead><tr className="border-b border-solid border-foreground/15 text-[10px] text-foreground/60"><th className="sticky left-0 bg-background px-4 py-3 font-medium">Chỉ tiêu</th>{periods.map((period) => <th key={period.period_code} className="px-4 py-3 text-right font-medium">{period.period_code}<small className="mt-1 block">{period.audit_status}</small></th>)}</tr></thead><tbody>{lines.map((line) => <tr key={line.line_key} className="border-b border-solid border-foreground/10 last:border-0"><th scope="row" className="sticky left-0 max-w-[280px] bg-background px-4 py-3 text-left font-normal">{line.canonical_name || line.source_label || line.line_key}</th>{periods.map((period) => { const value = period.values.find((item) => item.line_key === line.line_key); return <td key={period.period_code} className="px-4 py-3 text-right">{value ? displayValue(value.value, value.unit, value.unit_multiplier) : '—'}</td>; })}</tr>)}</tbody></table></div></section>;
        })}</div> : <p className="mt-6 border border-dashed border-foreground/20 p-6 text-sm text-foreground/60">Chưa có số liệu tài chính có cấu trúc cho {symbol} ở kỳ đã chọn. Xem danh sách tài liệu công bố bên dưới.</p>}
      </section>}

      <section aria-labelledby="documents-heading">
        <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-[10px] tracking-[0.16em] text-foreground/55 uppercase">TÀI LIỆU GỐC</p><h2 id="documents-heading" className="mt-2 font-editorial text-3xl font-normal">Báo cáo và công bố</h2><p className="mt-2 text-xs text-foreground/60">{visibleDocuments.length} tài liệu hiển thị · {symbol || 'toàn bộ mã'}</p></div><label className="flex items-center gap-3 border-b border-solid border-foreground/30 pb-2 text-foreground"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-48 bg-transparent text-xs outline-none placeholder:text-foreground/55" placeholder="Tìm báo cáo…" /></label></div>
        {error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}
        {loadingDocs ? <p className="py-8 text-sm text-foreground/60">Đang tải tài liệu…</p> : <div className="mt-7">{visibleDocuments.map((document) => <article key={document.uid} className="grid gap-4 border-t border-solid border-foreground/15 py-5 sm:grid-cols-[48px_1fr_auto] sm:items-center"><span className="grid size-11 place-items-center border border-solid border-foreground/20 text-foreground/65"><Newspaper size={19} /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2 text-[10px] text-foreground/55"><span>{document.symbol || 'Doanh nghiệp'}</span><span>·</span><span>{document.kind.replaceAll('_', ' ')}</span><span>·</span><span>{document.source_code}</span><span>·</span><span>{formatDate(document.published_at_unix_ms)}</span></div><h3 className="mt-2 text-sm font-medium leading-6">{document.title}</h3>{document.summary && <p className="mt-1 line-clamp-2 text-xs leading-6 text-foreground/60">{document.summary}</p>}</div>{document.original_url ? <a href={document.original_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs underline underline-offset-4">Mở tài liệu <ArrowUpRight size={14} /></a> : document.document_asset_uid ? <span className="text-[10px] text-foreground/55">Đã lưu tệp</span> : <span className="text-[10px] text-foreground/55">Không có liên kết</span>}</article>)}{!visibleDocuments.length && !error && <p className="border-t border-solid border-foreground/15 py-10 text-sm text-foreground/60">{loadingDocs ? 'Đang tải…' : 'Chưa có tài liệu phù hợp.'}</p>}</div>}
      </section>
      <p className="mt-12 border-t border-solid border-foreground/15 pt-5 text-[10px] leading-6 text-foreground/55">Tài liệu và số liệu được trình bày theo dữ liệu nguồn. Hãy kiểm tra kỳ báo cáo, đơn vị tính và trạng thái kiểm toán trước khi so sánh.</p>
    </main>
  );
}

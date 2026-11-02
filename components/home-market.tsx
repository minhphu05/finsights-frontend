'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { indices, stocks, number, signed } from '@/lib/data';
import { useWatch } from './shell';
import PriceChart from './price-chart';
import { LineIcon } from './home';
import MarketIndices from './market-indices';
import StockTableHighlight from './stock-table-highlight';
import { scrollToSection } from '@/lib/scroll';

const control = 'rounded-xs border border-solid border-foreground/25 bg-transparent px-4 py-2.5 text-xs text-foreground transition-colors hover:bg-foreground/5 focus-visible:outline-ink disabled:cursor-default disabled:opacity-35';
const activeControl = 'rounded-xs border border-solid border-foreground bg-ink px-4 py-2.5 text-xs text-primary';
const positive = (value: number) => value < 0 ? 'text-red-800 dark:text-red-300' : value > 0 ? 'text-emerald-800 dark:text-emerald-300' : 'text-foreground/65';
const ranges = ['1N', '1T', '1Th', '3Th', '1 năm', 'Tất cả'];
const rangeLabels = ['1 ngày', '1 tuần', '1 tháng', '3 tháng', '1 năm', 'Tất cả thời gian'];

export default function HomeMarket() {
  const params = useSearchParams();
  const { watch, toggle } = useWatch();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string>();
  const [range, setRange] = useState(0);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sector, setSector] = useState('Tất cả ngành');
  const [exchange, setExchange] = useState('Tất cả sàn');
  const [sort, setSort] = useState('default');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addQuery, setAddQuery] = useState('');
  useEffect(() => { setSelected(params.get('ma') || undefined); }, [params]);
  const selectedStock = stocks.find(stock => stock.symbol === selected);
  const current = indices[index];
  const filtered = stocks.filter(stock =>
    `${stock.symbol} ${stock.name}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')) &&
    (filter === 'all' || (filter === 'up' && stock.change > 0) || (filter === 'down' && stock.change < 0) || (filter === 'saved' && watch.includes(stock.symbol))) &&
    (sector === 'Tất cả ngành' || stock.sector === sector) &&
    (exchange === 'Tất cả sàn' || stock.exchange === exchange),
  ).sort((a, b) => sort === 'price' ? b.price - a.price : sort === 'change' ? b.change - a.change : sort === 'symbol' ? a.symbol.localeCompare(b.symbol) : 0);
  const pages = Math.max(1, Math.ceil(filtered.length / 6));
  const safePage = Math.min(page, pages);
  const visible = filtered.slice((safePage - 1) * 6, safePage * 6);
  const saved = stocks.filter(stock => watch.includes(stock.symbol));
  const reset = () => { setQuery(''); setFilter('all'); setSector('Tất cả ngành'); setExchange('Tất cả sàn'); setPage(1); };
  const chooseStock = (symbol: string) => {
    setSelected(symbol);
    const target = document.getElementById('home-chart');
    if (target) scrollToSection(target, 'center');
  };

  return (
    <div className="text-foreground [--chart-grid:color-mix(in_srgb,var(--color-foreground)_15%,transparent)] [--surface:var(--color-background)]">
      <MarketIndices index={index} active={!selectedStock} onSelect={position => { setIndex(position); setSelected(undefined); }} />

      <div className="grid gap-10 border-b border-solid border-foreground/20 py-10 lg:grid-cols-[minmax(0,2.8fr)_minmax(240px,1fr)] lg:gap-12">
        <section id="home-chart" className="min-w-0" aria-labelledby="chart-title">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 id="chart-title" className="font-editorial text-[28px] font-normal">Diễn biến thị trường</h3>
            <span className="text-[10px] tracking-wider text-foreground/60 uppercase">Phiên minh họa · 14:45</span>
          </div>
          <div className="mt-7 flex flex-wrap items-end justify-between gap-5">
            <div>
              <div className="flex items-center gap-3 text-xs"><span>{selectedStock?.symbol || current.name}</span><span className="text-foreground/60">{selectedStock?.short || current.exchange}</span>{selectedStock && <button className="p-1" aria-label="Trở về biểu đồ chỉ số" onClick={() => setSelected(undefined)}><LineIcon kind="close" /></button>}</div>
              <p className="mt-2 flex flex-wrap items-baseline gap-3 font-editorial text-4xl tabular-nums">{number(selectedStock?.price || current.value, selectedStock ? 0 : 2)}<span className="font-sans text-[11px] text-foreground/60">{selectedStock ? 'VND' : 'điểm'}</span><span className={`font-sans text-xs ${positive(selectedStock?.change ?? current.percent)}`}>{signed(selectedStock?.change ?? current.percent)}%</span></p>
            </div>
            <div className="flex flex-wrap gap-1" aria-label="Khoảng thời gian">
              {ranges.map((label, position) => <button key={label} className={`${range === position ? activeControl : control} !px-3 !py-2`} aria-label={rangeLabels[position]} aria-pressed={range === position} onClick={() => setRange(position)}>{label}</button>)}
            </div>
          </div>
          <div className="mt-7"><PriceChart index={index} stock={selectedStock} range={range} editorial /></div>
          <div className="mt-5 flex flex-wrap justify-between gap-3 border-t border-solid border-foreground/15 pt-4 text-[11px] text-foreground/65"><span>Khối lượng <strong className="ml-2 font-medium text-foreground">{selectedStock?.volume || current.volume}</strong></span><span>Dữ liệu giả lập, không cập nhật trực tiếp</span></div>
        </section>
        <aside className="min-w-0 lg:border-l lg:border-solid lg:border-foreground/20 lg:pl-10" aria-labelledby="home-watch-title">
          <div className="flex items-center justify-between gap-3"><h3 id="home-watch-title" className="font-editorial text-[28px] font-normal">Đang theo dõi <span className="align-top font-sans text-xs">{watch.length}</span></h3><button className="p-2" aria-label={adding ? 'Đóng thêm cổ phiếu' : 'Thêm cổ phiếu theo dõi'} aria-expanded={adding} onClick={() => setAdding(!adding)}><LineIcon kind={adding ? 'close' : 'search'} /></button></div>
          {adding && <label className="mt-5 block"><span className="sr-only">Tìm mã để theo dõi</span><input className="w-full rounded-xs border border-solid border-foreground/25 bg-transparent p-3 text-xs placeholder:text-foreground/60" placeholder="Tìm mã để theo dõi…" value={addQuery} onChange={event => setAddQuery(event.target.value)} /></label>}
          <div className="mt-5">
            {(adding ? stocks.filter(stock => `${stock.symbol} ${stock.name}`.toLocaleLowerCase('vi').includes(addQuery.toLocaleLowerCase('vi'))) : saved.slice(0, 5)).map(stock => (
              <div key={stock.symbol} className="flex items-center gap-3 border-b border-solid border-foreground/15 py-4">
                <button className="min-w-0 flex-1 text-left" onClick={() => chooseStock(stock.symbol)}><strong className="block text-[13px] font-medium">{stock.symbol}</strong><span className="mt-1 block truncate text-[11px] text-foreground/65">{stock.short}</span></button>
                {adding ? <button className={control} aria-pressed={watch.includes(stock.symbol)} aria-label={`${watch.includes(stock.symbol) ? 'Bỏ theo dõi' : 'Theo dõi'} ${stock.symbol}`} onClick={() => toggle(stock.symbol)}>{watch.includes(stock.symbol) ? 'Đã lưu' : 'Theo dõi'}</button> : <div className="text-right text-[13px] tabular-nums"><span>{number(stock.price)}</span><span className={`mt-1 block text-[11px] ${positive(stock.change)}`}>{signed(stock.change)}%</span></div>}
              </div>
            ))}
            {!adding && !saved.length && <p className="py-7 text-sm text-foreground/65">Chưa có cổ phiếu theo dõi. Bấm tìm kiếm để thêm doanh nghiệp.</p>}
            {adding && !stocks.some(stock => `${stock.symbol} ${stock.name}`.toLocaleLowerCase('vi').includes(addQuery.toLocaleLowerCase('vi'))) && <p className="py-5 text-sm text-foreground/65">Không tìm thấy mã phù hợp.</p>}
          </div>
          <Link href="/theo-doi/" className="mt-6 flex items-center gap-3 text-xs">Danh sách của bạn <LineIcon /></Link>
        </aside>
      </div>

      <section className="pt-12 pb-6" aria-labelledby="stocks-title">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div><h3 id="stocks-title" className="font-editorial text-[32px] font-normal tracking-[-0.03em]">Khám phá cổ phiếu</h3><p className="mt-2 text-[13px] text-foreground/65">Tìm cơ hội từ những doanh nghiệp bạn hiểu.</p></div>
          <div className="flex w-full gap-2 sm:w-auto"><label className="flex min-w-0 flex-1 items-center gap-3 rounded-xs border border-solid border-foreground/25 px-3 py-2.5"><LineIcon kind="search" /><input className="w-full min-w-0 border-0 bg-transparent text-xs outline-none placeholder:text-foreground/60 sm:w-44" placeholder="Tìm mã, tên công ty…" aria-label="Tìm cổ phiếu trong bảng" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} /></label><button className={control} aria-expanded={showFilters} onClick={() => setShowFilters(!showFilters)}>Bộ lọc</button></div>
        </div>
        <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2" aria-label="Lọc cổ phiếu">{[['all', 'Tất cả'], ['up', 'Tăng giá'], ['down', 'Giảm giá'], ['saved', 'Đang theo dõi']].map(([value, label]) => <button key={value} className={filter === value ? activeControl : control} aria-pressed={filter === value} onClick={() => { setFilter(value); setPage(1); }}>{label}</button>)}</div>
          <label className="flex items-center gap-2 text-[11px] text-foreground/65">Sắp xếp<select className="rounded-xs border border-solid border-foreground/25 bg-background p-2 text-foreground" value={sort} onChange={event => { setSort(event.target.value); setPage(1); }} aria-label="Sắp xếp cổ phiếu"><option value="default">Mặc định</option><option value="symbol">Mã A–Z</option><option value="price">Giá cao nhất</option><option value="change">Tăng mạnh nhất</option></select></label>
        </div>
        {showFilters && <div className="mt-5 flex flex-wrap items-end gap-5 border-y border-solid border-foreground/15 py-5">{[{ label: 'Ngành', value: sector, update: setSector, options: ['Tất cả ngành', ...new Set(stocks.map(stock => stock.sector))] }, { label: 'Sàn giao dịch', value: exchange, update: setExchange, options: ['Tất cả sàn', 'HOSE', 'HNX', 'UPCOM'] }].map(field => <label key={field.label} className="text-[11px]">{field.label}<select aria-label={field.label} className="mt-2 block rounded-xs border border-solid border-foreground/25 bg-background p-3 text-xs" value={field.value} onChange={event => { field.update(event.target.value); setPage(1); }}>{field.options.map(option => <option key={option}>{option}</option>)}</select></label>)}<button className={control} onClick={reset}>Đặt lại bộ lọc</button></div>}
        <div className="mt-6 overflow-x-auto">
          <StockTableHighlight>
          <table className="relative z-10 w-full min-w-[690px] border-collapse text-left text-xs tabular-nums">
            <thead className="border-y border-solid border-foreground/25 text-[10px] tracking-wider text-foreground/65 uppercase"><tr>{['Doanh nghiệp', 'Ngành', 'Giá (VND)', 'Thay đổi', 'Khối lượng', 'Theo dõi', 'Tin tức'].map((label, position) => <th key={label} scope="col" className={`px-3 py-4 font-medium ${position > 1 ? 'text-right' : ''}`}>{label}</th>)}</tr></thead>
            <tbody>{visible.map(stock => <tr key={stock.symbol} data-stock-row={stock.symbol} className={`border-b border-solid border-foreground/15 ${selected === stock.symbol ? 'bg-foreground/5' : ''}`}><td className="px-3 py-5"><button className="text-left" onClick={() => chooseStock(stock.symbol)}><strong className="block font-medium">{stock.symbol}<span className="ml-2 text-[9px] font-normal text-foreground/55">{stock.exchange}</span></strong><span className="mt-1 block text-[11px] text-foreground/65">{stock.short}</span></button></td><td className="px-3 py-5 text-foreground/65">{stock.sector}</td><td className="px-3 py-5 text-right font-medium">{number(stock.price)}</td><td className={`px-3 py-5 text-right ${positive(stock.change)}`}>{signed(stock.change)}%</td><td className="px-3 py-5 text-right text-foreground/65">{stock.volume}</td><td className="px-3 py-5 text-right"><button className={`${watch.includes(stock.symbol) ? activeControl : control} !px-3 !py-2`} aria-pressed={watch.includes(stock.symbol)} aria-label={`${watch.includes(stock.symbol) ? 'Bỏ theo dõi' : 'Theo dõi'} ${stock.symbol}`} onClick={() => toggle(stock.symbol)}>{watch.includes(stock.symbol) ? 'Đã lưu' : 'Theo dõi'}</button></td><td className="px-3 py-5"><Link className="flex justify-end" href={`/tin-tuc/?ma=${stock.symbol}`} aria-label={`Xem tin về ${stock.symbol}`}><LineIcon /></Link></td></tr>)}</tbody>
          </table>
          </StockTableHighlight>
        </div>
        {!visible.length && <div className="py-12 text-center"><h4 className="font-editorial text-2xl font-normal">Chưa tìm thấy cổ phiếu phù hợp</h4><p className="mt-3 text-sm text-foreground/65">Thử mã khác hoặc mở rộng bộ lọc.</p><button className={`${control} mt-5`} onClick={reset}>Xóa bộ lọc</button></div>}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-[11px] text-foreground/65"><span>{filtered.length ? `${(safePage - 1) * 6 + 1}–${Math.min(safePage * 6, filtered.length)} trên ${filtered.length} cổ phiếu` : '0 cổ phiếu'} · Dữ liệu minh họa</span><div className="flex flex-wrap gap-2"><button className={control} disabled={safePage === 1} onClick={() => setPage(safePage - 1)} aria-label="Trang trước">Trước</button>{Array.from({ length: pages }, (_, position) => <button key={position} className={safePage === position + 1 ? activeControl : control} aria-current={safePage === position + 1 ? 'page' : undefined} onClick={() => setPage(position + 1)}>{position + 1}</button>)}<button className={control} disabled={safePage === pages} onClick={() => setPage(safePage + 1)} aria-label="Trang sau">Sau</button></div></div>
      </section>
    </div>
  );
}

'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Bookmark,
  X,
  Check,
  CircleHelp,
  Clock3,
} from '@/components/icons';
import {
  stocks,
  indices,
  number,
  signed,
  articles,
  priceTone,
  type Stock,
  type Tone,
} from '@/lib/data';
import { useWatch, CompanyMark, WatchButton } from './shell';
import PriceChart from './price-chart';
import TurtleShell from './turtle-shell';

const ranges = ['1N', '1T', '1Th', '3Th', '1 năm', 'Tất cả'];
const rangeLabels = ['1 ngày', '1 tuần', '1 tháng', '3 tháng', '1 năm', 'Tất cả thời gian'];
function Trend({
  value,
  tone,
  children,
}: {
  value: number;
  tone?: Tone;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={`trend ${value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'} ${tone === 'ceil' || tone === 'floor' ? `tone-text-${tone}` : ''}`}
    >
      {value > 0 ? (
        <ArrowUpRight size={15} />
      ) : value < 0 ? (
        <ArrowDown size={14} />
      ) : (
        <span className="neutral-dash">—</span>
      )}
      {children || `${signed(value)}%`}
    </span>
  );
}
function MiniChart({ stock }: { stock: Stock }) {
  const data = stock.history,
    min = Math.min(...data),
    max = Math.max(...data);
  return (
    <svg
      className={`mini-chart ${stock.change < 0 ? 'negative' : stock.change === 0 ? 'neutral' : 'positive'}`}
      viewBox="0 0 100 32"
      role="img"
      aria-label={`Diễn biến minh họa ${stock.symbol}: ${stock.change > 0 ? 'tăng' : stock.change < 0 ? 'giảm' : 'không đổi'}`}
    >
      <polyline
        points={data
          .map(
            (v, i) =>
              `${(i / (data.length - 1)) * 100},${28 - ((v - min) / (max - min || 1)) * 24}`,
          )
          .join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default function Market({ watchOnly = false, embedded = false }: { watchOnly?: boolean; embedded?: boolean }) {
  const Root = embedded ? 'div' : 'main';
  const { watch, toggle, ready } = useWatch();
  const params = useSearchParams();
  const [index, setIndex] = useState(0),
    [range, setRange] = useState(0),
    [query, setQuery] = useState(''),
    [filter, setFilter] = useState('all'),
    [sector, setSector] = useState('Tất cả ngành'),
    [exchange, setExchange] = useState('Tất cả sàn'),
    [sort, setSort] = useState('default'),
    [page, setPage] = useState(1),
    [showFilters, setShowFilters] = useState(false),
    [adding, setAdding] = useState(false),
    [addQuery, setAddQuery] = useState('');
  const [selected, setSelected] = useState<string | undefined>(undefined);

  useEffect(() => {
    setSelected(params.get('ma') || undefined);
  }, [params]);

  const selectedStock = stocks.find((s) => s.symbol === selected);
  const current = indices[index];
  const [periodMenu, setPeriodMenu] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [query, filter, sector, exchange, watchOnly]);

  const filtered = stocks
    .filter(
      (s) =>
        (!watchOnly || watch.includes(s.symbol)) &&
        `${s.symbol} ${s.name}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')) &&
        (filter === 'all' ||
          (filter === 'up' && s.change > 0) ||
          (filter === 'down' && s.change < 0) ||
          (filter === 'saved' && watch.includes(s.symbol))) &&
        (sector === 'Tất cả ngành' || s.sector === sector) &&
        (exchange === 'Tất cả sàn' || s.exchange === exchange),
    )
    .sort((a, b) =>
      sort === 'price'
        ? b.price - a.price
        : sort === 'change'
          ? b.change - a.change
          : sort === 'symbol'
            ? a.symbol.localeCompare(b.symbol)
            : 0,
    );
  const pages = Math.max(1, Math.ceil(filtered.length / 6)),
    safePage = Math.min(page, pages),
    visible = filtered.slice((safePage - 1) * 6, safePage * 6);
  const savedStocks = stocks.filter((s) => watch.includes(s.symbol));
  const addMatches = stocks.filter((s) =>
    `${s.symbol} ${s.name}`.toLowerCase().includes(addQuery.toLowerCase()),
  );
  const reset = () => {
    setQuery('');
    setFilter('all');
    setSector('Tất cả ngành');
    setExchange('Tất cả sàn');
  };

  return (
    <Root className="container market-page">
      {!watchOnly && <TurtleShell />}
      <div className={`page-heading ${watchOnly ? '' : 'section-intro reveal'}`}>
        <div>
          {watchOnly ? <h1>Doanh nghiệp bạn quan tâm.</h1> : <h2>Soi kỹ từng nhịp.</h2>}
          <p>
            {watchOnly
              ? 'Giữ những chuyển động quan trọng ở gần bạn.'
              : 'Bốn chỉ số chính, cùng biểu đồ của mảng giáp bạn vừa chọn.'}
          </p>
        </div>
        <div className="market-meta">
          <span className="session-label">
            <span className="status-dot" />
            Phiên minh họa · 14:45
          </span>
          <div className="market-select-wrap">
            <button
              className="button market-select"
              onClick={() => setPeriodMenu(!periodMenu)}
              aria-expanded={periodMenu}
            >
              <span className="vietnam-marker" />
              Thị trường Việt Nam
              <ChevronDown size={15} />
            </button>
            {periodMenu && (
              <div className="market-select-menu">
                <Check size={16} />
                <span>
                  Việt Nam · HOSE / HNX / UPCOM<small>Bản demo hỗ trợ thị trường Việt Nam</small>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      {!watchOnly && (
        <div className="index-strip reveal" aria-label="Các chỉ số thị trường">
          {indices.map((item, i) => (
            <button
              key={item.name}
              className={`index-item ${index === i && !selectedStock ? 'index-selected' : ''}`}
              onClick={() => {
                setIndex(i);
                setSelected(undefined);
              }}
              aria-pressed={index === i && !selectedStock}
            >
              <div className="index-top">
                <span>{item.name}</span>
                <span className="exchange-label">{item.exchange}</span>
              </div>
              <div className="index-value">
                {number(item.value, 2)}
                <Trend value={item.percent} />
              </div>
              <div className="index-bottom">
                <span className={item.percent < 0 ? 'negative' : 'positive'}>
                  {signed(item.change)} điểm
                </span>
                <span>{item.volume}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      {!watchOnly && (
        <div className="market-workspace reveal">
          <section className="chart-panel panel" aria-labelledby="chart-title">
            <div className="panel-heading">
              <h2 id="chart-title">Diễn biến thị trường</h2>
              <span className="data-label">
                <span />
                Dữ liệu mẫu
              </span>
            </div>
            <div className="chart-summary">
              <div>
                <div className="chart-instrument">
                  {selectedStock ? (
                    <>
                      <CompanyMark symbol={selectedStock.symbol} />
                      <span>
                        {selectedStock.symbol}
                        <small>{selectedStock.short}</small>
                      </span>
                      <button
                        className="icon-button"
                        onClick={() => setSelected(undefined)}
                        aria-label="Trở về biểu đồ chỉ số"
                      >
                        <X size={15} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="index-square">
                        <ArrowUpRight size={19} />
                      </span>
                      <span>
                        {current.name}
                        <small>{current.exchange} · Chỉ số thị trường</small>
                      </span>
                    </>
                  )}
                </div>
                <div className="chart-number">
                  {number(selectedStock?.price || current.value, selectedStock ? 0 : 2)}
                  <small>{selectedStock ? 'VND' : 'điểm'}</small>
                  <Trend value={selectedStock ? selectedStock.change : current.percent} />
                </div>
              </div>
              <div className="chart-range" aria-label="Khoảng thời gian">
                {ranges.map((r, i) => (
                  <button
                    key={r}
                    aria-label={rangeLabels[i]}
                    aria-pressed={range === i}
                    className={range === i ? 'selected' : ''}
                    onClick={() => setRange(i)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <PriceChart index={index} stock={selectedStock} range={range} />
            <div className="chart-bottom">
              <span>
                Khối lượng <strong>{selectedStock?.volume || current.volume}</strong>
              </span>
              <span>
                Giá trị <strong>{selectedStock ? '415,8' : '12.846,5'} tỷ VND</strong>
              </span>
              <span className="chart-source">
                Phiên giả lập
                <CircleHelp size={13} />
              </span>
            </div>
          </section>
          <aside className="watch-panel panel">
            <div className="panel-heading">
              <h2>
                Đang theo dõi <span className="count-badge">{ready ? watch.length : 4}</span>
              </h2>
              <button
                className={`icon-button add-watch-button ${adding ? 'active' : ''}`}
                aria-label={adding ? 'Đóng thêm cổ phiếu' : 'Thêm cổ phiếu theo dõi'}
                onClick={() => setAdding(!adding)}
              >
                {adding ? <X size={18} /> : <Plus size={18} />}
              </button>
            </div>
            {adding ? (
              <div className="add-watch">
                <label className="small-search">
                  <Search size={16} />
                  <input
                    autoFocus
                    placeholder="Tìm mã để theo dõi"
                    value={addQuery}
                    onChange={(e) => setAddQuery(e.target.value)}
                    aria-label="Tìm mã để theo dõi"
                  />
                </label>
                <div className="add-watch-results">
                  {addMatches.map((s) => (
                    <div key={s.symbol}>
                      <span>
                        <b>{s.symbol}</b>
                        <small>{s.short}</small>
                      </span>
                      <WatchButton symbol={s.symbol} compact />
                    </div>
                  ))}
                  {!addMatches.length && <p>Không tìm thấy mã này.</p>}
                </div>
              </div>
            ) : (
              <>
                <div className="watch-list">
                  {savedStocks.slice(0, 4).map((s) => (
                    <button
                      key={s.symbol}
                      className={`watch-row ${selected === s.symbol ? 'watch-selected' : ''}`}
                      onClick={() => setSelected(s.symbol)}
                    >
                      <CompanyMark symbol={s.symbol} />
                      <span className="watch-company">
                        <strong>{s.symbol}</strong>
                        <small>{s.short}</small>
                      </span>
                      <span className="watch-price">
                        <strong>{number(s.price)}</strong>
                        <Trend value={s.change} />
                      </span>
                    </button>
                  ))}
                  {!savedStocks.length && (
                    <div className="watch-empty">
                      <Bookmark size={24} />
                      <p>Danh sách đang trống.</p>
                      <button className="text-button" onClick={() => setAdding(true)}>
                        Thêm cổ phiếu đầu tiên
                        <Plus size={15} />
                      </button>
                    </div>
                  )}
                </div>
                <Link href="/theo-doi/" className="watch-all">
                  Xem danh sách của bạn
                  <ArrowRight size={16} />
                </Link>
                <div className="watch-note">
                  <span className="watch-note-icon">
                    <Bookmark size={17} />
                  </span>
                  <p>
                    Theo sát doanh nghiệp.
                    <br />
                    <strong>Hiểu từng chuyển động.</strong>
                  </p>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
      <section className="stock-section reveal" aria-labelledby="stocks-title">
        <div className="section-heading">
          <div>
            <h2 id="stocks-title" className={watchOnly ? 'sr-only' : ''}>
              {watchOnly ? 'Danh sách theo dõi' : 'Khám phá cổ phiếu'}
            </h2>
            <p>
              {watchOnly
                ? `${watch.length} doanh nghiệp · Lưu trên trình duyệt của bạn`
                : 'Tìm cơ hội từ những doanh nghiệp bạn hiểu.'}
            </p>
          </div>
          <div className="table-tools">
            <label className="small-search">
              <Search size={17} />
              <input
                placeholder="Tìm mã, tên công ty…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Tìm cổ phiếu trong bảng"
              />
              {query && (
                <button
                  className="icon-button"
                  onClick={() => setQuery('')}
                  aria-label="Xóa tìm kiếm"
                >
                  <X size={14} />
                </button>
              )}
            </label>
            <button
              className={`filter-button ${showFilters || sector !== 'Tất cả ngành' || exchange !== 'Tất cả sàn' ? 'filter-active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
            >
              <SlidersHorizontal size={16} />
              <span>Bộ lọc</span>
            </button>
          </div>
        </div>
        <div className="table-tab-row">
          <div className="table-tabs" aria-label="Lọc cổ phiếu">
            {[
              ['all', 'Tất cả'],
              ['up', 'Tăng giá'],
              ['down', 'Giảm giá'],
              ...(!watchOnly ? [['saved', 'Đang theo dõi']] : []),
            ].map(([value, label]) => (
              <button
                key={value}
                aria-pressed={filter === value}
                className={filter === value ? 'selected' : ''}
                onClick={() => setFilter(value)}
              >
                {value === 'up' && <span className="tab-dot up-dot" />}
                {value === 'down' && <span className="tab-dot down-dot" />}
                {label}
                {value === 'all' && <small>{watchOnly ? watch.length : stocks.length}</small>}
              </button>
            ))}
          </div>
          <span className="table-unit">Đơn vị giá: VND</span>
        </div>
        {showFilters && (
          <div className="expanded-filters">
            <label>
              Ngành
              <select aria-label="Ngành" value={sector} onChange={(e) => setSector(e.target.value)}>
                <option>Tất cả ngành</option>
                {Array.from(new Set(stocks.map((s) => s.sector))).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Sàn giao dịch
              <select
                aria-label="Sàn giao dịch"
                value={exchange}
                onChange={(e) => setExchange(e.target.value)}
              >
                <option>Tất cả sàn</option>
                <option>HOSE</option>
                <option>HNX</option>
                <option>UPCOM</option>
              </select>
            </label>
            <button className="text-button" onClick={reset}>
              Đặt lại bộ lọc
              <X size={14} />
            </button>
          </div>
        )}
        <div className="stock-table-wrap">
          <table className="stock-table">
            <caption className="sr-only">Bảng giá cổ phiếu minh họa thị trường Việt Nam</caption>
            <thead>
              <tr>
                <th className="save-column">
                  <Bookmark size={14} />
                  <span className="sr-only">Theo dõi</span>
                </th>
                <th aria-sort={sort === 'symbol' ? 'ascending' : 'none'}>
                  <button onClick={() => setSort(sort === 'symbol' ? 'default' : 'symbol')}>
                    Doanh nghiệp
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="sector-column">Ngành</th>
                <th className="numeric" aria-sort={sort === 'price' ? 'descending' : 'none'}>
                  <button onClick={() => setSort(sort === 'price' ? 'default' : 'price')}>
                    Giá
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="numeric" aria-sort={sort === 'change' ? 'descending' : 'none'}>
                  <button onClick={() => setSort(sort === 'change' ? 'default' : 'change')}>
                    Thay đổi
                    <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="numeric volume-column">Khối lượng</th>
                <th className="numeric cap-column">
                  Vốn hóa <span>(tỷ)</span>
                </th>
                <th className="numeric history-column">Diễn biến</th>
                <th className="row-action-column">
                  <span className="sr-only">Chi tiết</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <tr key={s.symbol} className={selected === s.symbol ? 'row-selected' : ''}>
                  <td>
                    <button
                      className={`table-star ${watch.includes(s.symbol) ? 'is-saved' : ''}`}
                      onClick={() => toggle(s.symbol)}
                      aria-pressed={watch.includes(s.symbol)}
                      aria-label={`${watch.includes(s.symbol) ? 'Bỏ theo dõi' : 'Theo dõi'} ${s.symbol}`}
                    >
                      <Bookmark
                        size={16}
                        fill={watch.includes(s.symbol) ? 'currentColor' : 'none'}
                      />
                    </button>
                  </td>
                  <td>
                    <button
                      className="table-company"
                      onClick={() => {
                        setSelected(s.symbol);
                        if (watchOnly) window.location.href = `/?ma=${s.symbol}`;
                        else
                          document
                            .getElementById('chart-title')
                            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                    >
                      <CompanyMark symbol={s.symbol} />
                      <span>
                        <strong>
                          {s.symbol}
                          <small>{s.exchange}</small>
                        </strong>
                        <span className="company-full-name">{s.short}</span>
                      </span>
                    </button>
                  </td>
                  <td className="sector-column">
                    <span className="sector-tag">{s.sector}</span>
                  </td>
                  <td className="numeric price-cell">{number(s.price)}</td>
                  <td className="numeric change-cell">
                    <Trend value={s.change} tone={priceTone(s)} />
                    <small
                      className={s.change > 0 ? 'positive' : s.change < 0 ? 'negative' : 'neutral'}
                    >
                      {signed(Math.round(s.price - s.price / (1 + s.change / 100)), 0)}
                    </small>
                  </td>
                  <td className="numeric volume-column">{s.volume}</td>
                  <td className="numeric cap-column">{s.cap}</td>
                  <td className="numeric history-column">
                    <MiniChart stock={s} />
                  </td>
                  <td>
                    <Link
                      className="row-news-link"
                      href={`/tin-tuc/?ma=${s.symbol}`}
                      aria-label={`Xem tin về ${s.symbol}`}
                    >
                      <ArrowUpRight size={17} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length && (
            <div className="table-empty">
              <Search size={30} />
              <h3>
                {watchOnly && !watch.length
                  ? 'Chưa có cổ phiếu nào được theo dõi'
                  : 'Chưa tìm thấy cổ phiếu phù hợp'}
              </h3>
              <p>
                {watchOnly && !watch.length
                  ? 'Thêm doanh nghiệp từ trang thị trường để bắt đầu.'
                  : 'Thử mã khác hoặc mở rộng bộ lọc của bạn.'}
              </p>
              {watchOnly && !watch.length ? (
                <Link href="/" className="button button-primary">
                  Khám phá thị trường
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <button className="button" onClick={reset}>
                  Xóa bộ lọc
                </button>
              )}
            </div>
          )}
        </div>
        <div className="table-pagination">
          <span>
            {filtered.length
              ? `${(safePage - 1) * 6 + 1}–${Math.min(safePage * 6, filtered.length)} trên ${filtered.length} cổ phiếu`
              : '0 cổ phiếu'}
            <span className="demo-caption"> · Dữ liệu minh họa</span>
          </span>
          <div>
            <button
              className="pagination-arrow"
              disabled={safePage === 1}
              onClick={() => setPage(safePage - 1)}
              aria-label="Trang trước"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                className={`page-number ${safePage === i + 1 ? 'current' : ''}`}
                onClick={() => setPage(i + 1)}
                aria-current={safePage === i + 1 ? 'page' : undefined}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="pagination-arrow"
              disabled={safePage === pages}
              onClick={() => setPage(safePage + 1)}
              aria-label="Trang sau"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>
      <section className="market-news">
        <div className="section-heading reveal">
          <div>
            <h2>Đằng sau những con số</h2>
            <p>Tin được chọn lọc, đi chậm mà chắc cùng doanh nghiệp.</p>
          </div>
          <Link href="/tin-tuc/" className="text-link">
            Tất cả tin tức
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="market-news-grid reveal reveal-stagger">
          {articles.slice(0, 3).map((a) => (
            <Link key={a.slug} href={`/tin-tuc/${a.slug}/`} className="market-news-item">
              <div className="market-news-image">
                <img src={a.image} alt="" loading="lazy" />
                <span className="news-chip">
                  <i />
                  {a.category}
                </span>
              </div>
              <h3>{a.title}</h3>
              <div className="article-meta">
                <span>
                  <Clock3 size={15} />
                  {a.read}
                </span>
              </div>
              <span className="article-inline-link">
                Đọc bài viết
                <ArrowUpRight size={15} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </Root>
  );
}

'use client';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Search, X } from '@/components/icons';
import { number, signed } from '@/lib/data';
import { API_UNAVAILABLE_MESSAGE, listNews, type APIArticle } from '@/lib/api';
import { homeStyles as ui } from './home-styles';
import { LineIcon } from './home';
import { useAppData } from './shell';
import StockSelect from './stock-select';
import { ArticleRowsSkeleton, NewsFeedSkeleton } from './skeleton';

// API trả category dạng slug; chỉ các slug này là chủ đề thật. sitemap / sitemap_archive là nhãn nguồn crawl nên hiển thị chung là "Tin tức".
const CATEGORY_LABELS: Record<string, string> = { stock_market: 'Thị trường', business_finance: 'Doanh nghiệp', macro_economy: 'Vĩ mô', banking: 'Ngân hàng' };
const categories = ['', ...Object.keys(CATEGORY_LABELS)];
const labelOf = (category: string) => CATEGORY_LABELS[category] ?? 'Tin tức';
const slugOf = (topic: string) => Object.entries(CATEGORY_LABELS).find(([, label]) => label === topic)?.[0] ?? topic;
const relevanceLabel = (article: APIArticle) => article.financialRelevance === 'financial'
  ? 'Liên quan tài chính'
  : article.financialRelevance === 'needs_review'
    ? 'Chờ rà soát'
    : article.topicLabel === 'sports' ? 'Thể thao · Ngoài tài chính' : 'Không liên quan tài chính';
const tickerChip = 'inline-flex items-center gap-1 border border-solid border-foreground/25 px-2 py-1 text-[10px] tracking-wider text-foreground/80 transition-colors hover:border-foreground hover:text-foreground';
const searchBox = 'flex w-full items-center gap-3 border-b border-solid border-foreground/40 pb-1.5 text-foreground transition-colors focus-within:border-foreground sm:w-56';
const segment = 'border border-solid px-3 py-2 text-[11px] tracking-wide whitespace-nowrap transition-colors';
const segmentOn = 'border-foreground bg-foreground text-background';
const segmentOff = 'border-foreground/25 text-foreground/70 hover:border-foreground hover:text-foreground';
function SearchField({ query, setQuery }: { query: string; setQuery: (value: string) => void }) {
  return <label className={searchBox}><Search size={18} strokeWidth={1.4} className="shrink-0" /><input className="w-full min-w-0 border-0 bg-transparent text-xs outline-none placeholder:text-foreground/60" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm trong tin tức…" aria-label="Tìm trong tin tức" />{query && <button className="p-1" onClick={() => setQuery('')} aria-label="Xóa tìm tin"><X size={14} /></button>}</label>;
}
function ArticleImage({ src, className = '' }: { src: string; className?: string }) {
  return src ? <img className={className} src={src} alt="" loading="lazy" /> : <div aria-hidden="true" className={`${className} bg-gradient-to-br from-emerald-950 via-neutral-800 to-neutral-950`} />;
}

/** Topic filter whose underline slides to the chosen tab. */
function CategoryTabs({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const list = useRef<HTMLDivElement>(null);
  const [line, setLine] = useState<{ left: number; width: number } | null>(null);
  useEffect(() => {
    const element = list.current;
    if (!element) return;
    // 12px is the tab's horizontal padding, so the line spans the label only.
    const measure = () => {
      const active = element.querySelector<HTMLElement>('[aria-pressed="true"]');
      setLine(active ? { left: active.offsetLeft + 12, width: active.offsetWidth - 24 } : null);
    };
    measure();
    // Tab widths change when the web font arrives or the bar wraps.
    const observer = new ResizeObserver(measure);
    [element, ...Array.from(element.children)].forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [value]);
  return (
    <div ref={list} className="relative flex min-w-0 flex-1 gap-1 overflow-x-auto overflow-y-hidden max-md:order-first max-md:basis-full" aria-label="Chủ đề tin tức">
      {categories.map((item) => <button key={item} aria-pressed={value === item} onClick={() => onChange(item)} className={`px-3 py-2 text-xs tracking-wider whitespace-nowrap uppercase transition-colors ${value === item ? 'text-foreground' : 'text-foreground/60 hover:text-foreground'}`}>{item ? CATEGORY_LABELS[item] : 'Tất cả'}</button>)}
      {/* Mounted only once measured, so it appears in place instead of sliding in from the left. */}
      {line && <span aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 h-0.5 bg-foreground transition-[translate,width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none" style={{ translate: `${line.left}px 0`, width: line.width }} />}
    </div>
  );
}

/** Companies in the loaded articles, with the dropdowns' sliding hover highlight. */
function MentionedStocks({ stocks, onPick }: { stocks: { symbol: string; short: string; price: number; change: number }[]; onPick: (symbol: string) => void }) {
  const [active, setActive] = useState<{ top: number; height: number } | null>(null);
  const reduceMotion = useReducedMotion();
  const light = (row: HTMLElement) => setActive({ top: row.offsetTop, height: row.offsetHeight });
  return (
    <section aria-labelledby="news-mentioned-title">
      <h3 id="news-mentioned-title" className="mb-2 px-3 text-[10px] tracking-wider text-foreground/65 uppercase">Doanh nghiệp trong bản tin</h3>
      <div className="relative isolate" onPointerLeave={() => setActive(null)}>
        <AnimatePresence initial={false}>
          {active && <motion.span key="highlight" aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 rounded-xs bg-foreground/10" initial={{ y: active.top, height: active.height, opacity: 0 }} animate={{ y: active.top, height: active.height, opacity: 1 }} exit={{ opacity: 0 }} transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 40, opacity: { duration: 0.12 } }} />}
        </AnimatePresence>
        {stocks.map((stock) => <button key={stock.symbol} type="button" className="flex w-full items-center gap-3 rounded-xs px-3 py-2.5 text-left" onPointerEnter={(e) => { if (e.pointerType !== 'touch') light(e.currentTarget); }} onFocus={(e) => light(e.currentTarget)} onBlur={() => setActive(null)} onClick={() => onPick(stock.symbol)}><span className="min-w-0 flex-1"><strong className="block text-[13px] font-medium">{stock.symbol}</strong><small className="block text-[11px] text-foreground/65">{stock.short}</small></span><span className="text-right text-xs tabular-nums">{number(stock.price)}<small className={`block text-[11px] ${stock.change < 0 ? 'text-red-800 dark:text-red-300' : 'text-emerald-800 dark:text-emerald-300'}`}>{signed(stock.change)}%</small></span></button>)}
      </div>
    </section>
  );
}

export default function News() {
  const params = useSearchParams();
  const { stocks, loading: appLoading, dataError } = useAppData();
  const [category, setCategory] = useState('');
  const [relevance, setRelevance] = useState<'financial' | 'non_financial'>('financial');
  const [ticker, setTicker] = useState('');
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState<APIArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  // Which filters the articles on screen answer. Until it matches the current ones, they are stale and the skeleton shows.
  const filterKey = JSON.stringify([ticker, category, query, relevance]);
  const [loadedKey, setLoadedKey] = useState('');
  const stale = loadedKey !== filterKey;
  const resultsTop = useRef<HTMLDivElement>(null);
  // Where the next page starts. Null when the API sends no cursor (an older backend): then the offset is used.
  const [cursor, setCursor] = useState<string | null>(null);
  // Rows read from the API, duplicates included.
  const [offset, setOffset] = useState(0);
  // Bumped on every filter change, so a late "load more" answer for older filters is dropped.
  const generation = useRef(0);

  useEffect(() => {
    setTicker(params.get('ma') || '');
    const topic = params.get('chu-de') || '';
    setCategory(slugOf(topic));
  }, [params]);
  useEffect(() => {
    generation.current += 1;
    let active = true;
    const timer = setTimeout(() => {
      setBusy(true);
      setError('');
      listNews({ limit: 24, symbol: ticker, category: category && category !== 'Tất cả' ? category : '', query, relevance })
        .then((result) => { if (active) { setArticles(result.articles); setOffset(result.articles.length); setCursor(result.nextCursor || null); setTotal(result.total); setError(''); } })
        .catch((reason) => { if (active) { setError(reason instanceof Error ? reason.message : API_UNAVAILABLE_MESSAGE); setArticles([]); setTotal(0); } })
        .finally(() => { if (active) { setBusy(false); setLoadedKey(filterKey); } });
    }, 220);
    return () => { active = false; clearTimeout(timer); };
  }, [ticker, category, query, relevance]);

  // A new filter starts the list from its top, but only when the reader has already scrolled past it.
  // The marker sits 102px low (the smooth scroll's header offset), so the scroll leaves the filter bar at the top edge.
  useEffect(() => {
    const target = resultsTop.current;
    if (!target || target.getBoundingClientRect().top >= 102) return;
    // LandingMotion scrolls smoothly and cancels the event; without it the browser does the scrolling.
    if (window.dispatchEvent(new CustomEvent('finsight:scroll-to', { cancelable: true, detail: { target, block: 'start' } }))) window.scrollTo(0, window.scrollY + target.getBoundingClientRect().top - 102);
  }, [ticker, category, query, relevance]);

  const featured = articles[0];
  const clear = () => { setCategory(''); setTicker(''); setQuery(''); };
  const loadMore = () => {
    const asked = generation.current;
    const current = () => asked === generation.current;
    setBusy(true);
    setError('');
    listNews({ limit: 24, ...(cursor ? { cursor } : { offset }), symbol: ticker, category: category && category !== 'Tất cả' ? category : '', query, relevance })
      .then((result) => {
        if (!current()) return;
        // Paging by offset, news published meanwhile pushes older rows down and a page can repeat articles.
        setArticles((shown) => {
          const slugs = new Set(shown.map((article) => article.slug));
          return [...shown, ...result.articles.filter((article) => !slugs.has(article.slug))];
        });
        const next = offset + result.articles.length;
        setOffset(next);
        // In cursor mode an empty value means this was the last page.
        if (cursor !== null) setCursor(result.nextCursor);
        // An empty page means there is nothing left, whatever the total says.
        setTotal(result.articles.length ? result.total : next);
        setError('');
      })
      .catch((reason) => { if (current()) setError(reason instanceof Error ? reason.message : API_UNAVAILABLE_MESSAGE); })
      .finally(() => { if (current()) setBusy(false); });
  };
  const hasMore = cursor === null ? offset < total : cursor !== '';
  // A failed page waits for the retry button, so a broken API is not asked in a loop.
  const canLoadMore = hasMore && !busy && !error;
  // Marks the end of the list; the next page is asked for while it is still 600px below the screen.
  const [listEnd, setListEnd] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!listEnd || !canLoadMore) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      loadMore();
    }, { rootMargin: '0px 0px 600px' });
    observer.observe(listEnd);
    return () => observer.disconnect();
  }, [listEnd, canLoadMore, cursor, offset]);
  // A sidebar taller than the screen scrolls along with the page: down to its end, and back up to its start.
  const [sidebar, setSidebar] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!sidebar) return;
    let last = window.scrollY;
    const follow = () => {
      const moved = window.scrollY - last;
      last = window.scrollY;
      // Until it sticks (its computed top), it is still moving with the page and shows its start.
      const stuck = sidebar.getBoundingClientRect().top <= parseFloat(getComputedStyle(sidebar).top) + 1;
      sidebar.scrollTop = stuck ? sidebar.scrollTop + moved : 0;
    };
    window.addEventListener('scroll', follow, { passive: true });
    return () => window.removeEventListener('scroll', follow);
  }, [sidebar]);
  return (
    <div data-home className="bg-ink font-sans text-primary selection:bg-primary selection:text-ink [&_:focus-visible]:outline-primary motion-reduce:[&_*]:transition-none">
      <main>
        <section data-hero-screen className="bg-ink text-primary" aria-labelledby="news-title">
          <div className={`${ui.wrap} pt-[150px] pb-16 max-[560px]:pt-[120px]`}>
            <p data-hero-intro className={`${ui.eyebrow} mb-5 text-primary/80 max-[560px]:text-[9px] max-[560px]:tracking-[0.19em]`}>DỮ LIỆU TIN TỨC · CÓ NGUỒN VÀ THỜI ĐIỂM</p>
            <h1 id="news-title" className="max-w-[760px] font-editorial text-[clamp(38px,3.55vw,60px)] leading-[1.15] font-normal tracking-[-0.035em] max-[560px]:text-[clamp(32px,8vw,42px)]"><span className="block overflow-hidden py-[0.08em] -my-[0.08em]"><span data-hero-line className="block">Đằng sau những con số.</span></span></h1>
            <p data-hero-intro className="mt-6 max-w-[640px] font-editorial text-[17px] leading-[1.65] text-primary/85 max-[560px]:text-[15px]">Tin tức doanh nghiệp được nối với mã cổ phiếu, nguồn xuất bản và liên kết bài gốc.</p>
          </div>
        </section>
        <div ref={resultsTop} className="relative top-[102px]" />
        {/* Sits under the header while it is shown and follows it to the top edge when it hides: same distance, duration and easing as HomeHeader (1px overlap hides subpixel seams). */}
        <div role="search" aria-label="Lọc tin tức" className="sticky top-[85px] z-30 border-b border-solid border-foreground/20 bg-background text-foreground transition-[top] duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none max-[560px]:top-[75px] [body:has([data-home-header][data-hidden=true])_&]:top-0 [body:has([data-home-header][data-hidden=true])_&]:duration-[420ms] [body:has([data-home-header][data-hidden=true])_&]:ease-[cubic-bezier(0.4,0,0.6,1)]">
          <div className={`${ui.wrap} flex flex-wrap items-center gap-x-6 gap-y-3 py-3`}>
            <div className={`flex gap-2 ${showFilters ? '' : 'max-md:hidden'}`} role="group" aria-label="Phân loại mức độ liên quan đến tài chính">
              {([['financial', 'Tài chính'], ['non_financial', 'Ngoài tài chính']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={relevance === value} onClick={() => { setRelevance(value); setCategory(''); setTicker(''); }} className={`${segment} ${relevance === value ? segmentOn : segmentOff}`}>{label}</button>)}
            </div>
            <CategoryTabs value={category} onChange={setCategory} />
            <div className="flex flex-wrap items-center gap-3 max-md:w-full">
              <button type="button" aria-expanded={showFilters} onClick={() => setShowFilters(!showFilters)} className={`${segment} md:hidden ${showFilters || ticker || relevance !== 'financial' ? segmentOn : segmentOff}`}>Bộ lọc</button>
              <StockSelect stocks={stocks} value={ticker} onChange={setTicker} className={showFilters ? '' : 'max-md:hidden'} />
              <div className="min-w-0 flex-1"><SearchField query={query} setQuery={setQuery} /></div>
            </div>
          </div>
        </div>
        {!stale && featured ? <>
          <section className="relative z-10 bg-background text-foreground" aria-labelledby="news-featured-title">
            <div className={`${ui.wrap} grid gap-10 py-12 md:grid-cols-[1.25fr_1fr] md:gap-14 md:py-16`}>
              <Link href={`/tin-tuc/${featured.slug}/`} className="group relative block aspect-[16/10] overflow-hidden md:aspect-auto md:h-0 md:min-h-full"><ArticleImage className="absolute inset-0 h-full w-full object-cover transition-transform duration-400 group-hover:scale-[1.025] motion-reduce:transition-none" src={featured.image} /></Link>
              <div><div className="flex flex-wrap items-center gap-3 text-[10px] tracking-wider text-foreground/65 uppercase"><span>{labelOf(featured.category)}</span><span aria-hidden="true">·</span><span>{featured.sourceName}</span><span className="border border-solid border-foreground/20 px-2 py-1 normal-case">{relevanceLabel(featured)}</span></div><Link href={`/tin-tuc/${featured.slug}/`} className="group"><h2 id="news-featured-title" className="mt-4 font-editorial text-[clamp(28px,2.6vw,42px)] leading-[1.2] font-normal tracking-[-0.03em]">{featured.title}</h2></Link><p className="mt-5 text-[13px] leading-7 text-foreground/70">{featured.description}</p><div className="mt-6 flex flex-wrap gap-2">{featured.tickers.map((symbol) => <Link key={symbol} href={`/?ma=${symbol}`} className={tickerChip}>{symbol}<ArrowUpRight size={11} /></Link>)}</div><div className="mt-8 flex items-center justify-between gap-4 border-t border-solid border-foreground/20 pt-5 text-[11px] text-foreground/65"><span>{featured.sourceName} · {featured.time}</span><Link href={featured.sourceURL || `/tin-tuc/${featured.slug}/`} target={featured.sourceURL ? '_blank' : undefined} rel={featured.sourceURL ? 'noreferrer' : undefined} className="flex items-center gap-3 text-xs text-foreground">Đọc nguồn gốc <LineIcon /></Link></div></div>
            </div>
          </section>
          <section className="relative z-10 bg-background text-foreground" aria-labelledby="news-feed-title">
            <div className={`${ui.wrap} grid gap-12 border-t border-solid border-foreground/20 py-12 md:py-16 lg:grid-cols-[1fr_320px] lg:gap-16`}>
              <div><div className="flex flex-wrap items-end justify-between gap-5"><div><h2 id="news-feed-title" className={ui.sectionTitle}>{ticker ? `Tin về ${ticker}` : category ? labelOf(category) : relevance === 'financial' ? 'Tin liên quan đến tài chính' : 'Tin ngoài nhóm tài chính'}</h2><p className="mt-3 text-[13px] text-foreground/65">{total.toLocaleString('vi-VN')} bài đã phân loại · hiển thị {articles.length}</p></div></div>
                <div className="mt-8">{articles.slice(1).map((article) => <article key={article.slug} className="group grid grid-cols-[38%_1fr] gap-6 border-t border-solid border-foreground/20 py-7 max-[560px]:grid-cols-1 max-[560px]:gap-4"><Link href={`/tin-tuc/${article.slug}/`} className="block aspect-[16/10] self-start overflow-hidden"><ArticleImage className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transition-none" src={article.image} /></Link><div className="flex flex-col"><div className="flex flex-wrap items-center justify-between gap-3 text-[10px] tracking-wider text-foreground/65 uppercase"><span>{labelOf(article.category)}</span><span>{article.time}</span><span className="border border-solid border-foreground/20 px-2 py-1 normal-case">{relevanceLabel(article)}</span></div><Link href={`/tin-tuc/${article.slug}/`}><h3 className="mt-3 font-editorial text-[25px] leading-snug font-normal tracking-[-0.02em] max-[560px]:text-[22px]">{article.title}</h3></Link><p className="mt-3 text-xs leading-relaxed text-foreground/65">{article.description}</p><div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5"><span className="text-[11px] text-foreground/60">{article.sourceName} · {article.time}</span><div className="flex flex-wrap gap-2">{article.tickers.map((symbol) => <Link key={symbol} href={`/?ma=${symbol}`} className={tickerChip}>{symbol}</Link>)}</div></div></div></article>)}
                  <div ref={setListEnd} aria-hidden="true" />
                  {busy && hasMore && <ArticleRowsSkeleton />}
                  {error && <div className="flex flex-wrap items-center gap-4 border-t border-solid border-foreground/20 py-7"><p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p><button type="button" onClick={loadMore} className={`${segment} ${segmentOff}`}>Thử lại</button></div>}
                  {!hasMore && !busy && articles.length > 1 && <p className="border-t border-solid border-foreground/20 py-7 text-center text-xs text-foreground/60">Bạn đã xem hết tin.</p>}
                  {!articles.length && (busy ? <ArticleRowsSkeleton /> : <p className="border-t border-solid border-foreground/20 py-8 text-sm text-foreground/65">Không có bài phù hợp.</p>)}
                </div>
              </div>
              {/* Stays in view under the header and filter bar, following them when the header hides. */}
              <aside ref={setSidebar} data-lenis-prevent className="flex flex-col gap-6 lg:sticky lg:top-[170px] lg:max-h-[calc(100dvh-186px)] lg:self-start lg:overflow-y-auto lg:transition-[top,max-height] lg:duration-[560ms] lg:ease-[cubic-bezier(0.22,1,0.36,1)] lg:[scrollbar-width:none] lg:[body:has([data-home-header][data-hidden=true])_&]:top-[84px] lg:[body:has([data-home-header][data-hidden=true])_&]:max-h-[calc(100dvh-100px)] lg:[body:has([data-home-header][data-hidden=true])_&]:duration-[420ms] lg:[body:has([data-home-header][data-hidden=true])_&]:ease-[cubic-bezier(0.4,0,0.6,1)]"><section className="shrink-0 bg-ink p-6 text-primary" aria-labelledby="news-watch-title"><h2 id="news-watch-title" className="font-editorial text-[28px] leading-tight font-normal tracking-[-0.02em]">Cùng một góc nhìn.</h2><p className="mt-3 mb-6 text-xs leading-6 text-primary/75">Kết nối tin tức với doanh nghiệp bạn quan tâm.</p><Link href="/theo-doi/" className={`${ui.button} ${ui.outlineButton}`}>Danh sách theo dõi <LineIcon /></Link></section>
                <MentionedStocks stocks={stocks.filter((stock) => articles.some((article) => article.tickers.includes(stock.symbol))).slice(0, 6)} onPick={(symbol) => { setTicker(symbol); setCategory(''); setQuery(''); }} />
                <p className="border-t border-solid border-foreground/20 pt-5 text-[11px] leading-6 text-foreground/60">Bài viết giữ liên kết đến nguồn xuất bản. Nội dung chi tiết được hiển thị theo quyền sử dụng của nguồn.</p>
              </aside>
            </div>
          </section>
        </> : stale || busy ? <NewsFeedSkeleton /> : <section className="relative z-10 bg-background text-foreground"><div className={`${ui.wrap} flex flex-col items-start gap-5 py-16 md:py-24`}><Search size={34} strokeWidth={1.2} /><h2 className={ui.sectionTitle}>{error || dataError ? 'Không tải được tin tức.' : 'Chưa có tin phù hợp.'}</h2><p role={error || dataError ? 'alert' : undefined} className="text-[13px] text-foreground/65">{error || (appLoading ? 'Đang tải tin tức từ API…' : dataError || 'Thử mã khác hoặc xem lại bộ lọc.')}</p><button className={`${ui.button} ${ui.primaryButton} mt-3`} onClick={clear}>Xem tất cả tin tức <LineIcon /></button></div></section>}
      </main>
      <footer className={`${ui.wrap} flex items-center gap-[35px] border-t border-solid border-primary/30 py-[30px] text-[11px] text-primary/80 max-[850px]:flex-wrap max-[560px]:gap-[18px]`}><Link className="mr-auto font-editorial text-2xl leading-none tracking-[0.08em] text-primary" href="/">FINSIGHT</Link><span>© 2026 Finsight</span><p className="max-[850px]:w-full">Tin tức có nguồn, ngày xuất bản và mã cổ phiếu liên quan.</p></footer>
    </div>
  );
}

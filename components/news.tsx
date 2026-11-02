'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowUpRight, Search, X } from '@/components/icons';
import { articles, stocks, number, signed } from '@/lib/data';
import { homeStyles as ui } from './home-styles';
import { LineIcon } from './home';

const categories = ['Tất cả', 'Thị trường', 'Doanh nghiệp', 'Phân tích', 'Góc nhìn', 'Vĩ mô'];
const tickerChip = 'inline-flex items-center gap-1 border border-solid border-foreground/25 px-2 py-1 text-[10px] tracking-wider text-foreground/80 transition-colors hover:border-foreground hover:text-foreground';
const searchBox = 'flex w-full items-center gap-3 border-b border-solid border-foreground/40 pb-2.5 text-foreground transition-colors focus-within:border-foreground sm:w-72';

function SearchField({ query, setQuery }: { query: string; setQuery: (value: string) => void }) {
  return (
    <label className={searchBox}>
      <Search size={18} strokeWidth={1.4} className="shrink-0" />
      <input
        className="w-full min-w-0 border-0 bg-transparent text-xs outline-none placeholder:text-foreground/60"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Tìm trong tin tức…"
        aria-label="Tìm trong tin tức"
      />
      {query && (
        <button className="p-1" onClick={() => setQuery('')} aria-label="Xóa tìm tin">
          <X size={14} />
        </button>
      )}
    </label>
  );
}

export default function News() {
  const params = useSearchParams();
  const [category, setCategory] = useState('Tất cả'),
    [ticker, setTicker] = useState(''),
    [query, setQuery] = useState('');
  useEffect(() => {
    setTicker(params.get('ma') || '');
    const topic = params.get('chu-de');
    setCategory(topic && categories.includes(topic) ? topic : 'Tất cả');
  }, [params]);
  const filtered = articles.filter(
    (a) =>
      (category === 'Tất cả' || a.category === category) &&
      (!ticker || a.tickers.includes(ticker)) &&
      `${a.title} ${a.description} ${a.tickers.join(' ')}`
        .toLocaleLowerCase('vi')
        .includes(query.toLocaleLowerCase('vi')),
  );
  const featured = filtered[0];
  const clear = () => {
    setCategory('Tất cả');
    setTicker('');
    setQuery('');
  };
  return (
    <div data-home className="bg-ink font-sans text-primary selection:bg-primary selection:text-ink [&_:focus-visible]:outline-primary motion-reduce:[&_*]:transition-none">
      <main>
        <section data-hero-screen className="bg-ink text-primary" aria-labelledby="news-title">
          <div className={`${ui.wrap} pt-[150px] pb-10 max-[560px]:pt-[120px]`}>
            <p className={`${ui.eyebrow} mb-5 text-primary/80 max-[560px]:text-[9px] max-[560px]:tracking-[0.19em]`}>BẢN TIN FINSIGHT × NỘI DUNG MINH HỌA</p>
            <h1 id="news-title" className="max-w-[760px] font-editorial text-[clamp(38px,3.55vw,60px)] leading-[1.15] font-normal tracking-[-0.035em] max-[560px]:text-[clamp(32px,8vw,42px)]">Đằng sau những con số.</h1>
            <p className="mt-6 max-w-[640px] font-editorial text-[17px] leading-[1.65] text-primary/85 max-[560px]:text-[15px]">Những câu chuyện, bối cảnh và góc nhìn về thị trường.</p>
            <div className="mt-10 flex flex-wrap items-end justify-between gap-6 border-t border-solid border-primary/25 pt-5">
              <div className="-mx-2 flex max-w-full min-w-0 gap-1 overflow-x-auto" aria-label="Chủ đề tin tức">
                {categories.map((c) => (
                  <button
                    key={c}
                    aria-pressed={category === c}
                    onClick={() => setCategory(c)}
                    className={`relative px-3 py-2 text-xs tracking-wider whitespace-nowrap uppercase transition-colors after:absolute after:inset-x-3 after:-bottom-px after:h-px after:bg-primary after:transition-opacity motion-reduce:transition-none ${category === c ? 'text-primary after:opacity-100' : 'text-primary/60 after:opacity-0 hover:text-primary'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-3 text-[11px] text-primary/70">
                Cổ phiếu
                <select
                  aria-label="Lọc tin theo cổ phiếu"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  className="cursor-pointer rounded-xs border border-solid border-primary/30 bg-transparent px-3 py-2.5 text-xs text-primary transition-colors hover:border-primary/60 [&>option]:bg-ink"
                >
                  <option value="">Tất cả cổ phiếu</option>
                  {stocks.map((s) => (
                    <option key={s.symbol} value={s.symbol}>
                      {s.symbol} · {s.short}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {ticker && (
              <p className="mt-5 flex items-center gap-3 text-xs text-primary/70">
                Tin liên quan đến
                <button className="inline-flex items-center gap-2 border border-solid border-primary/40 px-2.5 py-1 text-primary" onClick={() => setTicker('')}>
                  {ticker}
                  <X size={12} />
                </button>
              </p>
            )}
          </div>
        </section>

        {featured ? (
          <>
            <section className="bg-background text-foreground" aria-labelledby="news-featured-title">
              <div className={`${ui.wrap} grid items-center gap-10 py-12 md:grid-cols-[1.25fr_1fr] md:gap-14 md:py-16`}>
                <Link href={`/tin-tuc/${featured.slug}/`} className="group block aspect-[16/10] overflow-hidden">
                  <img className="h-full w-full object-cover saturate-[0.85] transition-transform duration-400 group-hover:scale-[1.025] motion-reduce:transition-none" src={featured.image} alt="Kiến trúc văn phòng và không gian doanh nghiệp" fetchPriority="high" />
                </Link>
                <div>
                  <div className="flex items-center gap-3 text-[10px] tracking-wider text-foreground/65 uppercase">
                    <span>{featured.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{featured.read}</span>
                  </div>
                  <Link href={`/tin-tuc/${featured.slug}/`} className="group">
                    <h2 id="news-featured-title" className="mt-4 font-editorial text-[clamp(28px,2.6vw,42px)] leading-[1.2] font-normal tracking-[-0.03em] group-hover:underline group-hover:underline-offset-4">{featured.title}</h2>
                  </Link>
                  <p className="mt-5 text-[13px] leading-7 text-foreground/70">{featured.description}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {featured.tickers.map((t) => (
                      <Link key={t} href={`/?ma=${t}`} className={tickerChip}>
                        {t}
                        <ArrowUpRight size={11} />
                      </Link>
                    ))}
                  </div>
                  <div className="mt-8 flex items-center justify-between gap-4 border-t border-solid border-foreground/20 pt-5 text-[11px] text-foreground/65">
                    <span>Ban biên tập Finsight · Mẫu {featured.time}</span>
                    <Link href={`/tin-tuc/${featured.slug}/`} className="flex items-center gap-3 text-xs text-foreground">
                      Đọc bài viết <LineIcon />
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-background text-foreground" aria-labelledby="news-feed-title">
              <div className={`${ui.wrap} grid gap-12 border-t border-solid border-foreground/20 py-12 md:py-16 lg:grid-cols-[1fr_320px] lg:gap-16`}>
                <div>
                  <div className="flex flex-wrap items-end justify-between gap-5">
                    <div>
                      <h2 id="news-feed-title" className={ui.sectionTitle}>
                        {ticker ? `Tin về ${ticker}` : category === 'Tất cả' ? 'Tiếp tục khám phá' : category}
                      </h2>
                      <p className="mt-3 text-[13px] text-foreground/65">{filtered.length} bài viết minh họa dành cho bạn.</p>
                    </div>
                    <SearchField query={query} setQuery={setQuery} />
                  </div>
                  <div className="mt-8">
                    {filtered.slice(1).length ? (
                      filtered.slice(1).map((a) => (
                        <article key={a.slug} className="group grid grid-cols-[38%_1fr] gap-6 border-t border-solid border-foreground/20 py-7 max-[560px]:grid-cols-1 max-[560px]:gap-4">
                          <Link href={`/tin-tuc/${a.slug}/`} className="block aspect-[16/10] self-start overflow-hidden">
                            <img className="h-full w-full object-cover saturate-[0.85] transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transition-none" src={a.image} alt="" loading="lazy" />
                          </Link>
                          <div className="flex flex-col">
                            <div className="flex items-center justify-between gap-3 text-[10px] tracking-wider text-foreground/65 uppercase">
                              <span>{a.category}</span>
                              <span>{a.read}</span>
                            </div>
                            <Link href={`/tin-tuc/${a.slug}/`}>
                              <h3 className="mt-3 font-editorial text-[25px] leading-snug font-normal tracking-[-0.02em] group-hover:underline group-hover:underline-offset-4 max-[560px]:text-[22px]">{a.title}</h3>
                            </Link>
                            <p className="mt-3 text-xs leading-relaxed text-foreground/65">{a.description}</p>
                            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
                              <span className="text-[11px] text-foreground/60">Mẫu {a.time}</span>
                              <div className="flex flex-wrap gap-2">
                                {a.tickers.map((t) => (
                                  <Link key={t} href={`/?ma=${t}`} className={tickerChip}>
                                    {t}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="flex flex-wrap items-center gap-4 border-t border-solid border-foreground/20 py-8 text-xs text-foreground/70">
                        <span>Bạn đã xem hết tin phù hợp.</span>
                        <button className="flex items-center gap-3 text-foreground" onClick={clear}>
                          Khám phá chủ đề khác <LineIcon />
                        </button>
                      </div>
                    )}
                    <p className="border-t border-solid border-foreground/20 pt-5 text-[11px] text-foreground/60">Bạn đang xem toàn bộ bài viết trong bản demo.</p>
                  </div>
                </div>

                <aside className="flex flex-col gap-10">
                  <section className="bg-ink p-8 text-primary" aria-labelledby="news-watch-title">
                    <LineIcon kind="spark" />
                    <h2 id="news-watch-title" className="mt-5 font-editorial text-[28px] leading-tight font-normal tracking-[-0.02em]">Cùng một góc nhìn.</h2>
                    <p className="mt-3 mb-6 text-xs leading-6 text-primary/75">Kết nối tin tức với doanh nghiệp bạn quan tâm.</p>
                    <Link href="/theo-doi/" className={`${ui.button} ${ui.outlineButton}`}>
                      Danh sách theo dõi <LineIcon />
                    </Link>
                  </section>
                  <section aria-labelledby="news-mentioned-title">
                    <h3 id="news-mentioned-title" className="mb-2 text-[10px] tracking-wider text-foreground/65 uppercase">Doanh nghiệp trong bản tin</h3>
                    {stocks
                      .filter((s) => ['FPT', 'VCB', 'HPG', 'MWG'].includes(s.symbol))
                      .map((s) => (
                        <button
                          key={s.symbol}
                          className="flex w-full items-center gap-4 border-t border-solid border-foreground/20 py-4 text-left transition-colors hover:bg-foreground/5"
                          onClick={() => {
                            setTicker(s.symbol);
                            setCategory('Tất cả');
                            setQuery('');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          <span className="min-w-0 flex-1">
                            <strong className="block text-[13px] font-medium">{s.symbol}</strong>
                            <small className="text-[11px] text-foreground/65">{s.short}</small>
                          </span>
                          <span className="text-right text-xs tabular-nums">
                            {number(s.price)}
                            <small className={`block text-[11px] ${s.change < 0 ? 'text-red-800 dark:text-red-300' : 'text-emerald-800 dark:text-emerald-300'}`}>{signed(s.change)}%</small>
                          </span>
                        </button>
                      ))}
                  </section>
                  <p className="border-t border-solid border-foreground/20 pt-5 text-[11px] leading-6 text-foreground/60">
                    Các bài viết được biên soạn để minh họa trải nghiệm đọc tin, không phải bản tin thị trường thực tế.
                  </p>
                </aside>
              </div>
            </section>
          </>
        ) : (
          <section className="bg-background text-foreground">
            <div className={`${ui.wrap} flex flex-col items-start gap-5 py-16 md:py-24`}>
              <Search size={34} strokeWidth={1.2} />
              <h2 className={ui.sectionTitle}>Chưa có tin phù hợp.</h2>
              <p className="text-[13px] text-foreground/65">Thử tìm theo mã khác hoặc xem tất cả chủ đề.</p>
              <SearchField query={query} setQuery={setQuery} />
              <button className={`${ui.button} ${ui.primaryButton} mt-3`} onClick={clear}>
                Xem tất cả tin tức <LineIcon />
              </button>
            </div>
          </section>
        )}
      </main>
      <footer className={`${ui.wrap} flex items-center gap-[35px] border-t border-solid border-primary/30 py-[30px] text-[11px] text-primary/80 max-[850px]:flex-wrap max-[560px]:gap-[18px]`}>
        <Link className="mr-auto font-editorial text-2xl leading-none tracking-[0.08em] text-primary" href="/">FINSIGHT</Link>
        <span>© 2026 Finsight</span>
        <p className="max-[850px]:w-full">Dữ liệu và bài viết minh họa. Trợ lý AI đang phát triển.</p>
      </footer>
    </div>
  );
}

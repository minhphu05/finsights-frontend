'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import HomeMarket from '@/components/home-market';
import { AssistantButton, LineIcon } from '@/components/home';
import { homeStyles as ui } from '@/components/home-styles';
import { number, signed } from '@/lib/data';
import { useAppData } from '@/components/shell';
import { MarketSkeleton, Skeleton, SkeletonGroup } from '@/components/skeleton';

// : two stacked cards exactly as tall as their text (category, 3 title lines, meta), and a lead
// as tall as both plus the gap between them. The skeletons share these classes, so nothing moves when the articles arrive.
// 4.05 = 3 title lines × 1.35 line height; the rest is category, meta and the margins between them.
const newsHeights = '[--news-title:clamp(16px,1.25vw,21px)] max-[1150px]:[--news-title:16px] max-[560px]:[--news-title:15px] [--news-card:calc(var(--news-title)*4.05+54px)] max-[560px]:[--news-card:calc(var(--news-title)*4.05+44px)]';
const newsLead = 'h-[calc(var(--news-card)*2+22px)] min-w-0';
const newsStack = 'grid min-w-0 grid-rows-[repeat(2,var(--news-card))] content-start gap-[22px]';
const newsCard = 'grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)] grid-cols-[44%_minmax(0,1fr)] gap-[23px] max-[1150px]:grid-cols-[38%_minmax(0,1fr)] max-[1150px]:gap-3.5';

export default function Home() {
  const { articles, indices, stocks, loading, dataError } = useAppData();
  const [lead, ...rest] = articles;
  return (
    <div data-home className="bg-ink font-sans text-primary selection:bg-primary selection:text-ink [&_:focus-visible]:outline-primary motion-reduce:[&_*]:transition-none">
      <main>
        <div data-hero-screen className="flex min-h-dvh flex-col bg-ink">
        <section className="relative flex flex-1 items-center overflow-hidden bg-ink text-primary" aria-labelledby="fin-title">
          <video data-hero-image className="absolute inset-y-0 right-0 h-full w-[70%] object-cover object-[50%_53%] saturate-[0.85] max-[850px]:w-full max-[850px]:object-[65%_center] max-[850px]:opacity-65 max-[560px]:object-[61%_center]" src="/videos/finsight-hero.mp4" autoPlay muted loop playsInline preload="auto" aria-hidden="true" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--color-ink)_0%,var(--color-ink)_30%,color-mix(in_srgb,var(--color-ink)_80%,transparent)_42%,transparent_70%)] max-[850px]:bg-none max-[850px]:bg-ink/75" />
          <div data-hero-copy className={`${ui.wrap} relative pt-[120px] pb-16 max-[560px]:pt-[110px] max-[560px]:pb-12`}>
            <p data-hero-intro className={`${ui.eyebrow} mb-[23px] text-primary/80 max-[560px]:mb-[25px] max-[560px]:text-[9px] max-[560px]:tracking-[0.19em]`}>FINANCE × INSIGHT × INTELLIGENCE</p>
            <h1 id="fin-title" className="max-w-[760px] font-editorial text-[clamp(38px,3.55vw,60px)] leading-[1.15] font-normal tracking-[-0.035em] [text-wrap:initial] max-[850px]:text-[46px] max-[560px]:text-[clamp(32px,8vw,42px)] max-[560px]:leading-[1.25]">
              {['Tin tức tài chính.', 'Phân tích chuyên sâu.', 'Trợ lý AI đồng hành.'].map(line => (
                <span key={line} className="block overflow-hidden py-[0.08em] -my-[0.08em]"><span data-hero-line className="block">{line}</span></span>
              ))}
            </h1>
            <p data-hero-intro className="mt-[25px] mb-6 max-w-[640px] font-editorial text-[17px] leading-[1.65] text-primary/85 max-[560px]:my-[25px] max-[560px]:text-[15px]">
              Finsight mang đến tin tức tài chính, góc nhìn phân tích chuyên sâu<br className="max-[560px]:hidden" /> và công cụ theo dõi, giúp bạn hiểu thị trường rõ hơn.
            </p>
            <div data-hero-intro className="flex gap-6 max-[560px]:flex-col max-[560px]:items-start max-[560px]:gap-3">
              <Link href="/tin-tuc/" className={`${ui.button} ${ui.primaryButton}`}>Khám phá tin tức</Link>
              <AssistantButton />
            </div>
          </div>
        </section>

        <div className="flex h-14 shrink-0 items-stretch border-y border-solid border-primary/15 bg-background text-foreground" aria-label="Chỉ số thị trường">
          <div className="relative z-10 flex w-[220px] shrink-0 flex-col justify-center border-r border-solid border-primary/15 bg-background pl-8 text-xs leading-[1.4] max-[560px]:w-[136px] max-[560px]:pl-4 max-[560px]:text-[10px]">
            Thị trường hôm nay <small className="mt-1 text-[9px] text-foreground/70">{(indices[0]?.quoteAt || stocks[0]?.quoteAt) ? new Date(indices[0]?.quoteAt || stocks[0]?.quoteAt || 0).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : loading ? 'Đang tải dữ liệu' : 'Chưa cập nhật'}</small>
          </div>
          <div className="group min-w-0 flex-1 overflow-hidden motion-reduce:overflow-x-auto">
            <div data-market-loop className="flex w-max animate-market-loop group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:animate-none">
              {[0, 1].map(copy => (
                <div key={copy} aria-hidden={copy === 1 ? true : undefined} className={`flex h-14 min-w-[max(1100px,calc(100vw-220px))] shrink-0 items-center justify-around gap-12 px-6 ${copy === 1 ? 'motion-reduce:hidden' : ''}`}>
                  {loading && !indices.length && !stocks.length ? Array.from({ length: 6 }, (_, item) => <Skeleton key={item} className="h-3 w-32 shrink-0" />) : indices.length ? indices.map((item) => (
                    <a href="#thi-truong" tabIndex={copy === 1 ? -1 : undefined} key={item.symbol} className="flex shrink-0 items-center justify-center gap-3.5 text-[11px] whitespace-nowrap tabular-nums">
                      <strong className="font-medium">{item.name}</strong><span>{number(item.value, 2)}</span><span className={item.percent < 0 ? 'text-red-800 dark:text-red-300' : 'text-green-800 dark:text-green-300'}>{signed(item.percent)}%</span>
                    </a>
                  )) : stocks.slice(0, 6).map((stock) => (
                    <a href="#thi-truong" tabIndex={copy === 1 ? -1 : undefined} key={stock.symbol} className="flex shrink-0 items-center justify-center gap-3.5 text-[11px] whitespace-nowrap tabular-nums">
                      <strong className="font-medium">{stock.symbol}</strong><span>{number(stock.price)}</span><span className={stock.change < 0 ? 'text-red-800 dark:text-red-300' : 'text-green-800 dark:text-green-300'}>{signed(stock.change)}%</span>
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
        <section className="relative z-10 bg-background text-foreground" aria-labelledby="fin-news-title">
          <div className={`${ui.wrap} grid grid-cols-[.75fr_1.45fr_1.3fr] items-stretch gap-[22px] py-12 ${newsHeights} max-[1150px]:grid-cols-[.65fr_1.2fr_1.1fr] max-[850px]:grid-cols-[1fr_1.3fr] max-[560px]:flex max-[560px]:flex-col max-[560px]:gap-[25px] max-[560px]:py-[34px]`}>
            <div data-landing-reveal className="flex flex-col items-start py-[35px] max-[1150px]:py-5 max-[850px]:col-span-full max-[850px]:flex-row max-[850px]:flex-wrap max-[850px]:items-center max-[850px]:gap-[22px] max-[850px]:p-0 max-[560px]:grid max-[560px]:gap-3">
              <p className={`${ui.eyebrow} mb-[13px] text-foreground/75 max-[850px]:m-0 max-[560px]:text-[9px]`}>TIN MỚI NHẤT</p>
              <h2 id="fin-news-title" data-split className="font-editorial text-[clamp(32px,3.2vw,52px)] leading-[1.15] font-normal tracking-[-0.04em] max-[850px]:text-4xl">Latest News</h2>
              <Link href="/tin-tuc/" className="mt-auto flex items-center gap-3.5 text-[13px] max-[850px]:ml-auto max-[560px]:mt-[5px] max-[560px]:ml-0 max-[560px]:text-xs">Xem tất cả tin tức <LineIcon /></Link>
            </div>
            {lead ? <Link data-landing-reveal="image" href={`/tin-tuc/${lead.slug}/`} className={`group relative overflow-hidden text-white ${newsLead}`}>
              {lead.image ? <img className="absolute h-full w-full object-cover saturate-[0.85] transition-transform duration-400 group-hover:scale-[1.025]! motion-reduce:transition-none" src={lead.image} alt="" /> : <div className="absolute inset-0 bg-gradient-to-br from-orange-900 via-stone-800 to-stone-950" />}
              <div className="absolute inset-0 bg-[linear-gradient(transparent_15%,#000d)]" />
              <div className="absolute right-[25px] bottom-5 left-[25px]">
                <span className="mb-[30px] block truncate text-[10px] uppercase max-[560px]:mb-3">{lead.category}</span>
                <h3 className="line-clamp-3 font-editorial text-[clamp(23px,2vw,34px)] leading-[1.2] font-normal text-pretty max-[560px]:text-[22px]">{lead.title}</h3>
                <p className="mt-4 truncate text-[11px] text-white/80">{lead.time} <span className="mx-2">·</span> {lead.sourceName}</p>
              </div>
            </Link> : loading ? <SkeletonGroup label="Đang tải tin tức…" className={`flex ${newsLead}`}><Skeleton className="w-full" /></SkeletonGroup> : <div className={`grid place-items-center border border-primary/20 p-8 text-sm text-primary/75 ${newsLead}`}>{dataError || 'Chưa có tin mới.'}</div>}
            <div className={newsStack}>
              {loading && !articles.length && [0, 1].map(row => (
                <div key={row} className={newsCard}><Skeleton className="h-0 min-h-full w-full" /><div><Skeleton className="h-2.5 w-1/3" /><Skeleton className="mt-3 h-5 w-full" /><Skeleton className="mt-2 h-5 w-2/3" /><Skeleton className="mt-5 h-3 w-1/2" /></div></div>
              ))}
              {rest.slice(0, 2).map(article => (
                <Link data-landing-reveal="row" className={`group ${newsCard}`} href={`/tin-tuc/${article.slug}/`} key={article.slug}>
                  <div className="relative h-0 min-h-full overflow-hidden">{article.image ? <img className="absolute inset-0 h-full w-full object-cover saturate-[0.85] transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transition-none" src={article.image} alt="" /> : <div className="absolute inset-0 bg-foreground/10" />}</div>
                  <div className="min-w-0">
                    <span className="block truncate text-[9px] leading-[14px] tracking-[0.08em] uppercase">{article.category}</span>
                    <h3 className="mt-1.5 line-clamp-3 min-h-[calc(var(--news-title)*4.05)] font-editorial text-[length:var(--news-title)] leading-[1.35] font-normal text-pretty">{article.title}</h3>
                    <p className="mt-[18px] truncate text-[11px] leading-4 text-foreground/70 max-[560px]:mt-2">{article.time} <span className="mx-2">·</span> {article.sourceName}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="thi-truong" className="relative z-10 bg-background text-foreground">
          <div className={`${ui.wrap} border-t border-solid border-foreground/20 pt-12 pb-10 md:pt-16 md:pb-14`}>
            <div data-landing-reveal className="flex flex-wrap items-end justify-between gap-5">
              <div><h2 data-split className={ui.sectionTitle}>Nhịp đập thị trường</h2><p className="mt-3 text-[13px] text-foreground/65">Theo dõi cổ phiếu và khám phá dữ liệu thị trường Việt Nam.</p></div>
              <span className="text-[10px] tracking-wider text-foreground/60 uppercase">Việt Nam · HOSE / HNX / UPCOM</span>
            </div>
            <Suspense fallback={<MarketSkeleton />}><HomeMarket /></Suspense>
          </div>
        </section>

        <section className="relative z-10 bg-background text-foreground" aria-labelledby="insights-title">
          <div className={`${ui.wrap} border-t border-solid border-foreground/20 py-12 md:py-16`}>
            <div data-landing-reveal className="mb-8 flex flex-wrap items-end justify-between gap-5">
              <div><h2 id="insights-title" data-split className={ui.sectionTitle}>Đằng sau những con số</h2><p className="mt-3 text-[13px] text-foreground/65">Những góc nhìn giúp bạn hiểu doanh nghiệp sâu hơn.</p></div>
              <Link className="flex items-center gap-3 text-xs" href="/tin-tuc/">Tất cả bài viết <LineIcon /></Link>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {loading && !articles.length && [0, 1, 2].map(card => (
                <div key={card}><Skeleton className="aspect-[16/10] w-full" /><Skeleton className="mt-5 h-2.5 w-1/2" /><Skeleton className="mt-4 h-6 w-full" /><Skeleton className="mt-2 h-6 w-3/4" /><Skeleton className="mt-4 h-3 w-full" /></div>
              ))}
              {articles.slice(3, 6).map(article => (
                <Link data-landing-reveal key={article.slug} href={`/tin-tuc/${article.slug}/`} className="group">
                  <div className="aspect-[16/10] overflow-hidden">{article.image ? <img data-scroll-image className="h-full w-full object-cover saturate-[0.85] transition-transform duration-300 group-hover:scale-[1.025]!" src={article.image} alt="" loading="lazy" /> : <div className="h-full w-full bg-foreground/10" />}</div>
                  <div className="mt-5 flex items-center justify-between gap-3 text-[10px] tracking-wider text-foreground/65 uppercase"><span>{article.category}</span><span>{article.sourceName}</span></div>
                  <h3 className="mt-3 font-editorial text-[25px] leading-snug font-normal tracking-[-0.02em]">{article.title}</h3>
                  <p className="mt-3 text-xs leading-relaxed text-foreground/65">{article.description}</p>
                  <span className="mt-5 flex items-center gap-3 text-xs">Đọc bài viết <LineIcon /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="ve-finsight" data-scroll-story className="relative z-10 bg-ink text-primary md:min-h-[140svh]">
          <div className={`${ui.wrap} grid gap-10 py-14 md:sticky md:top-0 md:min-h-svh md:grid-cols-[1.2fr_1fr] md:items-center md:gap-20 md:py-20`}>
            <div><h2 className="font-editorial text-[clamp(36px,4vw,60px)] leading-[1.15] font-normal tracking-[-0.03em]">{['Hiểu', 'thị', 'trường.', 'Mở', 'rộng', 'góc', 'nhìn.'].map((word, position) => <span key={position}>{position === 3 && <br />}<span data-scroll-word>{word}</span>{' '}</span>)}</h2><p className="mt-6 max-w-[45ch] text-[13px] leading-7 text-primary/75">Không chỉ là những con số. Finsight kết nối tin doanh nghiệp, phân tích và dữ liệu thị trường trong một trải nghiệm dễ theo dõi.</p></div>
            <div id="tro-ly" data-landing-reveal className="flex flex-col items-start justify-center border-t border-solid border-primary/25 pt-8 md:border-t-0 md:border-l md:pt-0 md:pl-12">
              <h3 className="font-editorial text-[30px] font-normal">Thêm một góc nhìn cùng AI.</h3><p className="mt-4 mb-6 max-w-[44ch] text-xs leading-6 text-primary/75">Trợ lý Finsight đang được phát triển để đồng hành cùng bạn trong hành trình tìm hiểu thị trường.</p><AssistantButton />
            </div>
          </div>
        </section>
      </main>
      <footer className={`${ui.wrap} flex items-center gap-[35px] border-t border-solid border-primary/30 py-[30px] text-[11px] text-primary/80 max-[850px]:flex-wrap max-[560px]:gap-[18px] max-[560px]:pb-[85px]`}>
        <Link className="mr-auto font-editorial text-2xl leading-none tracking-[0.08em] text-primary" href="/">FINSIGHT</Link>
        <span>© 2026 Finsight</span>
        <p className="max-[850px]:w-full">Dữ liệu thị trường và tin tức được cập nhật từ các nguồn đã thu thập.</p>
      </footer>
    </div>
  );
}

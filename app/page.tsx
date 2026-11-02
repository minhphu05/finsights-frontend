import { Suspense } from 'react';
import Link from 'next/link';
import HomeMarket from '@/components/home-market';
import { AssistantButton, LineIcon } from '@/components/home';
import { homeStyles as ui } from '@/components/home-styles';
import { articles } from '@/lib/data';

export const metadata = { title: 'Finsight — Tin tức và góc nhìn tài chính' };
const indices = [
  ['VNINDEX', '1,283.65', '+0.72%'],
  ['HNXINDEX', '244.12', '+0.53%'],
  ['S&P 500', '6,723.48', '+0.41%'],
  ['DOW', '47,061.28', '−0.08%'],
  ['NASDAQ', '21,448.53', '+0.92%'],
];

export default function Home() {
  const [lead, ...rest] = articles;
  return (
    <div data-home className="bg-ink font-sans text-primary selection:bg-primary selection:text-ink [&_:focus-visible]:outline-primary motion-reduce:[&_*]:transition-none">
      <main>
        <div data-hero-screen className="flex min-h-dvh flex-col bg-ink">
        <section className="relative flex flex-1 items-center overflow-hidden bg-ink text-primary" aria-labelledby="fin-title">
          <video data-hero-image className="absolute inset-y-0 right-0 h-full w-[70%] object-cover object-[50%_53%] saturate-[0.85] max-[850px]:w-full max-[850px]:object-[65%_center] max-[850px]:opacity-65 max-[560px]:object-[61%_center]" src="/videos/finsight-hero.mp4" autoPlay muted loop playsInline preload="auto" aria-hidden="true" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#0b0b0b_0%,#111_25%,#111e_37%,#1115_60%,#0001_100%)] max-[850px]:bg-[linear-gradient(90deg,#111f,#111a_55%,#1113)] max-[560px]:bg-[linear-gradient(90deg,#111e,#1117),linear-gradient(0deg,#111_0%,transparent_65%)]" />
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
              <Link href="/tin-tuc/" className={`${ui.button} ${ui.primaryButton}`}>Khám phá tin tức <LineIcon /></Link>
              <AssistantButton />
            </div>
          </div>
        </section>

        <div className="flex h-14 shrink-0 items-stretch border-y border-solid border-primary/30 bg-neutral-900 text-primary" aria-label="Chỉ số thị trường minh họa">
          <div className="relative z-10 flex w-[220px] shrink-0 flex-col justify-center border-r border-solid border-primary/30 bg-neutral-900 pl-8 text-xs leading-[1.4] max-[560px]:w-[136px] max-[560px]:pl-4 max-[560px]:text-[10px]">
            Thị trường hôm nay <small className="mt-1 text-[9px] text-primary/70">Dữ liệu minh họa</small>
          </div>
          <div className="group min-w-0 flex-1 overflow-hidden motion-reduce:overflow-x-auto">
            <div data-market-loop className="flex w-max animate-market-loop group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:animate-none">
              {[0, 1].map(copy => (
                <div key={copy} aria-hidden={copy === 1 ? true : undefined} className={`flex h-14 min-w-[max(1100px,calc(100vw-220px))] shrink-0 items-center justify-around gap-12 px-6 ${copy === 1 ? 'motion-reduce:hidden' : ''}`}>
                  {indices.map(([name, value, change]) => (
                    <a href="#thi-truong" tabIndex={copy === 1 ? -1 : undefined} key={name} className="flex shrink-0 items-center justify-center gap-3.5 text-[11px] whitespace-nowrap tabular-nums">
                      <strong className="font-medium">{name}</strong><span>{value}</span><span className={change.startsWith('−') ? 'text-red-300' : 'text-green-300'}>{change}</span>
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
        <section className="bg-background text-foreground" aria-labelledby="fin-news-title">
          <div className={`${ui.wrap} grid grid-cols-[.75fr_1.45fr_1.3fr] items-stretch gap-[22px] py-12 max-[1150px]:grid-cols-[.65fr_1.2fr_1.1fr] max-[850px]:grid-cols-[1fr_1.3fr] max-[560px]:flex max-[560px]:flex-col max-[560px]:gap-[25px] max-[560px]:py-[34px]`}>
            <div data-landing-reveal className="flex flex-col items-start py-[35px] max-[1150px]:py-5 max-[850px]:col-span-full max-[850px]:flex-row max-[850px]:flex-wrap max-[850px]:items-center max-[850px]:gap-[22px] max-[850px]:p-0 max-[560px]:grid max-[560px]:gap-3">
              <p className={`${ui.eyebrow} mb-[13px] text-foreground/75 max-[850px]:m-0 max-[560px]:text-[9px]`}>TIN MỚI NHẤT</p>
              <h2 id="fin-news-title" className="font-editorial text-[clamp(32px,3.2vw,52px)] leading-[1.15] font-normal tracking-[-0.04em] max-[850px]:text-4xl">Latest News</h2>
              <span className="my-[34px] h-px w-12 bg-foreground/50 max-[850px]:hidden" />
              <Link href="/tin-tuc/" className="mt-auto flex items-center gap-3.5 text-[13px] max-[850px]:ml-auto max-[560px]:mt-[5px] max-[560px]:ml-0 max-[560px]:text-xs">Xem tất cả tin tức <LineIcon /></Link>
            </div>
            <Link data-landing-reveal="image" href={`/tin-tuc/${lead.slug}/`} className="group relative min-h-[290px] overflow-hidden text-primary max-[560px]:min-h-[300px]">
              <img className="absolute h-full w-full object-cover saturate-[0.85] transition-transform duration-400 group-hover:scale-[1.025] motion-reduce:transition-none" src={lead.image} alt="Khu tài chính giữa những tòa nhà cao tầng" />
              <div className="absolute inset-0 bg-[linear-gradient(transparent_15%,#000d)]" />
              <div className="absolute right-[25px] bottom-5 left-[25px]">
                <span className="mb-[30px] block text-[10px] uppercase">{lead.category}</span>
                <h3 className="font-editorial text-[clamp(23px,2vw,34px)] leading-[1.2] font-normal group-hover:underline group-hover:underline-offset-4 max-[560px]:text-[28px]">{lead.title}</h3>
                <p className="mt-4 text-[11px] text-primary/80">{lead.time} <span className="mx-2">·</span> {lead.read}</p>
              </div>
            </Link>
            <div className="grid grid-rows-2 gap-[22px]">
              {rest.slice(0, 2).map(article => (
                <Link data-landing-reveal="row" className="group grid grid-cols-[44%_1fr] items-center gap-[23px] max-[1150px]:grid-cols-[38%_1fr] max-[1150px]:gap-3.5 max-[560px]:gap-[18px]" href={`/tin-tuc/${article.slug}/`} key={article.slug}>
                  <img className="h-full max-h-[145px] min-h-[125px] w-full object-cover saturate-[0.85] max-[850px]:min-h-[120px] max-[560px]:max-h-[135px]" src={article.image} alt="" />
                  <div>
                    <span className="text-[9px] tracking-[0.08em] uppercase">{article.category}</span>
                    <h3 className="mt-1.5 font-editorial text-[clamp(16px,1.25vw,21px)] leading-[1.35] font-normal group-hover:underline group-hover:underline-offset-4 max-[1150px]:text-base max-[560px]:text-[19px]">{article.title}</h3>
                    <p className="mt-[18px] text-[11px] text-foreground/70">{article.time} <span className="mx-2">·</span> {article.read}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="thi-truong" className="bg-background text-foreground">
          <div className={`${ui.wrap} border-t border-solid border-foreground/20 pt-12 pb-10 md:pt-16 md:pb-14`}>
            <div data-landing-reveal className="flex flex-wrap items-end justify-between gap-5">
              <div><h2 className={ui.sectionTitle}>Nhịp đập thị trường</h2><p className="mt-3 text-[13px] text-foreground/65">Theo dõi cổ phiếu và khám phá dữ liệu thị trường Việt Nam.</p></div>
              <span className="text-[10px] tracking-wider text-foreground/60 uppercase">Việt Nam · HOSE / HNX / UPCOM</span>
            </div>
            <Suspense fallback={<p className="py-12 text-sm text-foreground/65">Đang mở thị trường…</p>}><HomeMarket /></Suspense>
          </div>
        </section>

        <section className="bg-background text-foreground" aria-labelledby="insights-title">
          <div className={`${ui.wrap} border-t border-solid border-foreground/20 py-12 md:py-16`}>
            <div data-landing-reveal className="mb-8 flex flex-wrap items-end justify-between gap-5">
              <div><h2 id="insights-title" className={ui.sectionTitle}>Đằng sau những con số</h2><p className="mt-3 text-[13px] text-foreground/65">Những góc nhìn giúp bạn hiểu doanh nghiệp sâu hơn.</p></div>
              <Link className="flex items-center gap-3 text-xs" href="/tin-tuc/">Tất cả bài viết <LineIcon /></Link>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {articles.slice(3, 6).map(article => (
                <Link data-landing-reveal key={article.slug} href={`/tin-tuc/${article.slug}/`} className="group">
                  <div className="aspect-[16/10] overflow-hidden"><img data-scroll-image className="h-full w-full object-cover saturate-[0.85] transition-transform duration-300 group-hover:scale-[1.025]" src={article.image} alt="" loading="lazy" /></div>
                  <div className="mt-5 flex items-center justify-between gap-3 text-[10px] tracking-wider text-foreground/65 uppercase"><span>{article.category}</span><span>{article.read}</span></div>
                  <h3 className="mt-3 font-editorial text-[25px] leading-snug font-normal tracking-[-0.02em] group-hover:underline group-hover:underline-offset-4">{article.title}</h3>
                  <p className="mt-3 text-xs leading-relaxed text-foreground/65">{article.description}</p>
                  <span className="mt-5 flex items-center gap-3 text-xs">Đọc bài viết <LineIcon /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="ve-finsight" data-scroll-story className="relative bg-ink text-primary md:min-h-[140svh]">
          <div className={`${ui.wrap} grid gap-10 py-14 md:sticky md:top-0 md:min-h-svh md:grid-cols-[1.2fr_1fr] md:items-center md:gap-20 md:py-20`}>
            <div><h2 className="font-editorial text-[clamp(36px,4vw,60px)] leading-[1.15] font-normal tracking-[-0.03em]">{['Hiểu', 'thị', 'trường.', 'Mở', 'rộng', 'góc', 'nhìn.'].map((word, position) => <span key={position}>{position === 3 && <br />}<span data-scroll-word>{word}</span>{' '}</span>)}</h2><p className="mt-6 max-w-[45ch] text-[13px] leading-7 text-primary/75">Không chỉ là những con số. Finsight kết nối tin doanh nghiệp, phân tích và dữ liệu thị trường trong một trải nghiệm dễ theo dõi.</p></div>
            <div id="tro-ly" data-landing-reveal className="flex flex-col items-start justify-center border-t border-solid border-primary/25 pt-8 md:border-t-0 md:border-l md:pt-0 md:pl-12">
              <span className="mb-5"><LineIcon kind="spark" /></span><h3 className="font-editorial text-[30px] font-normal">Thêm một góc nhìn cùng AI.</h3><p className="mt-4 mb-6 max-w-[44ch] text-xs leading-6 text-primary/75">Trợ lý Finsight đang được phát triển để đồng hành cùng bạn trong hành trình tìm hiểu thị trường.</p><AssistantButton />
            </div>
          </div>
        </section>
      </main>
      <footer className={`${ui.wrap} flex items-center gap-[35px] border-t border-solid border-primary/30 py-[30px] text-[11px] text-primary/80 max-[850px]:flex-wrap max-[560px]:gap-[18px] max-[560px]:pb-[85px]`}>
        <Link className="mr-auto font-editorial text-2xl leading-none tracking-[0.08em] text-primary" href="/">FINSIGHT</Link>
        <span>© 2026 Finsight</span>
        <p className="max-[850px]:w-full">Dữ liệu và bài viết minh họa. Trợ lý AI đang phát triển.</p>
      </footer>
      <AssistantButton floating />
    </div>
  );
}

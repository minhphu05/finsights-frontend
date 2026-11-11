import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight } from '@/components/icons';
import { LineIcon } from '@/components/home';
import { homeStyles as ui } from '@/components/home-styles';
import { articles } from '@/lib/data';
import { WatchButton } from '@/components/shell';

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: articles.find((a) => a.slug === slug)?.title || 'Bài viết' };
}
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();
  const related = articles.filter((a) => a.slug !== slug).slice(0, 3);
  return (
    <div data-home className="bg-ink font-sans text-primary selection:bg-primary selection:text-ink [&_:focus-visible]:outline-primary motion-reduce:[&_*]:transition-none">
      <main>
        <section data-hero-screen className="bg-ink text-primary" aria-labelledby="article-title">
          <div className={`${ui.wrap} pt-[150px] pb-12 max-[560px]:pt-[120px]`}>
            <Link data-hero-intro href="/tin-tuc/" className="mb-8 inline-flex items-center gap-3 text-xs text-primary/75 transition-colors hover:text-primary">
              <ArrowLeft size={16} />
              Trở lại tin tức
            </Link>
            <p data-hero-intro className={`${ui.eyebrow} mb-5 text-primary/80 max-[560px]:text-[9px] max-[560px]:tracking-[0.19em]`}>
              {article.category.toUpperCase()} · {article.read.toUpperCase()}
            </p>
            <h1 id="article-title" className="max-w-[900px] font-editorial text-[clamp(34px,3.55vw,60px)] leading-[1.15] font-normal tracking-[-0.035em] max-[560px]:text-[clamp(30px,8vw,40px)]">
              <span className="block overflow-hidden py-[0.08em] -my-[0.08em]"><span data-hero-line className="block">{article.title}</span></span>
            </h1>
            <p data-hero-intro className="mt-6 max-w-[720px] font-editorial text-[17px] leading-[1.65] text-primary/85 max-[560px]:text-[15px]">{article.description}</p>
            <p data-hero-intro className="mt-10 border-t border-solid border-primary/25 pt-5 text-[11px] text-primary/70">
              Ban biên tập Finsight <span className="mx-2">·</span> Bài viết minh họa <span className="mx-2">·</span> Mẫu {article.time}
            </p>
          </div>
        </section>

        <section className="relative z-10 bg-background text-foreground">
          <div className={`${ui.wrap} grid gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16`}>
            <article>
              <figure>
                <div className="aspect-[16/9] overflow-hidden">
                  <img className="h-full w-full object-cover saturate-[0.85]" src={article.image} alt="Không gian kiến trúc và hoạt động văn phòng minh họa" fetchPriority="high" />
                </div>
                <figcaption className="mt-3 text-[11px] text-foreground/65">
                  Ảnh minh họa: Unsplash. Nội dung bài viết và dữ liệu liên quan dùng cho bản demo.
                </figcaption>
              </figure>
              <div className="mt-10 max-w-[68ch]">
                {article.body.map((p, i) => (
                  <div key={p}>
                    {i === 2 && <h2 className="mt-12 mb-4 font-editorial text-[clamp(26px,2.2vw,34px)] leading-tight font-normal tracking-[-0.02em]">Đặt dữ liệu vào đúng bối cảnh</h2>}
                    {i === 4 && <h2 className="mt-12 mb-4 font-editorial text-[clamp(26px,2.2vw,34px)] leading-tight font-normal tracking-[-0.02em]">Từ thông tin đến góc nhìn</h2>}
                    <p className={i === 0 ? 'mb-6 border-l border-solid border-foreground/40 pl-5 font-editorial text-[17px] leading-8 text-foreground/75' : 'mb-6 text-[15px] leading-8 text-foreground/85'}>{p}</p>
                  </div>
                ))}
              </div>
              <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-solid border-foreground/20 pt-6 text-[11px] text-foreground/65">
                <span className="font-editorial text-lg tracking-[0.08em] text-foreground">FINSIGHT</span>
                <span>Hiểu bối cảnh. Thấy rõ chuyển động.</span>
              </div>
            </article>

            <aside className="flex flex-col gap-10 lg:sticky lg:top-28 lg:self-start">
              <section aria-labelledby="article-tickers-title">
                <h2 id="article-tickers-title" className="mb-1 text-[10px] tracking-wider text-foreground/65 uppercase">Cổ phiếu liên quan</h2>
                <p className="mb-2 text-[11px] text-foreground/60">Dữ liệu theo dõi minh họa.</p>
                {article.tickers.map((t) => (
                  <div className="flex items-center justify-between gap-4 border-t border-solid border-foreground/20 py-4" key={t}>
                    <Link href={`/?ma=${t}`} className="flex items-center gap-2 text-[13px] font-medium hover:underline hover:underline-offset-4">
                      {t}
                      <ArrowUpRight size={14} />
                    </Link>
                    <WatchButton symbol={t} />
                  </div>
                ))}
                <Link className="mt-4 flex items-center gap-3 border-t border-solid border-foreground/20 pt-5 text-xs" href="/#thi-truong">
                  Xem thị trường <LineIcon />
                </Link>
              </section>
              <section className="bg-ink p-8 text-primary" aria-labelledby="article-watch-title">
                <h2 id="article-watch-title" className="font-editorial text-[28px] leading-tight font-normal tracking-[-0.02em]">Cùng một góc nhìn.</h2>
                <p className="mt-3 mb-6 text-xs leading-6 text-primary/75">Kết nối tin tức với doanh nghiệp bạn quan tâm.</p>
                <Link href="/theo-doi/" className={`${ui.button} ${ui.outlineButton}`}>
                  Danh sách theo dõi <LineIcon />
                </Link>
              </section>
            </aside>
          </div>
        </section>

        <section className="relative z-10 bg-background text-foreground" aria-labelledby="related-title">
          <div className={`${ui.wrap} border-t border-solid border-foreground/20 py-12 md:py-16`}>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
              <h2 id="related-title" className={ui.sectionTitle}>Thêm một góc nhìn</h2>
              <Link className="flex items-center gap-3 text-xs" href="/tin-tuc/">
                Tất cả tin tức <LineIcon />
              </Link>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {related.map((a) => (
                <Link key={a.slug} href={`/tin-tuc/${a.slug}/`} className="group">
                  <div className="aspect-[16/10] overflow-hidden">
                    <img className="h-full w-full object-cover saturate-[0.85] transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transition-none" src={a.image} alt="" loading="lazy" />
                  </div>
                  <div className="mt-5 flex items-center justify-between gap-3 text-[10px] tracking-wider text-foreground/65 uppercase">
                    <span>{a.category}</span>
                    <span>{a.read}</span>
                  </div>
                  <h3 className="mt-3 font-editorial text-[25px] leading-snug font-normal tracking-[-0.02em] group-hover:underline group-hover:underline-offset-4">{a.title}</h3>
                  <span className="mt-5 flex items-center gap-3 text-xs">
                    Đọc bài viết <LineIcon />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className={`${ui.wrap} flex items-center gap-[35px] border-t border-solid border-primary/30 py-[30px] text-[11px] text-primary/80 max-[850px]:flex-wrap max-[560px]:gap-[18px]`}>
        <Link className="mr-auto font-editorial text-2xl leading-none tracking-[0.08em] text-primary" href="/">FINSIGHT</Link>
        <span>© 2026 Finsight</span>
        <p className="max-[850px]:w-full">Dữ liệu và bài viết minh họa. Trợ lý AI đang phát triển.</p>
      </footer>
    </div>
  );
}

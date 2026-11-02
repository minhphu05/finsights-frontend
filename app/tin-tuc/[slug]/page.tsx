import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Clock3, ArrowRight } from '@/components/icons';
import { articles } from '@/lib/data';
import { WatchButton, LogoImg, Brand } from '@/components/shell';

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
  const related = articles.filter((a) => a.slug !== slug).slice(0, 2);
  return (
    <main className="container article-page">
      <Link href="/tin-tuc/" className="back-link">
        <ArrowLeft size={17} />
        Trở lại tin tức
      </Link>
      <div className="article-layout">
        <article className="article-body">
          <h1>{article.title}</h1>
          <p className="article-deck">{article.description}</p>
          <div className="article-meta">
            <span>{article.category}</span>
            <span>
              <Clock3 size={14} />
              {article.read}
            </span>
          </div>
          <div className="article-byline">
            <span className="editor-avatar">
              <LogoImg size={26} />
            </span>
            <span>
              <strong>Ban biên tập Turtock</strong>
              <small>Bài viết minh họa · Mẫu {article.time}</small>
            </span>
          </div>
          <figure>
            <img src={article.image} alt="Không gian kiến trúc và hoạt động văn phòng minh họa" />
            <figcaption>
              Ảnh minh họa: Unsplash. Nội dung bài viết và dữ liệu liên quan dùng cho bản demo.
            </figcaption>
          </figure>
          <div className="prose">
            {article.body.map((p, i) => (
              <div key={p}>
                {i === 2 && <h2>Đặt dữ liệu vào đúng bối cảnh</h2>}
                {i === 4 && <h2>Từ thông tin đến góc nhìn</h2>}
                <p className={i === 0 ? 'article-demo-note' : ''}>{p}</p>
              </div>
            ))}
          </div>
          <div className="article-end">
            <Brand />
            <span>Hiểu bối cảnh. Thấy rõ chuyển động.</span>
          </div>
        </article>
        <aside className="article-sidebar">
          <h2>Cổ phiếu liên quan</h2>
          <p>Dữ liệu theo dõi minh họa.</p>
          {article.tickers.map((t) => (
            <div className="article-company" key={t}>
              <Link href={`/?ma=${t}`}>
                <strong>{t}</strong>
                <ArrowUpRight size={16} />
              </Link>
              <WatchButton symbol={t} />
            </div>
          ))}
          <Link className="text-link" href="/">
            Xem thị trường
            <ArrowRight size={16} />
          </Link>
        </aside>
      </div>
      <section className="related-news">
        <div className="section-heading">
          <h2>Thêm một góc nhìn</h2>
          <Link className="text-link" href="/tin-tuc/">
            Tất cả tin tức
            <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="related-grid">
          {related.map((a) => (
            <Link href={`/tin-tuc/${a.slug}/`} key={a.slug} className="plate-rings">
              <h3>{a.title}</h3>
              <div className="article-meta">
                <span>{a.category}</span>
                <span>{a.read}</span>
              </div>
              <ArrowUpRight size={21} />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

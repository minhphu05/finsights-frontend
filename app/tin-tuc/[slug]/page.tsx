'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Clock3 } from '@/components/icons';
import { getNews, listNews, type APIArticle } from '@/lib/api';
import { number, signed } from '@/lib/data';
import { Brand, LogoImg, WatchButton, useAppData } from '@/components/shell';

function repairArticleSpacing(text: string) {
  return text
    .replace(/([\p{Ll}])([\p{Lu}])/gu, '$1 $2')
    .replace(/(VFF|FIFA)(?=[\p{Ll}]|[\p{Lu}][\p{Ll}])/gu, '$1 ')
    .replace(/(Bỉ)(?=[\p{Ll}])/gu, '$1 ')
    .replace(/(Nam)(?=vẫn|cũng|đã|đang|sẽ|không|có|là|với|trong|sau|trước|tại|này|vừa|tiếp|được)/u, '$1 ')
    .replace(/(U\d{1,3})(?=[\p{Lu}])/gu, '$1 ')
    .replace(/([,;:])(?=\S)/g, '$1 ')
    .replace(/[ \t]{2,}/g, ' ');
}

export default function ArticlePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { stocks } = useAppData();
  const [article, setArticle] = useState<APIArticle | null>(null);
  const [related, setRelated] = useState<APIArticle[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  useEffect(() => {
    let active = true;
    setStatus('loading');
    getNews(slug).then((item) => {
      if (!active) return;
      setArticle(item); setStatus('ready'); document.title = `${item.title} · Finsight`;
      return listNews({ limit: 4, symbol: item.tickers[0] }).then((result) => {
        if (active) setRelated(result.articles.filter((candidate) => candidate.slug !== item.slug).slice(0, 3));
      });
    }).catch((error) => {
      if (active) setStatus(error?.status === 404 ? 'missing' : 'error');
    });
    return () => { active = false; };
  }, [slug]);

  if (status === 'loading') return <main data-article-page className="container py-32 text-sm text-foreground/65">Đang tải bài viết…</main>;
  if (status !== 'ready' || !article) return <main data-article-page className="container py-32"><h1 className="font-editorial text-4xl">{status === 'missing' ? 'Không tìm thấy bài viết.' : 'Không tải được bài viết.'}</h1><p className="mt-4 text-sm text-foreground/65">{status === 'missing' ? 'Bài viết có thể đã được gỡ khỏi nguồn.' : 'Hãy thử lại sau.'}</p><Link className="mt-7 inline-flex items-center gap-3 text-sm" href="/tin-tuc/"><ArrowLeft size={17} /> Trở lại tin tức</Link></main>;
  const relatedStocks = stocks.filter((stock) => article.tickers.includes(stock.symbol));
  const articleParagraphs = article.bodyMarkdown
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  return (
    <main data-article-page className="container article-page">
      <Link href="/tin-tuc/" className="back-link"><ArrowLeft size={17} />Trở lại tin tức</Link>
      <div className="article-layout">
        <article className="article-body">
          <h1>{article.title}</h1>
          <p className="article-deck">{article.description || 'Bài viết từ nguồn tin được thu thập.'}</p>
          <div className="article-meta"><span>{article.category}</span><span><Clock3 size={14} />{article.time}</span></div>
          <div className="article-byline"><span className="editor-avatar"><LogoImg size={26} /></span><span><strong>{article.sourceName}</strong><small>{article.publisherCode || 'Nguồn tin'} · {article.time}</small></span></div>
          {article.image && <figure><img src={article.image} alt="" /><figcaption>Ảnh do nguồn tin cung cấp. Vui lòng xem bài gốc để biết đầy đủ bối cảnh.</figcaption></figure>}
          <div className="prose">
            <h2>Nội dung bài viết</h2>
            {articleParagraphs.length > 0
              ? articleParagraphs.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 32)}`} className="whitespace-pre-wrap">{repairArticleSpacing(paragraph)}</p>)
              : <p className="article-demo-note">Nội dung toàn văn chưa có trong dữ liệu của bài viết này.</p>}
            <h2>Nguồn bài viết</h2>
            <p>{article.sourceURL
              ? <a className="article-source-link" href={article.sourceURL} target="_blank" rel="noreferrer" aria-label={`Mở bài gốc trên ${article.sourceName}`}><span>{article.sourceName}</span><span aria-hidden="true">·</span><span>Mở bài gốc</span><ArrowUpRight size={15} /></a>
              : article.sourceName}</p>
          </div>
          <div className="article-end"><Brand /><span>Hiểu bối cảnh. Thấy rõ chuyển động.</span></div>
        </article>
        <aside className="article-sidebar">
          <h2>Cổ phiếu liên quan</h2>
          <p>Dữ liệu thị trường mới nhất từ Finsight.</p>
          {relatedStocks.map((stock) => <div className="article-company" key={stock.symbol}><Link href={`/?ma=${stock.symbol}`}><strong>{stock.symbol}</strong><span className="ml-3 text-xs text-foreground/65">{number(stock.price)} · {signed(stock.change)}%</span><ArrowUpRight size={16} /></Link><WatchButton symbol={stock.symbol} /></div>)}
          {article.tickers.map((symbol) => !relatedStocks.some((stock) => stock.symbol === symbol) && <div className="article-company" key={symbol}><Link href={`/?ma=${symbol}`}><strong>{symbol}</strong><ArrowUpRight size={16} /></Link><WatchButton symbol={symbol} /></div>)}
          {article.tickers[0] && <Link className="text-link" href={`/bao-cao-tai-chinh/?ma=${article.tickers[0]}`}>Báo cáo tài chính <ArrowRight size={16} /></Link>}
          <Link className="text-link" href="/">Xem thị trường <ArrowRight size={16} /></Link>
        </aside>
      </div>
      {related.length > 0 && <section className="related-news"><div className="section-heading"><h2>Tin liên quan</h2><Link className="text-link" href="/tin-tuc/">Tất cả tin tức <ArrowUpRight size={16} /></Link></div><div className="related-grid">{related.map((item) => <Link href={`/tin-tuc/${item.slug}/`} key={item.slug} className="plate-rings"><h3>{item.title}</h3><div className="article-meta"><span>{item.category}</span><span>{item.time}</span></div><ArrowUpRight size={21} /></Link>)}</div></section>}
    </main>
  );
}

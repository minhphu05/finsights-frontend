import type { Metadata } from 'next';
import Link from 'next/link';
import { cache } from 'react';
import { ArrowLeft, ArrowUpRight, Clock3 } from '@/components/icons';
import { mapArticle } from '@/lib/api';
import { publicRequest } from '@/lib/gateway';
import { Brand, LogoImg } from '@/components/shell';

type Props = { params: Promise<{ slug: string }> };

const loadArticle = cache(async (slug: string) => {
  const result = await publicRequest<Record<string, unknown>>(`/news/${encodeURIComponent(slug)}`);
  return result.ok ? { article: mapArticle(result.data), status: 200 } : { article: null, status: result.status };
});

async function loadRelated(slug: string, symbol?: string) {
  const params = new URLSearchParams({ limit: '4', offset: '0' });
  if (symbol) params.set('symbol', symbol);
  const result = await publicRequest<{ articles?: Record<string, unknown>[] }>(`/news?${params}`);
  return result.ok ? (result.data.articles || []).map(mapArticle).filter((candidate) => candidate.slug !== slug).slice(0, 3) : [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { article } = await loadArticle((await params).slug);
  return article ? { title: article.title, description: article.description || undefined } : {};
}

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

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const { article, status } = await loadArticle(slug);
  if (!article) {
    const missing = status === 404;
    return <main data-article-page className="container py-32"><h1 className="font-editorial text-4xl">{missing ? 'Không tìm thấy bài viết.' : 'Không tải được bài viết.'}</h1><p className="mt-4 text-sm text-foreground/65">{missing ? 'Bài viết có thể đã được gỡ khỏi nguồn.' : 'Hãy thử lại sau.'}</p><Link className="mt-7 inline-flex items-center gap-3 text-sm" href="/tin-tuc/"><ArrowLeft size={17} /> Trở lại tin tức</Link></main>;
  }
  const related = await loadRelated(article.slug, article.tickers[0]);
  const articleParagraphs = article.bodyMarkdown
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  return (
    <main data-article-page className="container article-page">
      <div className="article-column">
        <Link href="/tin-tuc/" className="back-link"><ArrowLeft size={17} />Trở lại tin tức</Link>
        <article className="article-body">
          <h1>{article.title}</h1>
          <p className="article-deck">{article.description || 'Bài viết từ nguồn tin được thu thập.'}</p>
          <div className="article-meta"><span>{article.category}</span><span><Clock3 size={14} />{article.time}</span></div>
          <p className="mt-4 inline-flex border border-solid border-foreground/25 px-3 py-1.5 text-[11px] tracking-wide">
            {article.financialRelevance === 'financial'
              ? 'Được phân loại: liên quan đến tài chính'
              : article.financialRelevance === 'needs_review'
                ? 'Chưa xác minh mức độ liên quan đến tài chính'
                : `Được phân loại: không liên quan đến tài chính${article.topicLabel === 'sports' ? ' · Thể thao' : ''}`}
          </p>
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
        {related.length > 0 && <section className="related-news"><div className="section-heading"><h2>Tin liên quan</h2><Link className="text-link" href="/tin-tuc/">Tất cả tin tức <ArrowUpRight size={16} /></Link></div><div className="related-grid">{related.map((item) => <Link href={`/tin-tuc/${item.slug}/`} key={item.slug} className="plate-rings"><h3>{item.title}</h3><div className="article-meta"><span>{item.category}</span><span>{item.time}</span></div><ArrowUpRight size={21} /></Link>)}</div></section>}
      </div>
    </main>
  );
}

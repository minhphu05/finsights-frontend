'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowUp, ArrowUpRight, Plus, Sparkles, X } from './icons';
import { number, signed } from '@/lib/data';
import { askAI, deleteAISession } from '@/lib/api';
import { useAppData } from './shell';

type Refs = { stocks: string[]; articles: string[] };
type Msg = { id: string; role: 'user' | 'assistant'; text: string; refs?: Refs };
type Chat = { id: string; title: string; messages: Msg[] };
const STORE = 'finsight-chats-v2';
const suggestions = ['Hôm nay cổ phiếu nào tăng mạnh nhất?', 'Tóm tắt tin mới nhất về ngân hàng', 'Phân tích nhanh FPT', 'Thanh khoản là gì và vì sao quan trọng?'];
const id = () => crypto.randomUUID();
const positive = (value: number) => (value < 0 ? 'text-red-800 dark:text-red-300' : 'text-emerald-800 dark:text-emerald-300');

function StockChip({ symbol }: { symbol: string }) {
  const { stocks } = useAppData();
  const stock = stocks.find((item) => item.symbol === symbol);
  if (!stock) return <Link href={`/?ma=${symbol}`} className="inline-flex items-center border border-solid border-foreground/25 px-3 py-2 text-[11px]">{symbol}</Link>;
  return <Link href={`/?ma=${symbol}`} className="inline-flex items-center gap-3 border border-solid border-foreground/25 px-3 py-2 text-[11px] tabular-nums"><strong className="font-medium">{stock.symbol}</strong><span>{number(stock.price)}</span><span className={positive(stock.change)}>{signed(stock.change)}%</span></Link>;
}
function ArticleRef({ slug }: { slug: string }) {
  const { articles } = useAppData();
  const article = articles.find((item) => item.slug === slug);
  if (!article) return <Link href={`/tin-tuc/${slug}/`} className="border border-solid border-foreground/20 p-3 text-xs">Đọc tin liên quan</Link>;
  return <Link href={`/tin-tuc/${article.slug}/`} className="group grid grid-cols-[84px_1fr] items-center gap-4 border border-solid border-foreground/20 p-3 transition-colors hover:border-foreground/50"><span className="grid aspect-[4/3] place-items-center bg-foreground/5 text-[9px] text-foreground/50">{article.sourceName}</span><span className="min-w-0"><span className="text-[9px] tracking-wider uppercase text-foreground/65">{article.category} · {article.time}</span><span className="mt-1 block font-editorial text-[15px] leading-snug group-hover:underline group-hover:underline-offset-4">{article.title}</span></span></Link>;
}

export default function Chatbot() {
  const { accessToken, userEmail } = useAppData();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeId, setActiveId] = useState('');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loginRequired, setLoginRequired] = useState(false);
  const [error, setError] = useState('');
  const thread = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || '[]') as Chat[];
      if (Array.isArray(saved) && saved.length) { setChats(saved); setActiveId(saved[0].id); }
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => { if (!loaded) return; try { localStorage.setItem(STORE, JSON.stringify(chats.slice(0, 20))); } catch {} }, [chats, loaded]);
  const active = chats.find((chat) => chat.id === activeId);
  useEffect(() => { thread.current?.scrollTo({ top: thread.current.scrollHeight, behavior: 'smooth' }); }, [active?.messages]);
  useEffect(() => { const element = field.current; if (!element) return; element.style.height = 'auto'; element.style.height = `${Math.min(element.scrollHeight, 180)}px`; }, [draft]);
  const patch = (chatId: string, update: (chat: Chat) => Chat) => setChats((list) => list.map((chat) => (chat.id === chatId ? update(chat) : chat)));

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || busy) return;
    if (!accessToken) { setLoginRequired(true); setError('Đăng nhập bằng Google để sử dụng trợ lý AI.'); return; }
    setLoginRequired(false); setError(''); setDraft(''); setBusy(true);
    const requestNumber = ++requestRef.current;
    const userMessage: Msg = { id: id(), role: 'user', text };
    const pendingId = id();
    const initialId = active?.id || `pending-${id()}`;
    const chatTitle = text.length > 48 ? `${text.slice(0, 48)}…` : text;
    if (!active) { setChats((list) => [{ id: initialId, title: chatTitle, messages: [userMessage, { id: pendingId, role: 'assistant', text: '' }] }, ...list]); setActiveId(initialId); }
    else patch(initialId, (chat) => ({ ...chat, messages: [...chat.messages, userMessage, { id: pendingId, role: 'assistant', text: '' }] }));
    try {
      const sessionId = active && !active.id.startsWith('pending-') ? active.id : '';
      const response = await askAI(accessToken, text, sessionId);
      if (requestNumber !== requestRef.current) return;
      const resolvedId = response.session_id || initialId;
      setChats((list) => list.map((chat) => chat.id === initialId ? { ...chat, id: resolvedId, messages: chat.messages.map((message) => message.id === pendingId ? { ...message, text: response.answer, refs: { stocks: response.stock_symbols || [], articles: response.article_slugs || [] } } : message) } : chat));
      setActiveId(resolvedId);
    } catch (reason) {
      if (requestNumber !== requestRef.current) return;
      const message = reason instanceof Error ? reason.message : 'Trợ lý tạm thời không phản hồi.';
      patch(initialId, (chat) => ({ ...chat, messages: chat.messages.map((item) => item.id === pendingId ? { ...item, text: `Mình chưa thể trả lời lúc này. ${message}` } : item) }));
      setError(message);
    } finally { if (requestNumber === requestRef.current) setBusy(false); }
  }

  function remove(chatId: string) {
    if (accessToken && !chatId.startsWith('pending-')) deleteAISession(accessToken, chatId).catch(() => {});
    setChats((list) => list.filter((chat) => chat.id !== chatId));
    if (chatId === activeId) setActiveId('');
  }
  function newChat() { requestRef.current++; setBusy(false); setError(''); setLoginRequired(false); setActiveId(''); field.current?.focus(); }

  return (
    <div data-home className="h-dvh overflow-hidden bg-background font-sans text-foreground selection:bg-foreground selection:text-background [&_:focus-visible]:outline-foreground motion-reduce:[&_*]:transition-none">
      <div className="grid h-full grid-cols-1 grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[272px_minmax(0,1fr)] lg:grid-rows-1">
        <div className="flex items-center justify-between border-b border-solid border-foreground/20 px-5 py-4 lg:hidden"><Link className="font-editorial text-xl leading-none tracking-[0.08em]" href="/">FINSIGHT</Link><Link className="text-xs text-foreground/70 hover:text-foreground" href="/tin-tuc/">Tin tức</Link></div>
        <aside className="hidden min-h-0 flex-col border-r border-solid border-foreground/20 lg:flex" aria-label="Lịch sử trò chuyện"><div className="flex items-center justify-between px-5 pt-6"><Link className="font-editorial text-2xl leading-none tracking-[0.08em]" href="/" aria-label="Finsight — Trang chủ">FINSIGHT</Link><Link className="text-xs text-foreground/70 hover:text-foreground" href="/tin-tuc/">Tin tức</Link></div><div className="p-5"><button className="flex w-full items-center justify-between gap-3 rounded-xs border border-solid border-foreground/40 px-4 py-3 text-xs transition-colors hover:bg-foreground/10" onClick={newChat}>Cuộc trò chuyện mới <Plus size={16} strokeWidth={1.4} /></button></div><p className="px-5 pb-2 text-[10px] tracking-wider text-foreground/55 uppercase">Gần đây</p><nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-4" data-lenis-prevent>{chats.length === 0 && <p className="px-3 py-2 text-xs leading-6 text-foreground/55">Chưa có cuộc trò chuyện nào.</p>}{chats.map((chat) => <div key={chat.id} className={`group flex items-center gap-1 rounded-xs ${chat.id === activeId ? 'bg-foreground/10' : 'hover:bg-foreground/5'}`}><button className="min-w-0 flex-1 truncate px-3 py-2.5 text-left text-xs text-foreground/90" onClick={() => setActiveId(chat.id)} aria-current={chat.id === activeId}>{chat.title}</button><button className="p-2 text-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-foreground" onClick={() => remove(chat.id)} aria-label={`Xóa cuộc trò chuyện: ${chat.title}`}><X size={14} /></button></div>)}</nav><p className="border-t border-solid border-foreground/20 p-5 text-[10px] leading-5 text-foreground/55">Câu trả lời do AI tạo dựa trên dữ liệu hiện có. Không phải lời khuyên đầu tư.</p></aside>
        <section className="flex min-h-0 min-w-0 flex-col" aria-label="Trò chuyện với trợ lý Finsight"><div ref={thread} className="min-h-0 flex-1 overflow-y-auto" data-lenis-prevent><div className="mx-auto w-[88%] max-w-[780px] py-10 max-[560px]:w-[90%]">
          {!active ? <div className="pt-6 md:pt-12"><Sparkles size={26} strokeWidth={1.3} /><p className="mt-6 text-[11px] tracking-[0.3em] text-foreground/70">TRỢ LÝ FINSIGHT</p><h1 className="mt-4 font-editorial text-[clamp(34px,3.4vw,54px)] leading-[1.15] font-normal tracking-[-0.035em]">Hỏi gì về thị trường hôm nay?</h1><p className="mt-5 max-w-[52ch] font-editorial text-[16px] leading-[1.7] text-foreground/80">Trợ lý kết nối dữ liệu thị trường, tin doanh nghiệp và báo cáo tài chính của Finsight.</p><div className="mt-10 grid gap-3 sm:grid-cols-2">{suggestions.map((item) => <button key={item} className="group flex items-start justify-between gap-4 border border-solid border-foreground/25 p-4 text-left text-[13px] leading-6 transition-colors hover:border-foreground/60 hover:bg-foreground/5" onClick={() => send(item)}>{item}<ArrowUpRight size={16} strokeWidth={1.4} className="mt-1 shrink-0 text-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></button>)}</div></div> : <ol className="flex flex-col gap-8" aria-live="polite">{active.messages.map((message) => <li key={message.id} className={message.role === 'user' ? 'flex justify-end' : 'flex gap-4'}>{message.role === 'user' ? <p className="max-w-[85%] rounded-xs bg-foreground px-4 py-3 text-[13px] leading-6 text-background">{message.text}</p> : <><span className="mt-0.5 grid size-8 shrink-0 place-items-center border border-solid border-foreground/30"><Sparkles size={16} strokeWidth={1.4} /></span><div className="min-w-0 flex-1"><p className="text-[13px] leading-7 whitespace-pre-line text-foreground/90">{message.text || <span className="text-foreground/50">Đang tìm câu trả lời từ dữ liệu Finsight…</span>}</p>{message.refs && (message.refs.stocks.length > 0 || message.refs.articles.length > 0) && <div className="mt-4 flex flex-col gap-3">{message.refs.stocks.length > 0 && <div className="flex flex-wrap gap-2">{message.refs.stocks.map((symbol) => <StockChip key={symbol} symbol={symbol} />)}</div>}{message.refs.articles.map((slug) => <ArticleRef key={slug} slug={slug} />)}</div>}</div></>}</li>)}</ol>}
        </div></div><form className="shrink-0 border-t border-solid border-foreground/20 bg-background" onSubmit={(event) => { event.preventDefault(); send(draft); }}><div className="mx-auto w-[88%] max-w-[780px] py-5 max-[560px]:w-[90%]">{!userEmail && <p className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-foreground/60">Đăng nhập để lưu lịch sử và hỏi trợ lý AI. <Link className="underline underline-offset-4" href="/dang-nhap/">Đăng nhập Google</Link></p>}{error && !busy && <p role="alert" className="mb-3 text-[11px] text-red-700">{error}</p>}{loginRequired && <p role="alert" className="mb-3 text-[11px] text-red-700">Bạn cần đăng nhập để gửi câu hỏi.</p>}<div className="flex items-end gap-3 border border-solid border-foreground/35 p-3 transition-colors focus-within:border-foreground"><textarea ref={field} rows={1} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(draft); } }} placeholder="Hỏi về cổ phiếu, tin tức, báo cáo…" aria-label="Nhập câu hỏi" className="max-h-[180px] min-h-8 flex-1 resize-none border-0 bg-transparent px-1 py-1.5 font-sans text-[13px] leading-6 text-foreground outline-none placeholder:text-foreground/50" /><button type="submit" disabled={!draft.trim() || busy} className="grid size-9 shrink-0 place-items-center bg-foreground text-background transition-opacity hover:opacity-85 disabled:opacity-30" aria-label="Gửi câu hỏi"><ArrowUp size={18} strokeWidth={1.6} /></button></div><p className="mt-3 text-[10px] text-foreground/50">Enter để gửi · Shift + Enter xuống dòng · {userEmail || 'Cần đăng nhập Google'}</p></div></form></section>
      </div>
    </div>
  );
}

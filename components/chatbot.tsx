'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Brand } from './shell';
import { ArrowUp, ArrowUpRight, Ellipsis, Pencil, PanelLeftClose, PanelLeftOpen, Plus, Sparkles, Trash2 } from './icons';
import { articles, stocks, number, signed } from '@/lib/data';

type Refs = { stocks: string[]; articles: string[] };
type Msg = { id: string; role: 'user' | 'assistant'; text: string; refs?: Refs };
type Chat = { id: string; title: string; messages: Msg[] };

const STORE = 'finsight-chats';
const suggestions = [
  'Hôm nay cổ phiếu nào tăng mạnh nhất?',
  'Tóm tắt tin mới nhất về ngân hàng',
  'Phân tích nhanh FPT',
  'Thanh khoản là gì và vì sao quan trọng?',
];
const id = () => Math.random().toString(36).slice(2, 10);
const positive = (value: number) => (value < 0 ? 'text-red-800 dark:text-red-300' : 'text-emerald-800 dark:text-emerald-300');

/** Trợ lý minh họa: trả lời từ dữ liệu mẫu trong lib/data, chưa nối mô hình AI thật. */
function answer(question: string): Pick<Msg, 'text' | 'refs'> {
  const q = question.toLocaleLowerCase('vi');
  const mentioned = stocks.filter(s => new RegExp(`\\b${s.symbol.toLowerCase()}\\b`).test(q) || q.includes(s.short.toLowerCase()));
  if (mentioned.length) {
    const symbols = mentioned.map(s => s.symbol);
    const related = articles.filter(a => a.tickers.some(t => symbols.includes(t))).slice(0, 2);
    const lines = mentioned.map(s => `• ${s.symbol} (${s.short}) đang ở ${number(s.price)} VND, ${signed(s.change)}% so với phiên trước.`);
    return {
      text: `${lines.join('\n')}\n\nĐây là số liệu minh họa. Mình đã gom các bài viết liên quan bên dưới để bạn đọc thêm bối cảnh.`,
      refs: { stocks: symbols, articles: related.map(a => a.slug) },
    };
  }
  if (/tăng mạnh|giảm mạnh|biến động|tăng nhất|giảm nhất/.test(q)) {
    const sorted = [...stocks].sort((a, b) => (q.includes('giảm') ? a.change - b.change : b.change - a.change)).slice(0, 3);
    return {
      text: `${q.includes('giảm') ? 'Các mã giảm mạnh' : 'Các mã tăng mạnh'} nhất trong dữ liệu minh họa:\n${sorted.map(s => `• ${s.symbol}: ${signed(s.change)}%`).join('\n')}`,
      refs: { stocks: sorted.map(s => s.symbol), articles: [] },
    };
  }
  if (/thanh khoản/.test(q)) {
    return {
      text: 'Thanh khoản cho biết một cổ phiếu dễ mua bán đến đâu mà không làm giá lệch nhiều. Khối lượng giao dịch lớn thường đi cùng chênh lệch giá mua bán hẹp, nên nhà đầu tư vào và ra vị thế thuận lợi hơn. Khi giá tăng nhưng thanh khoản yếu, đà tăng thường kém bền vững.',
      refs: { stocks: [], articles: articles.filter(a => /thanh khoản/i.test(a.title)).slice(0, 1).map(a => a.slug) },
    };
  }
  const words = q.split(/\s+/).filter(word => word.length > 2);
  const scored = articles
    .map(a => ({ a, score: words.filter(word => `${a.title} ${a.description} ${a.category}`.toLocaleLowerCase('vi').includes(word)).length }))
    .filter(item => item.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, 3);
  if (scored.length || /tin|bài|mới/.test(q)) {
    const picked = scored.length ? scored.map(item => item.a) : articles.slice(0, 3);
    return { text: 'Mình tìm được những bài viết phù hợp với câu hỏi của bạn:', refs: { stocks: [], articles: picked.map(a => a.slug) } };
  }
  return {
    text: 'Mình chưa có dữ liệu cho câu hỏi này. Bạn thử hỏi theo mã cổ phiếu (ví dụ FPT, VCB), theo chủ đề tin tức, hoặc nhờ mình giải thích một thuật ngữ tài chính nhé. Trợ lý đang trong giai đoạn thử nghiệm và dùng dữ liệu minh họa.',
  };
}

function StockChip({ symbol }: { symbol: string }) {
  const stock = stocks.find(s => s.symbol === symbol);
  if (!stock) return null;
  return (
    <span className="inline-flex items-center gap-3 border border-solid border-foreground/25 px-3 py-2 text-[11px] tabular-nums">
      <strong className="font-medium">{stock.symbol}</strong>
      <span>{number(stock.price)}</span>
      <span className={positive(stock.change)}>{signed(stock.change)}%</span>
    </span>
  );
}

function ArticleRef({ slug }: { slug: string }) {
  const article = articles.find(a => a.slug === slug);
  if (!article) return null;
  return (
    <Link href={`/tin-tuc/${article.slug}/`} className="group grid grid-cols-[84px_1fr] items-center gap-4 border border-solid border-foreground/20 p-3 transition-colors hover:border-foreground/50">
      <img className="aspect-[4/3] h-full w-full object-cover saturate-[0.85]" src={article.image} alt="" loading="lazy" />
      <span className="min-w-0">
        <span className="text-[9px] tracking-wider uppercase text-foreground/65">{article.category} · {article.read}</span>
        <span className="mt-1 block font-editorial text-[15px] leading-snug group-hover:underline group-hover:underline-offset-4">{article.title}</span>
      </span>
    </Link>
  );
}

export default function Chatbot() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeId, setActiveId] = useState('');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menu, setMenu] = useState<{ id: string; top: number; left: number } | null>(null);
  const [renaming, setRenaming] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const popup = useRef<HTMLDivElement>(null);
  const thread = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || '[]') as Chat[];
      if (Array.isArray(saved) && saved.length) { setChats(saved); setActiveId(saved[0].id); }
    } catch {}
    setLoaded(true);
    return () => clearInterval(timer.current);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORE, JSON.stringify(chats.slice(0, 20))); } catch {}
  }, [chats, loaded]);

  useEffect(() => {
    if (!menu) return;
    const onDown = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!popup.current?.contains(target) && !target.closest('[data-chat-menu-trigger]')) setMenu(null);
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenu(null); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [menu]);

  const active = chats.find(c => c.id === activeId);
  useEffect(() => { thread.current?.scrollTo({ top: thread.current.scrollHeight, behavior: 'smooth' }); }, [active?.messages]);
  useEffect(() => {
    const element = field.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 180)}px`;
  }, [draft]);

  const patch = (chatId: string, update: (chat: Chat) => Chat) => setChats(list => list.map(c => (c.id === chatId ? update(c) : c)));

  function send(raw: string) {
    const text = raw.trim();
    if (!text || busy) return;
    const reply = answer(text);
    const assistantId = id();
    let chatId = activeId;
    const userMessage: Msg = { id: id(), role: 'user', text };
    const pending: Msg = { id: assistantId, role: 'assistant', text: '' };
    if (!active) {
      chatId = id();
      setChats(list => [{ id: chatId, title: text.length > 38 ? `${text.slice(0, 38)}…` : text, messages: [userMessage, pending] }, ...list]);
      setActiveId(chatId);
    } else {
      patch(chatId, c => ({ ...c, messages: [...c.messages, userMessage, pending] }));
    }
    setDraft('');
    setBusy(true);
    let shown = 0;
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      shown = Math.min(reply.text.length, shown + 3);
      const done = shown >= reply.text.length;
      patch(chatId, c => ({ ...c, messages: c.messages.map(m => (m.id === assistantId ? { ...m, text: reply.text.slice(0, shown), refs: done ? reply.refs : undefined } : m)) }));
      if (done) { clearInterval(timer.current); setBusy(false); }
    }, 16);
  }

  function newChat() {
    clearInterval(timer.current);
    setBusy(false);
    setActiveId('');
    field.current?.focus();
  }

  function commitRename(chatId: string) {
    const title = renameValue.trim();
    if (title) patch(chatId, c => ({ ...c, title }));
    setRenaming('');
  }

  function remove(chatId: string) {
    setChats(list => list.filter(c => c.id !== chatId));
    if (chatId === activeId) setActiveId('');
  }

  return (
    <div data-home className="h-dvh overflow-hidden bg-background font-sans text-foreground selection:bg-foreground selection:text-background [&_:focus-visible]:outline-foreground motion-reduce:[&_*]:transition-none">
      <div className={`grid h-full grid-cols-1 grid-rows-[auto_minmax(0,1fr)] transition-[grid-template-columns] duration-200 lg:grid-rows-1 ${sidebarOpen ? 'lg:grid-cols-[272px_minmax(0,1fr)]' : 'lg:grid-cols-[64px_minmax(0,1fr)]'}`}>
        <div className="flex items-center justify-between border-b border-solid border-foreground/20 px-5 py-4 lg:hidden">
          <Link href="/" aria-label="Finsight — Trang chủ"><Brand height={32} /></Link>
        </div>
        <aside className="hidden min-h-0 overflow-hidden border-r border-solid border-foreground/20 lg:block" aria-label="Lịch sử trò chuyện">
         {!sidebarOpen ? (
          <div className="flex h-full w-16 flex-col items-center gap-3 pt-6">
            <button className="group relative grid size-10 place-items-center text-foreground" onClick={() => setSidebarOpen(true)} aria-label="Mở thanh bên">
              <span className="transition-opacity group-hover:opacity-0 group-focus-visible:opacity-0"><span className="logo-f" style={{ height: 34, width: 24 }} aria-hidden="true" /></span>
              <PanelLeftOpen size={20} strokeWidth={1.5} className="absolute opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
            </button>
            <button className="p-2 text-foreground/70 transition-colors hover:text-foreground" onClick={newChat} aria-label="Cuộc trò chuyện mới"><Plus size={18} strokeWidth={1.4} /></button>
          </div>
         ) : (
         <div className="flex h-full w-[272px] flex-col">
          <div className="flex items-center justify-between px-5 pt-6">
            <Link href="/" aria-label="Finsight — Trang chủ"><Brand height={38} /></Link>
            <div className="flex items-center gap-3">
              <button className="p-1.5 text-foreground/70 transition-colors hover:text-foreground" onClick={() => { setSidebarOpen(false); setMenu(null); }} aria-label="Đóng thanh bên"><PanelLeftClose size={18} strokeWidth={1.5} /></button>
            </div>
          </div>
          <div className="p-5">
            <button className="flex w-full items-center justify-between gap-3 rounded-xs border border-solid border-foreground/40 px-4 py-3 text-xs transition-colors hover:bg-foreground/10" onClick={newChat}>
              Cuộc trò chuyện mới <Plus size={16} strokeWidth={1.4} />
            </button>
          </div>
          <p className="px-5 pb-2 text-[10px] tracking-wider text-foreground/55 uppercase">Gần đây</p>
          <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-4" data-lenis-prevent onScroll={() => setMenu(null)}>
            {chats.length === 0 && <p className="px-3 py-2 text-xs leading-6 text-foreground/55">Chưa có cuộc trò chuyện nào.</p>}
            {chats.map(chat => (
              <div key={chat.id} className={`group flex items-center gap-1 rounded-xs ${chat.id === activeId ? 'bg-foreground/10' : 'hover:bg-foreground/5'}`}>
                {renaming === chat.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={event => setRenameValue(event.target.value)}
                    onBlur={() => commitRename(chat.id)}
                    onKeyDown={event => { if (event.key === 'Enter' && !event.nativeEvent.isComposing) commitRename(chat.id); if (event.key === 'Escape') setRenaming(''); }}
                    aria-label="Tên cuộc trò chuyện"
                    className="m-1 min-w-0 flex-1 border border-solid border-foreground/40 bg-transparent px-2 py-1.5 text-xs text-foreground outline-none focus:border-foreground"
                  />
                ) : (
                  <button className="min-w-0 flex-1 truncate px-3 py-2.5 text-left text-xs text-foreground/90" onClick={() => setActiveId(chat.id)} aria-current={chat.id === activeId}>{chat.title}</button>
                )}
                <button
                  data-chat-menu-trigger
                  className={`p-2 text-foreground/50 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 ${menu?.id === chat.id ? 'opacity-100' : 'opacity-0'}`}
                  onClick={event => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    setMenu(current => (current?.id === chat.id ? null : { id: chat.id, top: rect.bottom + 4, left: rect.right - 160 }));
                  }}
                  aria-haspopup="menu"
                  aria-expanded={menu?.id === chat.id}
                  aria-label={`Tùy chọn cuộc trò chuyện: ${chat.title}`}
                ><Ellipsis size={16} /></button>
              </div>
            ))}
          </nav>
          <p className="border-t border-solid border-foreground/20 p-5 text-[10px] leading-5 text-foreground/55">Trợ lý thử nghiệm, dùng dữ liệu minh họa. Không phải lời khuyên đầu tư.</p>
         </div>
         )}
        </aside>
        {menu && (
          <div ref={popup} role="menu" style={{ top: menu.top, left: menu.left }} className="fixed z-20 w-40 border border-solid border-foreground/30 bg-background py-1 shadow-lg">
            <button role="menuitem" className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs transition-colors hover:bg-foreground/10" onClick={() => { const chat = chats.find(c => c.id === menu.id); setRenameValue(chat?.title ?? ''); setRenaming(menu.id); setMenu(null); }}><Pencil size={14} strokeWidth={1.5} /> Đổi tên</button>
            <button role="menuitem" className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs transition-colors hover:bg-foreground/10" onClick={() => { remove(menu.id); setMenu(null); }}><Trash2 size={14} strokeWidth={1.5} /> Xóa</button>
          </div>
        )}

        <section className="flex min-h-0 min-w-0 flex-col" aria-label="Trò chuyện với trợ lý Finsight">
          <div ref={thread} className="min-h-0 flex-1 overflow-y-auto" data-lenis-prevent>
            <div className="mx-auto w-[88%] max-w-[780px] py-10 max-[560px]:w-[90%]">
              {!active ? (
                <div className="pt-6 md:pt-12">
                  <Sparkles size={26} strokeWidth={1.3} />
                  <p className="mt-6 text-[11px] tracking-[0.3em] text-foreground/70">TRỢ LÝ FINSIGHT</p>
                  <h1 className="mt-4 font-editorial text-[clamp(34px,3.4vw,54px)] leading-[1.15] font-normal tracking-[-0.035em]">Hỏi gì về thị trường hôm nay?</h1>
                  <p className="mt-5 max-w-[52ch] font-editorial text-[16px] leading-[1.7] text-foreground/80">Hỏi theo mã cổ phiếu, chủ đề tin tức hay một thuật ngữ cần hiểu. Mình trả lời từ dữ liệu và bài viết của Finsight.</p>
                  <div className="mt-10 grid gap-3 sm:grid-cols-2">
                    {suggestions.map(item => (
                      <button key={item} className="group flex items-start justify-between gap-4 border border-solid border-foreground/25 p-4 text-left text-[13px] leading-6 transition-colors hover:border-foreground/60 hover:bg-foreground/5" onClick={() => send(item)}>
                        {item}
                        <ArrowUpRight size={16} strokeWidth={1.4} className="mt-1 shrink-0 text-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <ol className="flex flex-col gap-8" aria-live="polite">
                  {active.messages.map(message => (
                    <li key={message.id} className={message.role === 'user' ? 'flex justify-end' : 'flex gap-4'}>
                      {message.role === 'user' ? (
                        <p className="max-w-[85%] rounded-xs bg-foreground px-4 py-3 text-[13px] leading-6 text-background">{message.text}</p>
                      ) : (
                        <>
                          <span className="mt-0.5 grid size-8 shrink-0 place-items-center border border-solid border-foreground/30"><Sparkles size={16} strokeWidth={1.4} /></span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] leading-7 whitespace-pre-line text-foreground/90">{message.text || <span className="text-foreground/50">Đang soạn câu trả lời…</span>}</p>
                            {message.refs && (message.refs.stocks.length > 0 || message.refs.articles.length > 0) && (
                              <div className="mt-4 flex flex-col gap-3">
                                {message.refs.stocks.length > 0 && <div className="flex flex-wrap gap-2">{message.refs.stocks.map(symbol => <StockChip key={symbol} symbol={symbol} />)}</div>}
                                {message.refs.articles.map(slug => <ArticleRef key={slug} slug={slug} />)}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
          <form className="shrink-0 border-t border-solid border-foreground/20 bg-background" onSubmit={event => { event.preventDefault(); send(draft); }}>
            <div className="mx-auto w-[88%] max-w-[780px] py-5 max-[560px]:w-[90%]">
              <div className="flex items-end gap-3 border border-solid border-foreground/35 p-3 transition-colors focus-within:border-foreground">
                <textarea
                  ref={field}
                  rows={1}
                  value={draft}
                  onChange={event => setDraft(event.target.value)}
                  onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(draft); } }}
                  placeholder="Hỏi về cổ phiếu, tin tức, thuật ngữ…"
                  aria-label="Nhập câu hỏi"
                  className="max-h-[180px] min-h-8 flex-1 resize-none border-0 font-sans bg-transparent px-1 py-1.5 text-[13px] leading-6 text-foreground outline-none placeholder:text-foreground/50"
                />
                <button type="submit" disabled={!draft.trim() || busy} className="grid size-9 shrink-0 place-items-center bg-foreground text-background transition-opacity hover:opacity-85 disabled:opacity-30" aria-label="Gửi câu hỏi"><ArrowUp size={18} strokeWidth={1.6} /></button>
              </div>
              <p className="mt-3 text-[10px] text-foreground/50">Enter để gửi · Shift + Enter xuống dòng · Dữ liệu minh họa</p>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

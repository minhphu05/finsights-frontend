'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { NavigationMenu } from '@animate-ui/react/primitives/base-ui/navigation-menu';
import { Brand, useAppData } from './shell';
import { homeStyles as ui } from './home-styles';
import ThemeToggle from './theme-toggle';
import { ArrowRight, ChevronDown, Menu, Search, X } from './icons';

export function LineIcon({ kind = 'arrow' }: { kind?: 'arrow' | 'search' | 'menu' | 'close' }) {
  const Icon = { search: Search, menu: Menu, close: X, arrow: ArrowRight }[kind];
  return <Icon size={20} strokeWidth={1.4} className="shrink-0" />;
}

const navigation = [
  { href: '/tin-tuc/', label: 'TIN TỨC' },
  { href: '/bao-cao-tai-chinh/', label: 'BÁO CÁO' },
  { href: '/#thi-truong', label: 'THỊ TRƯỜNG' },
  { href: '/chatbot/', label: 'CHATBOT' },
];

const topics = ['Thị trường', 'Doanh nghiệp', 'Vĩ mô', 'Ngân hàng'];
const dropdowns: Record<string, { href: string; label: string }[]> = {
  'TIN TỨC': [
    { href: '/tin-tuc/', label: 'Tất cả tin tức' },
    ...topics.map(topic => ({ href: `/tin-tuc/?chu-de=${encodeURIComponent(topic)}`, label: topic })),
  ],
  'THỊ TRƯỜNG': [
    { href: '/#thi-truong', label: 'Tổng quan thị trường' },
    { href: '/#chart-title', label: 'Diễn biến thị trường' },
    { href: '/#stocks-title', label: 'Khám phá cổ phiếu' },
    { href: '/theo-doi/', label: 'Danh sách theo dõi' },
  ],
};
const navItem = 'flex items-center gap-2 text-xs whitespace-nowrap hover:text-primary/75 min-[851px]:max-[1150px]:text-[10px]';
const topicLink = 'flex items-center justify-between gap-4 px-4 py-3 text-xs tracking-wider uppercase hover:bg-primary/10';

export function HomeHeader() {
  const { articles, userEmail, signOut } = useAppData();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [pastHero, setPastHero] = useState(false);
  const [idle, setIdle] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [focused, setFocused] = useState(false);
  const interacting = menu || search || hovering || focused;
  const hidden = idle && !interacting;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const measure = () => {
      const hero = document.querySelector<HTMLElement>('[data-hero-screen]');
      // While LandingMotion pins the hero it stays fixed on screen; GSAP's .pin-spacer wrapper keeps its real scroll position.
      const box = hero?.closest('.pin-spacer') ?? hero;
      const header = document.querySelector<HTMLElement>('[data-home-header]')?.offsetHeight ?? 0;
      setPastHero(box ? box.getBoundingClientRect().bottom <= header : window.scrollY > window.innerHeight);
    };
    const scheduleHide = () => {
      clearTimeout(timer);
      if (window.scrollY > 24 && !interacting) timer = setTimeout(() => setIdle(true), 1000);
    };
    const onScroll = () => {
      measure();
      setIdle(false);
      scheduleHide();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      setIdle(false);
      scheduleHide();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Tab') { setIdle(false); scheduleHide(); }
    };
    measure();
    if (interacting) setIdle(false);
    scheduleHide();
    const observer = new ResizeObserver(measure);
    const hero = document.querySelector('[data-hero-screen]');
    if (hero) observer.observe(hero);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('keydown', onKey);
    };
  }, [interacting]);
  const matches = articles.filter(article =>
    `${article.title} ${article.tickers.join(' ')}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')),
  );

  return (
    <header data-home-header data-hidden={hidden} onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }} className={`fixed inset-x-0 top-0 z-40 border-b border-solid border-primary/10 bg-background font-sans text-primary will-change-[translate] transition-[translate,background-color,box-shadow] selection:bg-primary selection:text-ink [&_:focus-visible]:outline-primary motion-reduce:transition-none ${pastHero ? 'shadow-sm shadow-black/5' : ''} ${hidden ? '-translate-y-full !shadow-none pointer-events-none duration-[420ms] ease-[cubic-bezier(0.4,0,0.6,1)]' : 'translate-y-0 duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)]'}`}>
      <div className="relative mx-auto flex h-[86px] w-[88%] max-w-[1480px] items-center justify-between gap-9 max-[1150px]:gap-5 max-[560px]:h-[76px] max-[560px]:w-[90%] max-[560px]:gap-3">
        <Link href="/" className={ui.wordmark} aria-label="Finsight — Trang chủ"><Brand height={44} /></Link>
        <NavigationMenu.Root className="max-[850px]:hidden" aria-label="Điều hướng chính">
          <NavigationMenu.List className="m-0 flex list-none items-center gap-[clamp(20px,3vw,54px)] p-0 max-[1150px]:gap-5 [&>li]:list-none">
            {navigation.map(({ href, label }) => (
              <NavigationMenu.Item key={href}>
                {dropdowns[label] ? (
                  <>
                    <NavigationMenu.Trigger className={`${navItem} group cursor-pointer`}>
                      {label}
                      <ChevronDown size={14} strokeWidth={1.6} aria-hidden="true" className="transition-transform duration-300 group-data-[popup-open]:rotate-180 motion-reduce:transition-none" />
                    </NavigationMenu.Trigger>
                    <NavigationMenu.Content className="w-[260px] p-2">
                      {dropdowns[label].map(item => (
                        <NavigationMenu.Link key={item.href} render={<Link href={item.href} />} className={topicLink}>{item.label}</NavigationMenu.Link>
                      ))}
                    </NavigationMenu.Content>
                  </>
                ) : (
                  <NavigationMenu.Link render={<Link href={href} />} className={navItem}>
                    {label}
                  </NavigationMenu.Link>
                )}
              </NavigationMenu.Item>
            ))}
          </NavigationMenu.List>
          <NavigationMenu.Portal>
            <NavigationMenu.Positioner sideOffset={10} className="z-50">
              <NavigationMenu.Popup className="h-(--popup-height) w-(--popup-width) overflow-hidden bg-background font-sans text-primary shadow-xl shadow-black/25 outline-none">
                <NavigationMenu.Viewport />
              </NavigationMenu.Popup>
            </NavigationMenu.Positioner>
          </NavigationMenu.Portal>
        </NavigationMenu.Root>
        <nav id="home-navigation" className={`absolute inset-x-0 top-[75px] flex-col items-start gap-6 bg-background p-6 min-[851px]:hidden ${menu ? 'flex' : 'hidden'}`} aria-label="Điều hướng chính">
          {navigation.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setMenu(false)} className="flex items-center gap-2 text-xs whitespace-nowrap hover:text-primary/75">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-6 text-xs max-[1150px]:gap-3 max-[560px]:gap-2">
          <ThemeToggle />
          <button className="flex min-h-10 min-w-8 items-center justify-center" aria-label="Tìm tin tức" aria-expanded={search} aria-controls="home-search" onClick={() => setSearch(!search)}>
            <LineIcon kind={search ? 'close' : 'search'} />
          </button>
          <Link className="border-l border-solid border-primary/30 pl-6 hover:text-primary/75 max-[1150px]:pl-3.5 max-[560px]:hidden" href="/theo-doi/">Theo dõi</Link>
          {userEmail ? <><Link className="border-l border-solid border-primary/30 pl-6 hover:text-primary/75 max-[1150px]:pl-3.5 max-[560px]:hidden" href="/bao-cao-tai-chinh/">{userEmail}</Link><button className="text-[10px] text-primary/70 hover:text-primary" onClick={signOut}>Thoát</button></> : <Link className={`${ui.primaryButton} rounded-xs px-6 py-[11px] whitespace-nowrap max-[560px]:hidden`} href="/dang-nhap/">Đăng nhập</Link>}
          <button className="flex min-h-10 min-w-8 items-center justify-center min-[851px]:hidden" aria-label={menu ? 'Đóng menu' : 'Mở menu'} aria-expanded={menu} aria-controls="home-navigation" onClick={() => setMenu(!menu)}>
            <LineIcon kind={menu ? 'close' : 'menu'} />
          </button>
        </div>
        {search && (
          <section id="home-search" className="absolute top-[78px] right-0 w-full max-w-[460px] bg-background p-6 text-primary shadow-xl shadow-black/25">
            <label className="mb-3 block" htmlFor="fin-query">Tìm kiếm tin tức</label>
            <input className="w-full border border-solid border-primary/50 bg-background p-3 placeholder:text-primary/60" id="fin-query" autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Tên doanh nghiệp, chủ đề…" onKeyDown={e => { if (e.key === 'Escape') setSearch(false); }} />
            <div>
              {matches.map(article => <Link className="flex items-center justify-between gap-5 border-b border-solid border-primary/25 py-3.5 text-[13px] hover:text-primary/75" key={article.slug} href={`/tin-tuc/${article.slug}/`}>{article.title}<LineIcon /></Link>)}
            </div>
            {!matches.length && <p className="mt-4">Chưa tìm thấy tin phù hợp. Thử tên FPT hoặc ngân hàng.</p>}
          </section>
        )}
      </div>
    </header>
  );
}

export function AssistantButton({ floating = false }: { floating?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const close = (event: MouseEvent) => { if (event.target === element) element?.close(); };
    element?.addEventListener('click', close);
    return () => element?.removeEventListener('click', close);
  }, []);

  return (
    <>
      <button className={floating
        ? 'fixed right-7 bottom-7 z-35 grid size-14 place-items-center rounded-xs border border-solid border-accent bg-accent text-white shadow-lg shadow-black/10 hover:bg-accent/90 max-[560px]:right-[18px] max-[560px]:bottom-[18px] max-[560px]:size-[50px]'
        : `${ui.button} ${ui.outlineButton}`}
        aria-label="Trò chuyện với AI" onClick={() => dialog.current?.showModal()}>
        {!floating && 'Trò chuyện với AI'}
      </button>
      <dialog ref={dialog} className="w-[90vw] max-w-[440px] border-0 bg-ink p-10 font-sans text-primary backdrop:bg-black/60">
        <button className="absolute top-[15px] right-[15px] p-2" aria-label="Đóng" onClick={() => dialog.current?.close()}><LineIcon kind="close" /></button>
        <h2 className="font-editorial text-[30px] font-normal">Trợ lý Finsight</h2>
        <p className="mt-[18px] mb-6 leading-[1.8] text-primary/80">Trợ lý AI đang được phát triển. Trong lúc chờ, khám phá các bài phân tích và theo dõi doanh nghiệp bạn quan tâm.</p>
        <Link href="/tin-tuc/" className={`${ui.button} ${ui.primaryButton}`}>Đọc bài phân tích <LineIcon /></Link>
      </dialog>
    </>
  );
}

'use client';
import Link from 'next/link';
import { HomeHeader } from '@/components/home';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  ArrowUpRight,
  Search,
  X,
  ArrowRight,
  Bookmark,
  Check,
  House,
  ChartLine,
  StockTable,
  Bell,
  Settings,
  Sun,
} from '@/components/icons';
import { number, signed, type Stock } from '@/lib/data';
import { listAllStocks, listIndices, listNews, type APIArticle, type MarketIndex } from '@/lib/api';
import { getSession, signOut as endSession } from '@/lib/auth-actions';
import { changeWatchlist, getWatchlist } from '@/lib/user-actions';

type AppData = {
  stocks: Stock[];
  indices: MarketIndex[];
  articles: APIArticle[];
  loading: boolean;
  dataError: string | null;
  watch: string[];
  toggle: (symbol: string) => void;
  ready: boolean;
  userEmail: string | null;
  signOut: () => void;
};
const WatchContext = createContext<AppData>({
  stocks: [], indices: [], articles: [], loading: true, dataError: null,
  watch: [], toggle: () => {}, ready: false, userEmail: null, signOut: () => {},
});
export const useAppData = () => useContext(WatchContext);
export const useWatch = () => useAppData();
export function AppProvider({ children }: { children: React.ReactNode }) {
  const initialPathname = usePathname();
  const [watch, setWatch] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [stocksData, setStocksData] = useState<Stock[]>([]);
  const [indicesData, setIndicesData] = useState<MarketIndex[]>([]);
  const [articlesData, setArticlesData] = useState<APIArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const signedIn = useRef(false);
  useEffect(() => {
    let mounted = true;
    const isAdminRoute = initialPathname?.startsWith('/admin');
    if (isAdminRoute) {
      setLoading(false);
    } else {
      const shouldLoadLatestNews = !initialPathname?.startsWith('/tin-tuc');
      const latestNews = shouldLoadLatestNews ? listNews({ limit: 8 }) : Promise.resolve({ articles: [], total: 0 });
      Promise.allSettled([listAllStocks(), listIndices(), latestNews]).then((results) => {
        if (!mounted) return;
        const messages: string[] = [];
        if (results[0].status === 'fulfilled') setStocksData(results[0].value);
        else messages.push(results[0].reason instanceof Error ? results[0].reason.message : 'Không tải được cổ phiếu.');
        if (results[1].status === 'fulfilled') setIndicesData(results[1].value);
        else messages.push(results[1].reason instanceof Error ? results[1].reason.message : 'Không tải được chỉ số.');
        if (results[2].status === 'fulfilled') setArticlesData(results[2].value.articles);
        else messages.push(results[2].reason instanceof Error ? results[2].reason.message : 'Không tải được tin tức.');
        setDataError(messages.length ? [...new Set(messages)].join(' ') : null);
        setLoading(false);
        if (!signedIn.current) try {
          const saved = JSON.parse(localStorage.getItem('nep-watchlist') || '[]');
          if (Array.isArray(saved)) setWatch(saved.filter((value): value is string => typeof value === 'string' && results[0].status === 'fulfilled' && results[0].value.some((stock) => stock.symbol === value)));
        } catch {}
      });
    }
    setReady(true);
    // On first load the public data above restores the local watchlist for signed-out visitors.
    const syncSession = async (initial: boolean) => {
      const session = await getSession().catch(() => undefined);
      if (!mounted || session === undefined) return;
      signedIn.current = Boolean(session);
      setUserEmail(session?.email ?? null);
      if (session) {
        const result = await getWatchlist().catch(() => null);
        if (!mounted) return;
        if (result?.ok) setWatch(result.data);
        else if (result?.status === 401) window.dispatchEvent(new Event('finsight-auth-change'));
        else setDataError('Không thể đồng bộ danh sách theo dõi.');
      } else if (!initial) {
        try {
          const saved = JSON.parse(localStorage.getItem('nep-watchlist') || '[]');
          if (Array.isArray(saved)) setWatch(saved.filter((value): value is string => typeof value === 'string'));
        } catch { setWatch([]); }
      }
    };
    const authChanged = () => { syncSession(false); };
    window.addEventListener('finsight-auth-change', authChanged);
    syncSession(true);
    return () => { mounted = false; window.removeEventListener('finsight-auth-change', authChanged); };
  }, []);
  // Phần tử .reveal hiện dần khi cuộn tới; theo dõi cả phần tử được thêm sau khi đổi trang.
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        }),
      { rootMargin: '0px 0px -8% 0px' },
    );
    const scan = () =>
      document.querySelectorAll('.reveal:not(.is-in)').forEach((el) => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  function toggle(symbol: string) {
    setWatch((current) => {
      const next = current.includes(symbol)
        ? current.filter((v) => v !== symbol)
        : [...current, symbol];
      try {
        localStorage.setItem('nep-watchlist', JSON.stringify(next));
      } catch {}
      return next;
    });
    if (signedIn.current) {
      const add = !watch.includes(symbol);
      changeWatchlist(symbol, add).then((result) => {
        if (result.ok) return setWatch(result.data);
        setDataError(result.message);
        if (result.status === 401) window.dispatchEvent(new Event('finsight-auth-change'));
      }).catch(() => setDataError('Không thể cập nhật danh sách theo dõi.'));
    }
  }
  function signOut() {
    endSession()
      .then(() => window.dispatchEvent(new Event('finsight-auth-change')))
      .catch(() => setDataError('Không thể đăng xuất. Hãy thử lại.'));
  }
  return <WatchContext.Provider value={{ watch, toggle, ready, stocks: stocksData, indices: indicesData, articles: articlesData, loading, dataError, userEmail, signOut }}>{children}</WatchContext.Provider>;
}
// Logo Finsights: cáo cam trên ô nền cam nhạt.
export function LogoImg({ size = 30 }: { size?: number }) {
  const mark = Math.round(size * 0.78);
  return (
    <span className="logo-tile" style={{ width: size, height: size }} aria-hidden="true">
      <span className="logo-f" style={{ height: mark, width: mark }} />
    </span>
  );
}
// Logo đầy đủ: cáo và chữ "Finsights".
export function Brand({ height = 40 }: { height?: number }) {
  return <span className="logo-plain" style={{ height, width: Math.round((height * 1200) / 321) }} aria-hidden="true" />;
}
// Thanh biểu tượng bên trái: chuông, cài đặt và giao diện sáng chưa có tính năng nên chỉ hiển thị "Sắp có".
function SideRail({ pathname }: { pathname: string }) {
  const links: [string, string, React.ReactNode][] = [
    ['/', 'Thị trường', <House key="h" size={21} />],
    ['/#chart-title', 'Biểu đồ', <ChartLine key="l" size={21} />],
    ['/#stocks-title', 'Bảng cổ phiếu', <StockTable key="t" size={21} />],
  ];
  // Trên trang chủ: tiêu đề phần nào đã lên quá 55% chiều cao màn hình thì mục đó sáng; chưa tới phần nào thì "Thị trường" sáng
  const [section, setSection] = useState('');
  useEffect(() => {
    if (pathname !== '/') return;
    const update = () => {
      const line = window.innerHeight * 0.55;
      const passed = ['chart-title', 'stocks-title'].filter(
        (id) => (document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) < line,
      );
      setSection(passed.length ? passed[passed.length - 1] : '');
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [pathname]);
  const active = (href: string) =>
    pathname === '/' && (href === '/' ? section === '' : href === `/#${section}`);
  return (
    <aside className="side-rail" aria-label="Lối tắt">
      <Link href="/" className="rail-logo" aria-label="Finsights — Trang chủ">
        <LogoImg size={34} />
      </Link>
      <nav>
        {links.map(([href, label, icon]) => (
          <Link
            key={href}
            href={href}
            className={active(href) ? 'is-active' : ''}
            aria-current={active(href) ? 'location' : undefined}
            aria-label={label}
            title={label}
          >
            {icon}
          </Link>
        ))}
        <span className="rail-soon" title="Thông báo · sắp có" aria-label="Thông báo, sắp có">
          <Bell size={21} />
        </span>
        <span className="rail-soon" title="Cài đặt · sắp có" aria-label="Cài đặt, sắp có">
          <Settings size={21} />
        </span>
      </nav>
      <span
        className="rail-soon rail-theme"
        title="Giao diện sáng · sắp có"
        aria-label="Giao diện sáng, sắp có"
      >
        <Sun size={21} />
      </span>
    </aside>
  );
}
// Các trang dùng giao diện Finsight (header trang chủ, tự có footer riêng hoặc không cần footer)
const isLanding = (pathname: string) => ['', '/tin-tuc', '/chatbot', '/theo-doi', '/bao-cao-tai-chinh', '/dang-nhap'].includes(pathname.replace(/\/$/, '')) || pathname.startsWith('/tin-tuc/');
export function Header() {
  const pathname = usePathname();
  const [search, setSearch] = useState(false),
    [query, setQuery] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const nav = useRef<HTMLElement>(null);
  const { stocks: liveStocks, userEmail, signOut } = useAppData();
  useEffect(() => {
    setSearch(false);
    setQuery('');
  }, [pathname]);
  // Nét cọ vàng dưới nav: đo mục đang mở rồi trượt tới đó bằng transition (lần đo đầu không trượt)
  useEffect(() => {
    const el = nav.current;
    if (!el) return;
    const place = () => {
      const a = el.querySelector<HTMLElement>('a.nav-active');
      if (!a) {
        el.style.setProperty('--brush-o', '0');
        return;
      }
      el.style.setProperty('--brush-x', `${a.offsetLeft}px`);
      el.style.setProperty('--brush-w', `${a.offsetWidth}px`);
      el.style.setProperty('--brush-o', '1');
    };
    place();
    const raf = requestAnimationFrame(() => el.classList.add('is-ready'));
    window.addEventListener('resize', place);
    document.fonts?.ready.then(place);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', place);
    };
  }, [pathname]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearch((v) => !v);
      }
      if (e.key === 'Escape') {
        setSearch(false);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  useEffect(() => {
    if (search) input.current?.focus();
  }, [search]);
  if (pathname.startsWith('/admin')) return null;
  if (pathname.replace(/\/$/, '') === '/chatbot') return null;
  if (isLanding(pathname)) return <HomeHeader />;
  const matches = liveStocks
    .filter((s) =>
      `${s.symbol} ${s.name}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')),
    )
    .slice(0, 6);
  return (
    <>
      <SideRail pathname={pathname} />
      {/* Bộ lọc nét mực gợn dùng chung: CSS gắn bằng filter:url(#ink-rough) cho viền bo tròn ở mọi kích thước */}
      <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
        <filter id="ink-rough" x="-3%" y="-3%" width="106%" height="106%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="14" result="w" />
          <feDisplacementMap in="SourceGraphic" in2="w" scale="3.5" />
        </filter>
      </svg>
      <header className="site-header">
        <div className="header-inner max-[520px]:gap-3 max-[520px]:[&_.brand-name]:hidden max-[520px]:[&_.main-nav]:ml-0 max-[520px]:[&_.main-nav]:gap-3 max-[520px]:[&_.header-actions]:gap-0 max-[520px]:[&_.header-search]:w-10 max-[520px]:[&_.header-search]:min-w-0">
          <Link href="/" aria-label="Finsights — Trang chủ">
            <Brand />
          </Link>
          <nav className="main-nav" aria-label="Chính" ref={nav}>
            {(
              [
                ['/', 'Thị trường'],
                ['/tin-tuc/', 'Tin tức'],
                ['/bao-cao-tai-chinh/', 'Báo cáo'],
                ['/theo-doi/', 'Theo dõi'],
              ] as const
            ).map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className={
                  (href === '/' ? pathname === '/' : pathname.startsWith(href.slice(0, -1)))
                    ? 'nav-active'
                    : ''
                }
                onClick={(e) => {
                  // Nét cọ chạy ngay khi bấm, không đợi route đổi xong
                  const a = e.currentTarget;
                  nav.current?.style.setProperty('--brush-x', `${a.offsetLeft}px`);
                  nav.current?.style.setProperty('--brush-w', `${a.offsetWidth}px`);
                  nav.current?.style.setProperty('--brush-o', '1');
                }}
              >
                {label}
              </Link>
            ))}
            <span className="nav-brush" aria-hidden="true" />
          </nav>
          <div className="header-actions">
            <Link className="demo-badge" href={userEmail ? '/bao-cao-tai-chinh/' : '/dang-nhap/'} aria-label={userEmail ? `Đã đăng nhập ${userEmail}` : 'Đăng nhập bằng Google'}>
              <span />
              {userEmail ? userEmail : 'Đăng nhập'}
            </Link>
            {userEmail && <button type="button" className="text-[10px] text-foreground/60 hover:text-foreground" onClick={signOut}>Thoát</button>}
            <button
              type="button"
              className={`header-search${search ? ' is-selected' : ''}`}
              onClick={() => setSearch((v) => !v)}
              aria-expanded={search}
              aria-controls="global-search"
            >
              <Search size={16} />
              <span>Tìm cổ phiếu…</span>
              <kbd>Ctrl K</kbd>
            </button>
            <span className="avatar" aria-hidden="true">
              {userEmail?.slice(0, 1).toLocaleUpperCase('vi') || 'F'}
            </span>
          </div>
        </div>
      </header>
      {search && (
        <section className="search-drawer" id="global-search" aria-label="Tìm kiếm cổ phiếu">
          <div className="container">
            <label className="global-search-input">
              <Search size={22} />
              <input
                ref={input}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm mã cổ phiếu hoặc tên công ty…"
                aria-label="Mã cổ phiếu hoặc tên công ty"
              />
              <button
                className="icon-button"
                onClick={() => setSearch(false)}
                aria-label="Đóng tìm kiếm"
              >
                <X size={20} />
              </button>
            </label>
            <div className="search-results">
              {matches.length ? (
                matches.map((s) => (
                  <Link key={s.symbol} href={`/?ma=${s.symbol}`} onClick={() => setSearch(false)}>
                    <CompanyMark symbol={s.symbol} />
                    <span>
                      <strong>{s.symbol}</strong>
                      <small>{s.short}</small>
                    </span>
                    <span className="search-result-price">
                      {number(s.price)}
                      <small className={s.change >= 0 ? 'positive' : 'negative'}>
                        {signed(s.change)}%
                      </small>
                    </span>
                    <ArrowUpRight size={16} />
                  </Link>
                ))
              ) : (
                <p className="search-empty">{liveStocks.length ? 'Không tìm thấy cổ phiếu phù hợp.' : 'Đang tải dữ liệu cổ phiếu…'}</p>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
export function CompanyMark({ symbol }: { symbol: string }) {
  const stock = useAppData().stocks.find((s) => s.symbol === symbol);
  return (
    <span
      className={`company-mark mark-${symbol.toLowerCase()}`}
      style={{ '--company-color': stock?.color || '#183e34' } as React.CSSProperties}
      aria-hidden="true"
    >
      {symbol.slice(0, 3)}
    </span>
  );
}
export function WatchButton({ symbol, compact = false }: { symbol: string; compact?: boolean }) {
  const { watch, toggle } = useWatch();
  const saved = watch.includes(symbol);
  return (
    <button
      className={compact ? 'save-button' : `button ${saved ? 'button-saved' : 'button-primary'}`}
      onClick={() => toggle(symbol)}
      aria-pressed={saved}
      aria-label={compact ? `${saved ? 'Bỏ theo dõi' : 'Theo dõi'} ${symbol}` : undefined}
    >
      {saved ? <Check size={compact ? 16 : 17} /> : <Bookmark size={compact ? 16 : 17} />}
      <span className={compact ? 'sr-only' : ''}>{saved ? 'Đang theo dõi' : 'Theo dõi'}</span>
    </button>
  );
}
export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;
  if (isLanding(pathname)) return null;
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-main">
          <Link href="/" aria-label="Finsights">
            <Brand />
          </Link>
          <p>Dữ liệu có nguồn, thời điểm và doanh nghiệp liên quan.</p>
          <Link href="/tin-tuc/">
            Đọc tin doanh nghiệp <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Finsights</span>
          <span>Dữ liệu được thu thập từ các nguồn được ghi rõ trong từng trang.</span>
          <span className="footer-made">
            Được làm để bạn hiểu hơn <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </footer>
  );
}

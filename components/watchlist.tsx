'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Search, X } from '@/components/icons';
import { stocks, number, signed } from '@/lib/data';
import { useWatch } from './shell';
import { homeStyles as ui } from './home-styles';
import { LineIcon } from './home';

const control = 'rounded-xs border border-solid border-foreground/25 bg-transparent px-3 py-2 text-xs text-foreground transition-colors hover:bg-foreground/5 motion-reduce:transition-none';
const activeControl = 'rounded-xs border border-solid border-foreground bg-ink px-3 py-2 text-xs text-primary';
const positive = (value: number) => value < 0 ? 'text-red-800 dark:text-red-300' : value > 0 ? 'text-emerald-800 dark:text-emerald-300' : 'text-foreground/65';

export default function Watchlist() {
  const { watch, toggle } = useWatch();
  const [query, setQuery] = useState('');
  const saved = stocks.filter((s) => watch.includes(s.symbol));
  const matches = stocks
    .filter((s) => `${s.symbol} ${s.name}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')))
    .slice(0, query ? 8 : 6);
  return (
    <div data-home className="bg-ink font-sans text-primary selection:bg-primary selection:text-ink [&_:focus-visible]:outline-primary motion-reduce:[&_*]:transition-none">
      <main>
        <section data-hero-screen className="bg-ink text-primary" aria-labelledby="watch-title">
          <div className={`${ui.wrap} pt-[150px] pb-12 max-[560px]:pt-[120px]`}>
            <p data-hero-intro className={`${ui.eyebrow} mb-5 text-primary/80 max-[560px]:text-[9px] max-[560px]:tracking-[0.19em]`}>DANH SÁCH THEO DÕI</p>
            <h1 id="watch-title" className="max-w-[760px] font-editorial text-[clamp(38px,3.55vw,60px)] leading-[1.15] font-normal tracking-[-0.035em] max-[560px]:text-[clamp(32px,8vw,42px)]">
              <span className="block overflow-hidden py-[0.08em] -my-[0.08em]"><span data-hero-line className="block">Doanh nghiệp bạn quan tâm.</span></span>
            </h1>
            <p data-hero-intro className="mt-6 max-w-[640px] font-editorial text-[17px] leading-[1.65] text-primary/85 max-[560px]:text-[15px]">Lưu những mã cổ phiếu bạn muốn theo dõi, xem nhanh giá, biến động và tin tức liên quan.</p>
            <p data-hero-intro className="mt-10 border-t border-solid border-primary/25 pt-5 text-[11px] text-primary/70">
              {watch.length} mã đang theo dõi <span className="mx-2">·</span> Dữ liệu minh họa
            </p>
          </div>
        </section>

        <section className="relative z-10 bg-background text-foreground" aria-labelledby="watch-list-title">
          <div className={`${ui.wrap} grid gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16`}>
            <div>
              <h2 id="watch-list-title" className={ui.sectionTitle}>Danh sách của bạn</h2>
              <p className="mt-3 text-[13px] text-foreground/65">{saved.length ? `${saved.length} doanh nghiệp bạn đã lưu.` : 'Bạn chưa lưu doanh nghiệp nào.'}</p>
              {saved.length ? (
                <div className="mt-8 overflow-x-auto">
                  <table className="w-full min-w-[620px] border-collapse text-left text-xs tabular-nums">
                    <thead className="border-y border-solid border-foreground/25 text-[10px] tracking-wider text-foreground/65 uppercase">
                      <tr>
                        {['Doanh nghiệp', 'Giá (VND)', 'Thay đổi', 'Khối lượng', '', ''].map((label, position) => (
                          <th key={position} scope="col" className={`px-3 py-4 font-medium ${position > 0 ? 'text-right' : ''}`}>{label || <span className="sr-only">{position === 4 ? 'Tin tức' : 'Bỏ theo dõi'}</span>}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {saved.map((s) => (
                        <tr key={s.symbol} className="border-b border-solid border-foreground/15">
                          <td className="px-3 py-5">
                            <Link href={`/?ma=${s.symbol}`} className="group block">
                              <strong className="block font-medium group-hover:underline group-hover:underline-offset-4">{s.symbol}<span className="ml-2 text-[9px] font-normal text-foreground/55">{s.exchange}</span></strong>
                              <span className="mt-1 block text-[11px] text-foreground/65">{s.short}</span>
                            </Link>
                          </td>
                          <td className="px-3 py-5 text-right font-medium">{number(s.price)}</td>
                          <td className={`px-3 py-5 text-right ${positive(s.change)}`}>{signed(s.change)}%</td>
                          <td className="px-3 py-5 text-right text-foreground/65">{s.volume}</td>
                          <td className="px-3 py-5"><Link className="flex justify-end" href={`/tin-tuc/?ma=${s.symbol}`} aria-label={`Xem tin về ${s.symbol}`}><LineIcon /></Link></td>
                          <td className="px-3 py-5 text-right"><button className={control} onClick={() => toggle(s.symbol)} aria-label={`Bỏ theo dõi ${s.symbol}`}>Bỏ theo dõi</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-8 flex flex-col items-start gap-5 border-t border-solid border-foreground/20 py-10">
                  <Search size={34} strokeWidth={1.2} />
                  <h3 className="font-editorial text-[28px] leading-tight font-normal">Chưa có cổ phiếu theo dõi.</h3>
                  <p className="text-[13px] text-foreground/65">Tìm mã ở khung bên cạnh, hoặc khám phá bảng cổ phiếu trên trang thị trường.</p>
                  <Link href="/#stocks-title" className={`${ui.button} ${ui.primaryButton}`}>Khám phá cổ phiếu <LineIcon /></Link>
                </div>
              )}
            </div>

            <aside className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start" aria-labelledby="watch-add-title">
              <h2 id="watch-add-title" className="text-[10px] tracking-wider text-foreground/65 uppercase">Thêm cổ phiếu</h2>
              <label className="flex items-center gap-3 border-b border-solid border-foreground/40 pb-2.5 transition-colors focus-within:border-foreground">
                <Search size={18} strokeWidth={1.4} className="shrink-0" />
                <input className="w-full min-w-0 border-0 bg-transparent text-xs outline-none placeholder:text-foreground/60" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm mã, tên công ty…" aria-label="Tìm mã để theo dõi" />
                {query && <button className="p-1" onClick={() => setQuery('')} aria-label="Xóa tìm kiếm"><X size={14} /></button>}
              </label>
              <div>
                {matches.map((s) => {
                  const isSaved = watch.includes(s.symbol);
                  return (
                    <div key={s.symbol} className="flex items-center gap-3 border-t border-solid border-foreground/20 py-4">
                      <span className="min-w-0 flex-1">
                        <strong className="block text-[13px] font-medium">{s.symbol}</strong>
                        <small className="block truncate text-[11px] text-foreground/65">{s.short}</small>
                      </span>
                      <button className={isSaved ? activeControl : control} aria-pressed={isSaved} aria-label={`${isSaved ? 'Bỏ theo dõi' : 'Theo dõi'} ${s.symbol}`} onClick={() => toggle(s.symbol)}>{isSaved ? 'Đã lưu' : 'Theo dõi'}</button>
                    </div>
                  );
                })}
                {!matches.length && <p className="border-t border-solid border-foreground/20 py-5 text-xs text-foreground/65">Không tìm thấy mã phù hợp.</p>}
              </div>
              <section className="bg-ink p-8 text-primary">
                <h2 className="font-editorial text-[28px] leading-tight font-normal tracking-[-0.02em]">Đọc tin về doanh nghiệp bạn chọn.</h2>
                <p className="mt-3 mb-6 text-xs leading-6 text-primary/75">Kết nối danh sách theo dõi với các bài viết liên quan.</p>
                <Link href="/tin-tuc/" className={`${ui.button} ${ui.outlineButton}`}>Xem tin tức <LineIcon /></Link>
              </section>
            </aside>
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

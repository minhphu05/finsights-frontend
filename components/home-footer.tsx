'use client';

import Link from 'next/link';
import { Brand, useAppData } from './shell';
import { homeStyles as ui } from './home-styles';

const columns = [
  {
    title: 'Khám phá',
    links: [
      { href: '/tin-tuc/', label: 'Tin tức' },
      { href: '/bao-cao-tai-chinh/', label: 'Báo cáo tài chính' },
      { href: '/chatbot/', label: 'Chatbot' },
    ],
  },
  {
    title: 'Thị trường',
    links: [
      { href: '/#thi-truong', label: 'Tổng quan thị trường' },
      { href: '/#chart-title', label: 'Diễn biến thị trường' },
      { href: '/#stocks-title', label: 'Khám phá cổ phiếu' },
    ],
  },
];

export function HomeFooter({ note }: { note: string }) {
  const { userEmail } = useAppData();
  const account = {
    title: 'Cá nhân',
    links: [
      { href: '/theo-doi/', label: 'Danh sách theo dõi' },
      ...(userEmail ? [] : [{ href: '/dang-nhap/', label: 'Đăng nhập' }]),
    ],
  };

  return (
    <footer className={`${ui.wrap} border-t border-solid border-primary/30 pt-14 pb-8 text-primary max-[560px]:pb-[85px]`}>
      <div className="grid grid-cols-[1.6fr_repeat(3,1fr)] gap-10 max-[850px]:grid-cols-3 max-[560px]:grid-cols-2 max-[560px]:gap-8">
        <div className="max-[850px]:col-span-full">
          <Link href="/" className="inline-block" aria-label="Finsights — Trang chủ"><Brand height={40} /></Link>
          <p className="mt-4 max-w-[38ch] text-xs leading-6 text-primary/75">Tin doanh nghiệp, báo cáo tài chính và dữ liệu thị trường trong một trải nghiệm dễ theo dõi.</p>
        </div>
        {[...columns, account].map(column => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="m-0 text-[11px] font-semibold tracking-wider uppercase">{column.title}</h2>
            <ul className="mt-4 mb-0 flex list-none flex-col gap-3 p-0 text-xs">
              {column.links.map(link => (
                <li key={link.href}><Link className="text-primary/75 hover:text-accent" href={link.href}>{link.label}</Link></li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <p className="mt-12 mb-0 border-t border-solid border-primary/20 pt-6 text-[11px] leading-5 text-primary/70">Nội dung trên Finsights chỉ mang tính tham khảo, không phải khuyến nghị mua bán hay tư vấn đầu tư. Bạn tự chịu trách nhiệm với quyết định của mình.</p>
      <div className="mt-4 flex flex-wrap justify-between gap-x-8 gap-y-2 text-[11px] text-primary/70">
        <span>© 2026 Finsights</span>
        <span>{note}</span>
      </div>
    </footer>
  );
}

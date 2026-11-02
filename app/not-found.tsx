import Link from 'next/link';
import { ArrowRight } from '@/components/icons';
export default function NotFound() {
  return (
    <main className="container not-found">
      <h1>Góc nhìn này chưa có.</h1>
      <p>Trang bạn tìm có thể đã thay đổi. Trở lại thị trường để tiếp tục khám phá.</p>
      <Link className="button button-primary" href="/">
        Về trang chủ
        <ArrowRight size={17} />
      </Link>
    </main>
  );
}

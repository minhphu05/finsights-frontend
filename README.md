# Nếp Finance

Website tài chính tiếng Việt được xây bằng Next.js và React. Hai trang chính: thị trường cổ phiếu Việt Nam và tin doanh nghiệp; có thêm danh sách theo dõi và trang đọc bài viết.

## Chạy trên máy

```powershell
cd D:\demo-finance\nep-finance
npm install
npm run dev
```

Xuất bản tĩnh: `npm run build`. Thư mục kết quả: `out/`.

## Phạm vi

Giá, biểu đồ và bài viết là dữ liệu minh họa, không kết nối nguồn tin hoặc giá trực tiếp. Danh sách theo dõi lưu trong localStorage của trình duyệt. Không có chức năng đặt lệnh, đăng nhập hoặc đồng bộ tài khoản.

Tìm kiếm hỗ trợ mã hoặc tên công ty. Bảng có bộ lọc ngành, sàn, tăng/giảm và sắp xếp theo doanh nghiệp, giá hoặc thay đổi. Tin tức lọc theo chủ đề và mã liên quan.

## Tài nguyên

- Font: Be Vietnam Pro và Lora, tải từ Google Fonts, phục vụ cục bộ.
- Icon: Lucide.
- Ảnh minh họa kiến trúc/văn phòng: Unsplash. URL nguồn được nhúng trong metadata từng ảnh tại `public/images/` và liệt kê trong `scripts/fetch-assets.py`.
- Biểu tượng doanh nghiệp trong demo được thể hiện bằng chữ/biểu tượng giản lược, không phải bộ logo chính thức.

## Kiểm tra

Build bao gồm kiểm tra TypeScript. `scripts/verify.mjs` dùng playwright-core và Chrome có sẵn trên Windows để kiểm tra luồng thao tác cùng giao diện đáp ứng; máy chủ tĩnh cần chạy tại `127.0.0.1:57610`. Ảnh QA lưu ở `../.impeccable/review/`.

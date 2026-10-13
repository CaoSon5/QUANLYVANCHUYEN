# SpreeExpress – Hệ thống quản lý vận chuyển

- **Frontend:** React (Vite) – thư mục `frontend`, chạy ở cổng **5173**
- **Backend:** ASP.NET Core Web API (.NET 10) – `backend/SpreeExpress.Api`, chạy ở cổng **5000**
- **Database:** PostgreSQL chạy bằng Docker, cổng 5432

> Đừng đổi cổng: backend là 5000, frontend là 5173. Nếu hai thứ cùng một cổng sẽ không chạy được.

## Cài đặt lần đầu (làm đúng thứ tự)

1. Mở **Docker Desktop**, đợi chạy xong.
2. Mở thư mục `spreeexpress` này bằng VSCode (File → Open Folder). Phải thấy `backend`, `frontend`, `docker-compose.yml` ở lớp đầu.
3. Mở terminal ở **thư mục gốc**, chạy:
   ```powershell
   docker compose up -d
   ```
4. Tạo cấu trúc database (chỉ làm 1 lần):
   ```powershell
   dotnet tool install --global dotnet-ef
   cd backend\SpreeExpress.Api
   dotnet restore
   dotnet ef migrations add InitialCreate
   cd ..\..
   ```
5. Cài thư viện frontend:
   ```powershell
   cd frontend
   npm install
   cd ..
   ```

## Chạy hằng ngày

- **Cách 1: bấm F5** trong VSCode. Tự bật database, frontend, backend rồi mở trình duyệt.
- **Cách 2: hai terminal**
  - Terminal 1: `cd backend\SpreeExpress.Api` rồi `dotnet run`
  - Terminal 2: `cd frontend` rồi `npm run dev`

Mở http://localhost:5173. Lần đầu chưa có tài khoản nào nên web tự chuyển sang trang **Thiết lập hệ thống** để tạo Admin.

Kiểm tra backend: http://localhost:5000/api/health

## Khi sửa Entity (thêm bảng, thêm cột)

```powershell
cd backend\SpreeExpress.Api
dotnet ef migrations add TenThayDoi
```
Rồi chạy lại backend, nó tự cập nhật database.

## Làm lại database từ đầu (xóa hết dữ liệu test)

1. Tắt backend và frontend.
2. Xóa thư mục `backend\SpreeExpress.Api\Migrations`.
3. Ở thư mục gốc: `docker compose down -v` rồi `docker compose up -d`.
4. Làm lại bước 4 ở trên (`dotnet ef migrations add InitialCreate`).

## Tài khoản

- Lần đầu: tạo **Admin** ở trang `/setup` (chỉ có một Admin).
- Người bán: tự đăng ký ở `/register`.
- Nhân viên, shipper, tài xế, kế toán, điều phối: Admin tạo ở **Tài khoản & phân quyền**, người dùng đổi mật khẩu ở lần đăng nhập đầu.

## Đã làm

| Phần | Nội dung |
|---|---|
| Đăng nhập | Email/số điện thoại + mật khẩu, tự vào đúng giao diện theo vai trò |
| Admin | Thiết lập lần đầu, quản lý tài khoản (thêm, sửa, khóa, đặt lại mật khẩu), quản lý kho (thêm, sửa, ngừng, gán nhân viên kho và shipper) |
| Người bán | Tạo, sửa, hủy yêu cầu lấy hàng, danh sách đơn, tra cứu hành trình |
| Shipper | Xem đơn chờ lấy tại kho mình, nhận đơn, xác nhận đã lấy hàng |

Các màn hình khác hiện là trang khung, sẽ làm dần.

## Cấu trúc

```
backend/SpreeExpress.Api/
  Controllers/  Services/  Repositories/  Entities/  DTOs/  Data/  Helpers/  Middlewares/
frontend/src/
  config/roles.js        Menu và vai trò
  pages/                 Từng màn hình (Login, Accounts, Warehouses, Orders, Pickups...)
  pages/pageRegistry.js  Màn hình nào đã làm xong chức năng thật
  api/                   Gọi backend
```

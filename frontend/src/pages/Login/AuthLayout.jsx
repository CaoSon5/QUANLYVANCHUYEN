// Đặt vào: D:\spreeexpress\frontend\src\pages\Login\
import { Truck } from 'lucide-react';
import './login.css';

// Khung 2 cột dùng chung cho trang Đăng nhập và Đăng ký
export default function AuthLayout({ children }) {
  return (
    <div className="login-page">
      <section className="login-left">
        <div className="login-brand">
          <div className="logo-box white"><Truck size={22} /></div>
          <span>SPREE EXPRESS</span>
        </div>

        <div>
          <h1>Một nền tảng.<br />Mọi hoạt động vận chuyển.</h1>
          <p>Quản lý đơn hàng, điều phối shipper, theo dõi hành trình, vận hành kho và đối soát COD trên cùng một hệ thống.</p>
        </div>

        <footer>© {new Date().getFullYear()} Spree Express · Hệ thống quản lý vận chuyển</footer>
      </section>

      <section className="login-right">{children}</section>
    </div>
  );
}

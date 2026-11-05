// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Tracking\
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Search, Truck } from 'lucide-react';
import { trackingApi } from '../../api/trackingApi';
import { getErrorMessage } from '../../api/authApi';
import { formatDateTime, formatVnd } from '../../utils/format';
import './tracking.css';

const PHONE_PATTERN = /^(\+?84|0)\d{9}$/;
const stripSeparators = (value) => value.replace(/[\s.\-()]/g, '');
const looksLikePhone = (value) => PHONE_PATTERN.test(stripSeparators(value));

const GOOD = ['delivered'];
const BAD = ['delivery_failed', 'returning', 'returned', 'cancelled'];
const tone = (status) => (GOOD.includes(status) ? 'good' : BAD.includes(status) ? 'bad' : 'progress');

// Trang công khai cho khách nhận hàng: tra cứu hành trình bằng mã vận đơn hoặc số điện thoại (FR69).
// Không cần đăng nhập. Tên và số điện thoại được che một phần, không hiện địa chỉ chi tiết.
export default function PublicTrackingPage() {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const phoneParam = searchParams.get('phone');

  const [input, setInput] = useState(code ?? phoneParam ?? '');
  const [detail, setDetail] = useState(null);
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Mỗi lần địa chỉ trang đổi (mã mới hoặc số điện thoại mới) thì tra cứu lại
  useEffect(() => {
    setDetail(null);
    setList(null);
    setError('');
    setCopied(false);
    if (!code && !phoneParam) return undefined;

    let cancelled = false;
    setLoading(true);
    const request = code ? trackingApi.byCode(code) : trackingApi.byPhone(phoneParam);
    request
      .then((data) => {
        if (cancelled) return;
        if (code) setDetail(data);
        else setList(data);
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [code, phoneParam]);

  const submit = (e) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    if (looksLikePhone(q)) navigate(`/tra-cuu?phone=${encodeURIComponent(stripSeparators(q))}`);
    else navigate(`/tra-cuu/${encodeURIComponent(q.replace(/\s/g, '').toUpperCase())}`);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="trk-page">
      <header className="trk-top">
        <Link to="/login" className="trk-brand">
          <span className="trk-logo"><Truck size={20} /></span>
          <span>SPREE EXPRESS</span>
        </Link>
        <Link to="/login" className="trk-login">Đăng nhập</Link>
      </header>

      <main className="trk-main">
        <section className="trk-hero">
          <h1>Tra cứu đơn hàng</h1>
          <p>Nhập mã vận đơn hoặc số điện thoại người nhận để xem hành trình giao hàng.</p>
          <form className="trk-form" onSubmit={submit}>
            <Search size={20} />
            <input
              placeholder="Ví dụ: SPR26110400001 hoặc 0912345678"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus={!code && !phoneParam}
              aria-label="Mã vận đơn hoặc số điện thoại"
            />
            <button className="btn btn-primary" type="submit" disabled={loading}>Tra cứu</button>
          </form>
        </section>

        {loading && <div className="trk-card trk-muted">Đang tra cứu...</div>}
        {error && <div className="trk-card trk-error">{error}</div>}

        {list && (
          <div className="trk-card">
            <h2>Đơn gửi đến số điện thoại này</h2>
            {list.length === 0 ? (
              <p className="trk-muted" style={{ margin: 0 }}>Không tìm thấy đơn hàng nào gửi đến số điện thoại này.</p>
            ) : (
              <>
                <ul className="trk-list">
                  {list.map((o) => (
                    <li key={o.code}>
                      <Link to={`/tra-cuu/${o.code}`}>
                        <b className="trk-code" style={{ fontSize: 17 }}>{o.code}</b>
                        <span><span className={`trk-badge trk-${tone(o.status)}`} style={{ fontSize: 13, padding: '4px 10px' }}>{o.statusText}</span></span>
                        <small>Từ {o.senderName} · cập nhật {formatDateTime(o.updatedAt)}</small>
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="trk-muted" style={{ margin: '14px 0 0' }}>Hiển thị tối đa 10 đơn gần nhất. Bấm vào một đơn để xem hành trình.</p>
              </>
            )}
          </div>
        )}

        {detail && (
          <>
            <div className="trk-card">
              <div className="trk-code-row">
                <div>
                  <div className="trk-label">Mã vận đơn</div>
                  <div className="trk-code">{detail.code}</div>
                </div>
                <span className={`trk-badge trk-${tone(detail.status)}`}>{detail.statusText}</span>
              </div>

              <div className="trk-grid">
                <div><div className="trk-label">Người gửi</div><b>{detail.senderName || '—'}</b></div>
                <div><div className="trk-label">Người nhận</div><b>{detail.receiverName}</b></div>
                <div><div className="trk-label">Số điện thoại người nhận</div><b>{detail.receiverPhone}</b></div>
                <div><div className="trk-label">Khu vực giao</div><b>{detail.receiverArea}</b></div>
                <div><div className="trk-label">Tạo đơn lúc</div><b>{formatDateTime(detail.createdAt)}</b></div>
                <div><div className="trk-label">Cập nhật gần nhất</div><b>{formatDateTime(detail.updatedAt)}</b></div>
              </div>

              {detail.currentLocation && (
                <div className="trk-note" style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af' }}>
                  Hàng hiện đang ở <b>{detail.currentLocation}</b>.
                </div>
              )}
              {!detail.isFinal && detail.codAmount > 0 && (
                <div className="trk-note">
                  Đơn có thu hộ tiền (COD). Vui lòng chuẩn bị <b>{formatVnd(detail.codAmount)}</b> để thanh toán cho shipper khi nhận hàng.
                </div>
              )}
              {!detail.isFinal && detail.failedAttempts > 0 && (
                <div className="trk-note">
                  Đơn đã giao chưa thành công {detail.failedAttempts} lần. Vui lòng giữ máy để shipper liên hệ ở lần giao tiếp theo.
                </div>
              )}

              <div className="trk-actions">
                <button className="btn" onClick={copyLink}>{copied ? 'Đã sao chép liên kết' : 'Sao chép liên kết'}</button>
              </div>
            </div>

            <div className="trk-card">
              <h2>Hành trình đơn hàng</h2>
              <ol className="trk-timeline">
                {[...detail.events].reverse().map((e, i) => (
                  <li key={`${e.status}-${e.at}`} className={i === 0 ? 'now' : ''}>
                    <span className="trk-dot" />
                    <div>
                      <b>{e.text}</b>
                      <small>{formatDateTime(e.at)}</small>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}

        <p className="trk-privacy">
          Để bảo vệ thông tin cá nhân, tên và số điện thoại được che một phần, địa chỉ chi tiết không hiển thị.<br />
          Cần thay đổi hoặc hỗ trợ thêm? Vui lòng liên hệ người gửi hàng.
        </p>
      </main>
    </div>
  );
}

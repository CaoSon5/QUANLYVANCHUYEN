// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\components\common\
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';
import './rowMenu.css';

/*
 * Nút "⋯" mở menu thao tác của một dòng trong bảng.
 * items: [{ label, onClick, danger?, success?, disabled?, title?, hidden? }]
 * Menu được vẽ ra ngoài bảng (portal) nên không bị vùng cuộn của bảng cắt mất.
 */
export default function RowMenu({ items }) {
  const [pos, setPos] = useState(null); // { right, top } hoặc { right, bottom }
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const visible = items.filter((i) => !i.hidden);
  const close = () => setPos(null);

  const toggle = () => {
    if (pos) return close();
    const r = btnRef.current.getBoundingClientRect();
    const menuHeight = visible.length * 40 + 16;
    const openUp = window.innerHeight - r.bottom < menuHeight + 8 && r.top > menuHeight + 8;
    const right = window.innerWidth - r.right;
    setPos(openUp ? { right, bottom: window.innerHeight - r.top + 6 } : { right, top: r.bottom + 6 });
  };

  useEffect(() => {
    if (!pos) return undefined;
    const onDown = (e) => {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      close();
    };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [pos]);

  if (visible.length === 0) return null;

  return (
    <>
      <button
        ref={btnRef} type="button" className="act-btn rm-btn" aria-label="Thao tác khác"
        aria-haspopup="menu" aria-expanded={!!pos} onClick={toggle}
      >
        <MoreHorizontal size={16} />
      </button>
      {pos && createPortal(
        <div ref={menuRef} className="rm-menu" role="menu" style={pos}>
          {visible.map((i) => (
            <button
              key={i.label} type="button" role="menuitem" disabled={i.disabled} title={i.title}
              className={`rm-item${i.danger ? ' danger' : ''}${i.success ? ' success' : ''}`}
              onClick={() => { close(); i.onClick(); }}
            >
              {i.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}

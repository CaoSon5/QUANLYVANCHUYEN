import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';

// Trang khung cho mọi mục menu chưa làm. Khi làm chức năng thật, tạo trang riêng rồi thay trong RolePage.jsx
export default function GenericPage({ item }) {
  const page = item.page ?? { title: item.label, subtitle: 'Chức năng đang được xây dựng.' };
  const stats = page.stats ?? [];

  return (
    <>
      <PageHeader title={page.title} subtitle={page.subtitle} action={page.action} />

      {stats.length > 0 && (
        <div className={`grid grid-${stats.length} section`}>
          {stats.map((label, i) => (
            <StatCard key={label} index={i} label={label} showTrend={false} />
          ))}
        </div>
      )}

      <div className="card section">
        <div className="card-title">Hoạt động gần đây</div>
        <div className="card-sub">Dữ liệu được cập nhật theo thời gian thực</div>
        <div className="placeholder">Khu vực nội dung (sẽ làm sau)</div>
      </div>
    </>
  );
}

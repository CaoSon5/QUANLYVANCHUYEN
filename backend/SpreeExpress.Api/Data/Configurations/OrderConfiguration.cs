// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Data\Configurations\
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SpreeExpress.Api.Entities;

namespace SpreeExpress.Api.Data.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> b)
    {
        b.ToTable("orders");
        b.HasKey(x => x.Id);

        b.Property(x => x.Code).IsRequired().HasMaxLength(30);

        // Status là "concurrency token": nếu 2 người cùng đổi trạng thái một đơn (ví dụ 2 shipper cùng nhận)
        // thì người đến sau bị từ chối thay vì ghi đè.
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(30).IsConcurrencyToken();

        b.Property(x => x.SenderName).IsRequired().HasMaxLength(100);
        b.Property(x => x.SenderPhone).IsRequired().HasMaxLength(20);
        b.Property(x => x.SenderAddress).IsRequired().HasMaxLength(300);
        b.Property(x => x.ReceiverName).IsRequired().HasMaxLength(100);
        b.Property(x => x.ReceiverPhone).IsRequired().HasMaxLength(20);
        b.Property(x => x.ReceiverAddress).IsRequired().HasMaxLength(300);
        b.Property(x => x.ReceiverDistrict).IsRequired().HasMaxLength(100);
        b.Property(x => x.ReceiverProvince).IsRequired().HasMaxLength(100);
        b.Property(x => x.ItemDescription).IsRequired().HasMaxLength(200);
        b.Property(x => x.Note).HasMaxLength(500);
        b.Property(x => x.PickupNote).HasMaxLength(500);
        b.Property(x => x.CancelReason).HasMaxLength(500);

        b.Property(x => x.WeightKg).HasPrecision(10, 2);
        b.Property(x => x.DeclaredValue).HasPrecision(18, 2);
        b.Property(x => x.CodAmount).HasPrecision(18, 2);
        b.Property(x => x.ShippingFee).HasPrecision(18, 2);

        b.HasIndex(x => x.Code).IsUnique();
        b.HasIndex(x => x.SellerId);
        b.HasIndex(x => new { x.PickupWarehouseId, x.Status });
        b.HasIndex(x => x.PickupShipperId);
        b.HasIndex(x => new { x.CurrentWarehouseId, x.Status });

        b.HasOne(x => x.Seller).WithMany().HasForeignKey(x => x.SellerId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.PickupWarehouse).WithMany().HasForeignKey(x => x.PickupWarehouseId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.PickupShipper).WithMany().HasForeignKey(x => x.PickupShipperId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.CurrentWarehouse).WithMany().HasForeignKey(x => x.CurrentWarehouseId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class OrderStatusHistoryConfiguration : IEntityTypeConfiguration<OrderStatusHistory>
{
    public void Configure(EntityTypeBuilder<OrderStatusHistory> b)
    {
        b.ToTable("order_status_history");
        b.HasKey(x => x.Id);

        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
        b.Property(x => x.Note).HasMaxLength(600);

        b.HasIndex(x => x.OrderId);

        b.HasOne(x => x.Order).WithMany(x => x.History).HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.ActorUser).WithMany().HasForeignKey(x => x.ActorUserId).OnDelete(DeleteBehavior.SetNull);
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SpreeExpress.Api.Entities;

namespace SpreeExpress.Api.Data.Configurations;

public class WarehouseConfiguration : IEntityTypeConfiguration<Warehouse>
{
    public void Configure(EntityTypeBuilder<Warehouse> b)
    {
        b.ToTable("warehouses");
        b.HasKey(x => x.Id);

        b.Property(x => x.Code).IsRequired().HasMaxLength(20);
        b.Property(x => x.Name).IsRequired().HasMaxLength(150);
        b.Property(x => x.Address).IsRequired().HasMaxLength(300);
        b.Property(x => x.Type).HasConversion<string>().HasMaxLength(20);

        // Mã kho không được trùng
        b.HasIndex(x => x.Code).IsUnique();

        // Kho địa phương -> kho vùng quản lý (không cho xóa dây chuyền)
        b.HasOne(x => x.Parent)
            .WithMany(x => x.Children)
            .HasForeignKey(x => x.ParentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Nhân viên kho / shipper -> kho được gán
        b.HasMany(x => x.Members)
            .WithOne(x => x.Warehouse)
            .HasForeignKey(x => x.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

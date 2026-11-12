// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Data\Configurations\
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SpreeExpress.Api.Entities;

namespace SpreeExpress.Api.Data.Configurations;

public class BundleConfiguration : IEntityTypeConfiguration<Bundle>
{
    public void Configure(EntityTypeBuilder<Bundle> b)
    {
        b.ToTable("bundles");
        b.HasKey(x => x.Id);

        b.Property(x => x.Code).IsRequired().HasMaxLength(30);
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        b.Property(x => x.TotalWeightKg).HasPrecision(12, 2);
        b.Property(x => x.Note).HasMaxLength(500);

        b.HasIndex(x => x.Code).IsUnique();
        b.HasIndex(x => new { x.CurrentWarehouseId, x.Status });
        b.HasIndex(x => x.DestinationWarehouseId);

        b.HasOne(x => x.Origin).WithMany().HasForeignKey(x => x.OriginWarehouseId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Current).WithMany().HasForeignKey(x => x.CurrentWarehouseId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Destination).WithMany().HasForeignKey(x => x.DestinationWarehouseId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.CreatedBy).WithMany().HasForeignKey(x => x.CreatedById).OnDelete(DeleteBehavior.Restrict);

        b.HasMany(x => x.Orders).WithOne(x => x.Bundle).HasForeignKey(x => x.BundleId).OnDelete(DeleteBehavior.Restrict);
    }
}

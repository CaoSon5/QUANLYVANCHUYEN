// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Data\Configurations\
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SpreeExpress.Api.Entities;

namespace SpreeExpress.Api.Data.Configurations;

public class TripConfiguration : IEntityTypeConfiguration<Trip>
{
    public void Configure(EntityTypeBuilder<Trip> b)
    {
        b.ToTable("trips");
        b.HasKey(x => x.Id);

        b.Property(x => x.Code).IsRequired().HasMaxLength(30);
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        b.Property(x => x.VehiclePlate).IsRequired().HasMaxLength(20);
        b.Property(x => x.CapacityKg).HasPrecision(12, 2);
        b.Property(x => x.Note).HasMaxLength(500);

        b.HasIndex(x => x.Code).IsUnique();
        b.HasIndex(x => new { x.DriverId, x.Status });
        b.HasIndex(x => x.Status);

        b.HasOne(x => x.Driver).WithMany().HasForeignKey(x => x.DriverId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Pickup).WithMany().HasForeignKey(x => x.PickupWarehouseId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Current).WithMany().HasForeignKey(x => x.CurrentWarehouseId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Next).WithMany().HasForeignKey(x => x.NextWarehouseId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.CreatedBy).WithMany().HasForeignKey(x => x.CreatedById).OnDelete(DeleteBehavior.Restrict);

        b.HasMany(x => x.Bundles).WithOne(x => x.Trip).HasForeignKey(x => x.TripId).OnDelete(DeleteBehavior.Restrict);
        b.HasMany(x => x.Stops).WithOne(x => x.Trip).HasForeignKey(x => x.TripId).OnDelete(DeleteBehavior.Cascade);
        b.HasMany(x => x.Discrepancies).WithOne(x => x.Trip).HasForeignKey(x => x.TripId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class TripStopConfiguration : IEntityTypeConfiguration<TripStop>
{
    public void Configure(EntityTypeBuilder<TripStop> b)
    {
        b.ToTable("trip_stops");
        b.HasKey(x => x.Id);
        b.HasIndex(x => new { x.TripId, x.Seq }).IsUnique();
        b.HasOne(x => x.Warehouse).WithMany().HasForeignKey(x => x.WarehouseId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class TripDiscrepancyConfiguration : IEntityTypeConfiguration<TripDiscrepancy>
{
    public void Configure(EntityTypeBuilder<TripDiscrepancy> b)
    {
        b.ToTable("trip_discrepancies");
        b.HasKey(x => x.Id);

        b.Property(x => x.Type).HasConversion<string>().HasMaxLength(20);
        b.Property(x => x.BundleCode).IsRequired().HasMaxLength(30);
        b.Property(x => x.Note).HasMaxLength(500);

        b.HasIndex(x => x.TripId);
        b.HasOne(x => x.Warehouse).WithMany().HasForeignKey(x => x.WarehouseId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.ReportedBy).WithMany().HasForeignKey(x => x.ReportedById).OnDelete(DeleteBehavior.Restrict);
    }
}

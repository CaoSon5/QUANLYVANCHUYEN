// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Data\Configurations\
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SpreeExpress.Api.Entities;

namespace SpreeExpress.Api.Data.Configurations;

public class CodRemittanceConfiguration : IEntityTypeConfiguration<CodRemittance>
{
    public void Configure(EntityTypeBuilder<CodRemittance> b)
    {
        b.ToTable("cod_remittances");
        b.HasKey(x => x.Id);

        b.Property(x => x.Code).IsRequired().HasMaxLength(30);
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        b.Property(x => x.TotalAmount).HasPrecision(18, 2);
        b.Property(x => x.ReceivedAmount).HasPrecision(18, 2);
        b.Property(x => x.ConfirmNote).HasMaxLength(500);

        b.HasIndex(x => x.Code).IsUnique();
        b.HasIndex(x => new { x.Status, x.CreatedAt });
        b.HasIndex(x => x.ShipperId);

        b.HasOne(x => x.Shipper).WithMany().HasForeignKey(x => x.ShipperId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.ConfirmedBy).WithMany().HasForeignKey(x => x.ConfirmedById).OnDelete(DeleteBehavior.SetNull);

        b.HasMany(x => x.Orders).WithOne(x => x.CodRemittance).HasForeignKey(x => x.CodRemittanceId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class SettlementConfiguration : IEntityTypeConfiguration<Settlement>
{
    public void Configure(EntityTypeBuilder<Settlement> b)
    {
        b.ToTable("settlements");
        b.HasKey(x => x.Id);

        b.Property(x => x.Code).IsRequired().HasMaxLength(30);
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        b.Property(x => x.GrossCod).HasPrecision(18, 2);
        b.Property(x => x.TotalShippingFee).HasPrecision(18, 2);
        b.Property(x => x.TotalAdjustments).HasPrecision(18, 2);
        b.Property(x => x.NetAmount).HasPrecision(18, 2);
        b.Property(x => x.Note).HasMaxLength(500);
        b.Property(x => x.PaymentRef).HasMaxLength(100);

        b.HasIndex(x => x.Code).IsUnique();
        b.HasIndex(x => new { x.SellerId, x.CreatedAt });
        b.HasIndex(x => x.Status);

        b.HasOne(x => x.Seller).WithMany().HasForeignKey(x => x.SellerId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.CreatedBy).WithMany().HasForeignKey(x => x.CreatedById).OnDelete(DeleteBehavior.SetNull);
        b.HasOne(x => x.PaidBy).WithMany().HasForeignKey(x => x.PaidById).OnDelete(DeleteBehavior.SetNull);

        b.HasMany(x => x.Orders).WithOne(x => x.Settlement).HasForeignKey(x => x.SettlementId).OnDelete(DeleteBehavior.Restrict);
        b.HasMany(x => x.Adjustments).WithOne(x => x.Settlement).HasForeignKey(x => x.SettlementId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class SettlementAdjustmentConfiguration : IEntityTypeConfiguration<SettlementAdjustment>
{
    public void Configure(EntityTypeBuilder<SettlementAdjustment> b)
    {
        b.ToTable("settlement_adjustments");
        b.HasKey(x => x.Id);

        b.Property(x => x.Description).IsRequired().HasMaxLength(200);
        b.Property(x => x.Amount).HasPrecision(18, 2);
    }
}

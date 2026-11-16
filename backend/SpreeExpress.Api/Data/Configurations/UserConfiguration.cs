// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Data\Configurations\
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SpreeExpress.Api.Entities;

namespace SpreeExpress.Api.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> b)
    {
        b.ToTable("users");
        b.HasKey(x => x.Id);

        b.Property(x => x.FullName).IsRequired().HasMaxLength(100);
        b.Property(x => x.Email).IsRequired().HasMaxLength(150);
        b.Property(x => x.Phone).IsRequired().HasMaxLength(20);
        b.Property(x => x.PasswordHash).IsRequired().HasMaxLength(100);
        b.Property(x => x.Role).HasConversion<string>().HasMaxLength(20);
        b.Property(x => x.VehiclePlate).HasMaxLength(20);
        b.Property(x => x.VehicleCapacityKg).HasPrecision(12, 2);

        // Email và số điện thoại không được trùng
        b.HasIndex(x => x.Email).IsUnique();
        b.HasIndex(x => x.Phone).IsUnique();
    }
}

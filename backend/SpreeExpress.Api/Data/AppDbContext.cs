// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Data\
using Microsoft.EntityFrameworkCore;
using SpreeExpress.Api.Entities;

namespace SpreeExpress.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Warehouse> Warehouses => Set<Warehouse>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderStatusHistory> OrderStatusHistory => Set<OrderStatusHistory>();
    public DbSet<OrderPhoto> OrderPhotos => Set<OrderPhoto>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Tự nạp mọi cấu hình trong thư mục Data/Configurations
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Bộ đếm sinh mã vận đơn: không bao giờ trùng dù nhiều người tạo đơn cùng lúc
        modelBuilder.HasSequence<long>("order_code_seq");
    }
}

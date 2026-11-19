// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Repositories\Implementations\
using Microsoft.EntityFrameworkCore;
using SpreeExpress.Api.Data;
using SpreeExpress.Api.Entities;
using SpreeExpress.Api.Helpers;
using SpreeExpress.Api.Repositories.Interfaces;

namespace SpreeExpress.Api.Repositories.Implementations;

public class FinanceRepository : IFinanceRepository
{
    private readonly AppDbContext _db;

    public FinanceRepository(AppDbContext db) => _db = db;

    public Task<long> NextRemittanceNumberAsync() =>
        _db.Database.SqlQuery<long>($"SELECT nextval('remittance_code_seq') AS \"Value\"").FirstAsync();

    public Task<long> NextSettlementNumberAsync() =>
        _db.Database.SqlQuery<long>($"SELECT nextval('settlement_code_seq') AS \"Value\"").FirstAsync();

    // ================= Shipper nộp COD =================

    public Task<List<Order>> GetHeldOrdersAsync(Guid shipperId) =>
        _db.Orders.AsNoTracking()
            .Where(o => o.DeliveryShipperId == shipperId
                        && o.Status == OrderStatus.Delivered
                        && (o.CodCollected ?? 0) > 0
                        && o.CodRemittanceId == null)
            .OrderBy(o => o.DeliveredAt)
            .ToListAsync();

    public async Task<List<Order>> GetTrackedHeldOrdersAsync(Guid shipperId, List<Guid>? orderIds)
    {
        IQueryable<Order> query = _db.Orders
            .Where(o => o.DeliveryShipperId == shipperId
                        && o.Status == OrderStatus.Delivered
                        && (o.CodCollected ?? 0) > 0
                        && o.CodRemittanceId == null);

        if (orderIds is { Count: > 0 })
        {
            var ids = orderIds.Distinct().ToList();
            query = query.Where(o => ids.Contains(o.Id));
        }

        return await query.OrderBy(o => o.DeliveredAt).ToListAsync();
    }

    public async Task<List<ShipperHolding>> GetHoldingsPerShipperAsync()
    {
        var groups = await _db.Orders.AsNoTracking()
            .Where(o => o.Status == OrderStatus.Delivered
                        && (o.CodCollected ?? 0) > 0
                        && o.CodRemittanceId == null
                        && o.DeliveryShipperId != null)
            .GroupBy(o => o.DeliveryShipperId)
            .Select(g => new
            {
                ShipperId = g.Key,
                Count = g.Count(),
                Amount = g.Sum(o => o.CodCollected ?? 0),
                Oldest = g.Min(o => o.DeliveredAt),
            })
            .ToListAsync();

        var ids = groups.Where(g => g.ShipperId.HasValue).Select(g => g.ShipperId!.Value).ToList();
        var users = await _db.Users.AsNoTracking().Where(u => ids.Contains(u.Id)).ToListAsync();

        // Kho của từng shipper, kèm kho vùng quản lý
        var warehouseIds = users.Where(u => u.WarehouseId.HasValue).Select(u => u.WarehouseId!.Value).Distinct().ToList();
        var warehouses = await _db.Warehouses.AsNoTracking()
            .Include(w => w.Parent)
            .Where(w => warehouseIds.Contains(w.Id))
            .ToListAsync();

        return groups
            .Where(g => g.ShipperId.HasValue)
            .Select(g =>
            {
                var user = users.FirstOrDefault(u => u.Id == g.ShipperId!.Value);
                var warehouse = user?.WarehouseId is { } wid ? warehouses.FirstOrDefault(w => w.Id == wid) : null;
                return new ShipperHolding
                {
                    ShipperId = g.ShipperId!.Value,
                    ShipperName = user?.FullName ?? "—",
                    ShipperPhone = user?.Phone ?? "",
                    OrderCount = g.Count,
                    Amount = g.Amount,
                    OldestDeliveredAt = g.Oldest,
                    WarehouseId = warehouse?.Id,
                    WarehouseCode = warehouse?.Code,
                    WarehouseName = warehouse?.Name,
                    RegionCode = warehouse?.Parent?.Code,
                };
            })
            .OrderByDescending(h => h.Amount)
            .ToList();
    }

    public void AddRemittance(CodRemittance remittance) => _db.CodRemittances.Add(remittance);

    public Task<CodRemittance?> GetRemittanceTrackedAsync(Guid id) =>
        _db.CodRemittances.Include(r => r.Shipper).FirstOrDefaultAsync(r => r.Id == id);

    public Task<CodRemittance?> GetRemittanceDetailAsync(Guid id) =>
        _db.CodRemittances.AsNoTracking()
            .Include(r => r.Shipper)
            .Include(r => r.ConfirmedBy)
            .Include(r => r.Orders)
            .FirstOrDefaultAsync(r => r.Id == id);

    public async Task<(List<CodRemittance> Items, int Total)> SearchRemittancesAsync(
        Guid? shipperId, RemittanceStatus? status, int page, int pageSize)
    {
        IQueryable<CodRemittance> query = _db.CodRemittances.AsNoTracking()
            .Include(r => r.Shipper)
            .Include(r => r.ConfirmedBy);

        if (shipperId.HasValue)
        {
            var id = shipperId.Value;
            query = query.Where(r => r.ShipperId == id);
        }

        if (status.HasValue)
        {
            var st = status.Value;
            query = query.Where(r => r.Status == st);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, total);
    }

    // ================= Đối soát người bán =================

    // Đơn đủ điều kiện đối soát: đã giao trong kỳ, chưa đối soát, và tiền đã về tay công ty
    // (đơn không thu COD, hoặc COD đã được kế toán xác nhận nhận từ shipper)
    public Task<List<Order>> GetEligibleOrdersAsync(Guid sellerId, DateTime fromUtc, DateTime toUtc, bool tracked)
    {
        IQueryable<Order> query = _db.Orders
            .Where(o => o.SellerId == sellerId
                        && o.Status == OrderStatus.Delivered
                        && o.SettlementId == null
                        && o.DeliveredAt >= fromUtc
                        && o.DeliveredAt < toUtc
                        && ((o.CodCollected ?? 0) == 0
                            || (o.CodRemittance != null && o.CodRemittance.Status == RemittanceStatus.Confirmed)));

        if (!tracked) query = query.AsNoTracking();

        return query.OrderBy(o => o.DeliveredAt).ToListAsync();
    }

    public async Task<(int Count, decimal Amount)> GetExcludedOrdersAsync(Guid sellerId, DateTime fromUtc, DateTime toUtc)
    {
        var query = _db.Orders.AsNoTracking()
            .Where(o => o.SellerId == sellerId
                        && o.Status == OrderStatus.Delivered
                        && o.SettlementId == null
                        && o.DeliveredAt >= fromUtc
                        && o.DeliveredAt < toUtc
                        && (o.CodCollected ?? 0) > 0
                        && (o.CodRemittance == null || o.CodRemittance.Status != RemittanceStatus.Confirmed));

        return (await query.CountAsync(), await query.SumAsync(o => o.CodCollected ?? 0));
    }

    public void AddSettlement(Settlement settlement) => _db.Settlements.Add(settlement);

    public Task<Settlement?> GetSettlementTrackedAsync(Guid id) =>
        _db.Settlements.Include(s => s.Seller).FirstOrDefaultAsync(s => s.Id == id);

    public Task<Settlement?> GetSettlementDetailAsync(Guid id) =>
        _db.Settlements.AsNoTracking()
            .Include(s => s.Seller)
            .Include(s => s.CreatedBy)
            .Include(s => s.PaidBy)
            .Include(s => s.Orders)
            .Include(s => s.Adjustments)
            .FirstOrDefaultAsync(s => s.Id == id);

    public async Task<(List<Settlement> Items, int Total)> SearchSettlementsAsync(
        Guid? sellerId, SettlementStatus? status, int page, int pageSize)
    {
        IQueryable<Settlement> query = _db.Settlements.AsNoTracking()
            .Include(s => s.Seller)
            .Include(s => s.CreatedBy)
            .Include(s => s.PaidBy);

        if (sellerId.HasValue)
        {
            var id = sellerId.Value;
            query = query.Where(s => s.SellerId == id);
        }

        if (status.HasValue)
        {
            var st = status.Value;
            query = query.Where(s => s.Status == st);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, total);
    }

    public async Task<FinanceCounts> GetCountsAsync()
    {
        var delivered = _db.Orders.AsNoTracking().Where(o => o.Status == OrderStatus.Delivered);

        return new FinanceCounts
        {
            CodCollectedTotal = await delivered.SumAsync(o => o.CodCollected ?? 0),
            CodHeld = await delivered
                .Where(o => (o.CodCollected ?? 0) > 0 && o.CodRemittanceId == null)
                .SumAsync(o => o.CodCollected ?? 0),
            RemittancesPending = await _db.CodRemittances.CountAsync(r => r.Status == RemittanceStatus.Pending),
            SettlementsPending = await _db.Settlements.CountAsync(s => s.Status == SettlementStatus.Pending),
            SettlementsPaid = await _db.Settlements.CountAsync(s => s.Status == SettlementStatus.Paid),
            PendingPayoutAmount = await _db.Settlements
                .Where(s => s.Status == SettlementStatus.Pending && s.NetAmount > 0)
                .SumAsync(s => s.NetAmount),
        };
    }

    public async Task<FinanceReportData> GetFinanceReportDataAsync(DateTime fromUtc, DateTime toUtc)
    {
        var delivered = await _db.Orders.AsNoTracking()
            .Where(o => o.Status == OrderStatus.Delivered && o.DeliveredAt >= fromUtc && o.DeliveredAt < toUtc)
            .Select(o => new { o.DeliveredAt, o.CodCollected, o.ShippingFee })
            .ToListAsync();

        var remitted = await _db.CodRemittances.AsNoTracking()
            .Where(r => r.Status == RemittanceStatus.Confirmed && r.ConfirmedAt >= fromUtc && r.ConfirmedAt < toUtc)
            .Select(r => new { r.ConfirmedAt, r.ReceivedAmount, r.TotalAmount })
            .ToListAsync();

        var settled = await _db.Settlements.AsNoTracking()
            .Where(s => s.CreatedAt >= fromUtc && s.CreatedAt < toUtc)
            .Select(s => new { s.CreatedAt, s.GrossCod })
            .ToListAsync();

        var paid = await _db.Settlements.AsNoTracking()
            .Where(s => s.Status == SettlementStatus.Paid && s.PaidAt >= fromUtc && s.PaidAt < toUtc)
            .Select(s => new { s.PaidAt, s.NetAmount })
            .ToListAsync();

        return new FinanceReportData
        {
            Delivered = delivered.Where(r => r.DeliveredAt.HasValue)
                .Select(r => new MoneyRow { At = r.DeliveredAt!.Value, Amount = r.CodCollected ?? 0, Extra = r.ShippingFee }).ToList(),
            Remitted = remitted.Where(r => r.ConfirmedAt.HasValue)
                .Select(r => new MoneyRow
                {
                    At = r.ConfirmedAt!.Value,
                    Amount = r.ReceivedAmount ?? 0,
                    Extra = (r.ReceivedAmount ?? 0) - r.TotalAmount,
                }).ToList(),
            Settled = settled.Select(s => new MoneyRow { At = s.CreatedAt, Amount = s.GrossCod }).ToList(),
            PaidOut = paid.Where(s => s.PaidAt.HasValue)
                .Select(s => new MoneyRow { At = s.PaidAt!.Value, Amount = s.NetAmount }).ToList(),

            RemittancesPendingAmount = await _db.CodRemittances
                .Where(r => r.Status == RemittanceStatus.Pending)
                .SumAsync(r => r.TotalAmount),
            ReceivedNotSettled = await _db.Orders
                .Where(o => o.Status == OrderStatus.Delivered
                            && o.SettlementId == null
                            && (o.CodCollected ?? 0) > 0
                            && o.CodRemittance != null
                            && o.CodRemittance.Status == RemittanceStatus.Confirmed)
                .SumAsync(o => o.CodCollected ?? 0),
            DifferenceTotal = await _db.CodRemittances
                .Where(r => r.Status == RemittanceStatus.Confirmed)
                .SumAsync(r => (r.ReceivedAmount ?? 0) - r.TotalAmount),
        };
    }

    public async Task<List<DeliveredFeeRow>> GetDeliveredFeeRowsAsync(DateTime fromUtc, DateTime toUtc)
    {
        var rows = await _db.Orders.AsNoTracking()
            .Where(o => o.Status == OrderStatus.Delivered
                        && o.DeliveredAt >= fromUtc
                        && o.DeliveredAt < toUtc)
            .Select(o => new { o.DeliveredAt, o.ShippingFee, o.CodCollected })
            .ToListAsync();

        return rows
            .Where(r => r.DeliveredAt.HasValue)
            .Select(r => new DeliveredFeeRow
            {
                DeliveredAt = r.DeliveredAt!.Value,
                ShippingFee = r.ShippingFee,
                CodCollected = r.CodCollected ?? 0,
            })
            .ToList();
    }

    public async Task SaveAsync()
    {
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            // Có người khác vừa xử lý cùng các đơn này (ví dụ đã nộp hoặc đã đối soát)
            throw new AppException("Dữ liệu vừa được người khác cập nhật, vui lòng tải lại trang và thử lại", 409);
        }
    }
}

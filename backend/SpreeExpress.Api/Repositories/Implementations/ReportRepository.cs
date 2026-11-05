// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Repositories\Implementations\
using Microsoft.EntityFrameworkCore;
using SpreeExpress.Api.Data;
using SpreeExpress.Api.Entities;
using SpreeExpress.Api.Repositories.Interfaces;

namespace SpreeExpress.Api.Repositories.Implementations;

public class ReportRepository : IReportRepository
{
    private readonly AppDbContext _db;

    public ReportRepository(AppDbContext db) => _db = db;

    // ================= FR13, FR15 =================

    public async Task<List<OrderStatusCount>> GetStatusCountsAsync(DateTime fromUtc, DateTime toUtc)
    {
        var statuses = await _db.Orders.AsNoTracking()
            .Where(o => o.CreatedAt >= fromUtc && o.CreatedAt < toUtc)
            .Select(o => o.Status)
            .ToListAsync();

        return statuses
            .GroupBy(s => s)
            .Select(g => new OrderStatusCount { Status = g.Key, Count = g.Count() })
            .ToList();
    }

    public Task<int> CountDeliveredFirstTryAsync(DateTime fromUtc, DateTime toUtc) =>
        _db.Orders.CountAsync(o => o.CreatedAt >= fromUtc && o.CreatedAt < toUtc
                                   && o.Status == OrderStatus.Delivered
                                   && o.DeliveryAttempts == 0);

    public async Task<List<FailureReasonCount>> GetFailureReasonCountsAsync(DateTime fromUtc, DateTime toUtc)
    {
        var reasons = await _db.Orders.AsNoTracking()
            .Where(o => o.CreatedAt >= fromUtc && o.CreatedAt < toUtc && o.DeliveryAttempts > 0)
            .Select(o => o.LastFailureReason)
            .ToListAsync();

        return reasons
            .Where(r => !string.IsNullOrEmpty(r))
            .GroupBy(r => r!)
            .Select(g => new FailureReasonCount { Reason = g.Key, Count = g.Count() })
            .ToList();
    }

    // ================= FR16 =================

    public async Task<List<ShipperActionRow>> GetShipperActionRowsAsync(DateTime fromUtc, DateTime toUtc)
    {
        var rows = await _db.OrderStatusHistory.AsNoTracking()
            .Where(h => h.CreatedAt >= fromUtc && h.CreatedAt < toUtc
                        && h.ActorUserId != null
                        && (h.Status == OrderStatus.PickedUp
                            || h.Status == OrderStatus.Delivered
                            || h.Status == OrderStatus.DeliveryFailed
                            || h.Status == OrderStatus.Returning))
            .Select(h => new { h.ActorUserId, h.Status })
            .ToListAsync();

        return rows
            .Where(r => r.ActorUserId.HasValue)
            .Select(r => new ShipperActionRow { ActorId = r.ActorUserId!.Value, Status = r.Status })
            .ToList();
    }

    public async Task<List<DeliveredOrderRow>> GetDeliveredOrderRowsAsync(DateTime fromUtc, DateTime toUtc)
    {
        var rows = await _db.Orders.AsNoTracking()
            .Where(o => o.Status == OrderStatus.Delivered && o.DeliveredAt >= fromUtc && o.DeliveredAt < toUtc)
            .Select(o => new { o.DeliveryShipperId, o.DispatchedAt, o.DeliveredAt, o.CodCollected })
            .ToListAsync();

        return rows
            .Where(r => r.DeliveredAt.HasValue)
            .Select(r => new DeliveredOrderRow
            {
                ShipperId = r.DeliveryShipperId,
                DispatchedAt = r.DispatchedAt,
                DeliveredAt = r.DeliveredAt!.Value,
                CodCollected = r.CodCollected ?? 0,
            })
            .ToList();
    }

    public async Task<List<ShipperInfo>> GetShippersAsync()
    {
        var users = await _db.Users.AsNoTracking()
            .Include(u => u.Warehouse)
            .Where(u => u.Role == UserRole.Shipper)
            .OrderBy(u => u.FullName)
            .ToListAsync();

        return users.Select(u => new ShipperInfo
        {
            Id = u.Id,
            FullName = u.FullName,
            Phone = u.Phone,
            WarehouseCode = u.Warehouse?.Code,
            IsActive = u.IsActive,
        }).ToList();
    }

    // ================= FR17 =================

    public async Task<List<WarehouseInfo>> GetWarehousesAsync()
    {
        var list = await _db.Warehouses.AsNoTracking().OrderBy(w => w.Code).ToListAsync();
        return list.Select(w => new WarehouseInfo
        {
            Id = w.Id,
            Code = w.Code,
            Name = w.Name,
            Type = w.Type,
            IsActive = w.IsActive,
        }).ToList();
    }

    public async Task<List<StockRow>> GetStockRowsAsync()
    {
        var rows = await _db.Orders.AsNoTracking()
            .Where(o => o.Status == OrderStatus.PickedUp
                        || o.Status == OrderStatus.InWarehouse
                        || o.Status == OrderStatus.DeliveryAccepted
                        || o.Status == OrderStatus.DeliveryFailed
                        || o.Status == OrderStatus.Returning)
            .Select(o => new { o.CurrentWarehouseId, o.PickupWarehouseId, o.Status, o.Quantity, o.ReceivedQuantity, o.ReceivedAt })
            .ToListAsync();

        return rows.Select(r => new StockRow
        {
            CurrentWarehouseId = r.CurrentWarehouseId,
            PickupWarehouseId = r.PickupWarehouseId,
            Status = r.Status,
            Quantity = r.Quantity,
            ReceivedQuantity = r.ReceivedQuantity,
            ReceivedAt = r.ReceivedAt,
        }).ToList();
    }

    // ================= FR18 =================

    public async Task<CodReportCounts> GetCodCountsAsync(DateTime fromUtc, DateTime toUtc)
    {
        var deliveredInPeriod = _db.Orders.AsNoTracking()
            .Where(o => o.Status == OrderStatus.Delivered && o.DeliveredAt >= fromUtc && o.DeliveredAt < toUtc);

        var confirmedInPeriod = _db.CodRemittances.AsNoTracking()
            .Where(r => r.Status == RemittanceStatus.Confirmed && r.ConfirmedAt >= fromUtc && r.ConfirmedAt < toUtc);

        var paidInPeriod = _db.Settlements.AsNoTracking()
            .Where(s => s.Status == SettlementStatus.Paid && s.PaidAt >= fromUtc && s.PaidAt < toUtc && s.NetAmount > 0);

        return new CodReportCounts
        {
            CodCollected = await deliveredInPeriod.SumAsync(o => o.CodCollected ?? 0),
            CodOrders = await deliveredInPeriod.CountAsync(o => (o.CodCollected ?? 0) > 0),

            Held = await _db.Orders.AsNoTracking()
                .Where(o => o.Status == OrderStatus.Delivered && (o.CodCollected ?? 0) > 0 && o.CodRemittanceId == null)
                .SumAsync(o => o.CodCollected ?? 0),

            PendingRemittanceAmount = await _db.CodRemittances.AsNoTracking()
                .Where(r => r.Status == RemittanceStatus.Pending)
                .SumAsync(r => r.TotalAmount),
            PendingRemittances = await _db.CodRemittances.CountAsync(r => r.Status == RemittanceStatus.Pending),

            ConfirmedReceived = await confirmedInPeriod.SumAsync(r => r.ReceivedAmount ?? 0),
            NetDifference = await confirmedInPeriod.SumAsync(r => (r.ReceivedAmount ?? 0) - r.TotalAmount),
            ShortRemittances = await confirmedInPeriod.CountAsync(r => (r.ReceivedAmount ?? 0) < r.TotalAmount),

            PendingPayout = await _db.Settlements.AsNoTracking()
                .Where(s => s.Status == SettlementStatus.Pending && s.NetAmount > 0)
                .SumAsync(s => s.NetAmount),
            PendingSettlements = await _db.Settlements.CountAsync(s => s.Status == SettlementStatus.Pending),

            PaidOut = await paidInPeriod.SumAsync(s => s.NetAmount),
            PaidSettlements = await paidInPeriod.CountAsync(s => s.NetAmount > 0),
        };
    }
}

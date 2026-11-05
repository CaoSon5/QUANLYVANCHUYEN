// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\DTOs\
namespace SpreeExpress.Api.DTOs;

// ===== FR13, FR15: đơn theo trạng thái, tỉ lệ giao thành công / thất bại / hoàn =====

public class StatusCountDto
{
    public string Status { get; set; } = string.Empty;   // dạng snake_case: delivered, in_warehouse...
    public int Count { get; set; }
    public decimal Percent { get; set; }                 // % trên tổng số đơn trong kỳ
}

public class FailureReasonCountDto
{
    public string Reason { get; set; } = string.Empty;   // no_contact | refused | wrong_address
    public int Count { get; set; }
}

public class DeliveryOutcomeDto
{
    public int Delivered { get; set; }
    public int DeliveredFirstTry { get; set; }           // giao thành công ngay lần đầu
    public int DeliveryFailed { get; set; }              // thất bại, đang chờ giao lại
    public int Returning { get; set; }                   // hết lần giao lại, chờ hoàn hàng
    public int Returned { get; set; }                    // đã hoàn về người bán
    public int Attempted { get; set; }                   // số đơn đã có kết quả giao (cơ sở tính tỉ lệ)

    // Các tỉ lệ (%) tính trên Attempted; null khi chưa có đơn nào có kết quả
    public decimal? SuccessRate { get; set; }
    public decimal? FailedRate { get; set; }
    public decimal? ReturnRate { get; set; }
    public decimal? FirstTryRate { get; set; }           // trên số đơn giao thành công
}

public class OrderReportDto
{
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }
    public int TotalOrders { get; set; }                 // số đơn được tạo trong kỳ
    public List<StatusCountDto> Statuses { get; set; } = new();
    public DeliveryOutcomeDto Outcome { get; set; } = new();
    public List<FailureReasonCountDto> FailureReasons { get; set; } = new();
}

// ===== FR16: hiệu suất từng shipper =====

public class ShipperPerformanceDto
{
    public Guid ShipperId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? WarehouseCode { get; set; }
    public bool IsActive { get; set; }
    public int Pickups { get; set; }                     // số đơn đã lấy hàng
    public int Delivered { get; set; }                   // số lần giao thành công
    public int Failed { get; set; }                      // số lần giao thất bại
    public decimal? SuccessRate { get; set; }            // Delivered / (Delivered + Failed)
    public decimal CodCollected { get; set; }
    public decimal? AverageDeliveryHours { get; set; }   // từ lúc kho xuất hàng đến lúc giao thành công
}

public class ShipperReportDto
{
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }
    public List<ShipperPerformanceDto> Shippers { get; set; } = new();
    public int TotalPickups { get; set; }
    public int TotalDelivered { get; set; }
    public int TotalFailed { get; set; }
    public decimal TotalCod { get; set; }
}

// ===== FR17: tồn kho theo từng kho =====

public class WarehouseStockDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;     // regional | local
    public bool IsActive { get; set; }
    public int Incoming { get; set; }                    // đang trên đường về kho (shipper đã lấy hàng)
    public int InStock { get; set; }                     // đã nhập kho, chưa ai nhận giao
    public int AwaitingDispatch { get; set; }            // shipper đã nhận giao, chờ kho xuất hàng
    public int Retry { get; set; }                       // giao thất bại, chờ giao lại
    public int Returning { get; set; }                   // chờ hoàn hàng về người bán
    public int TotalOrders { get; set; }                 // tổng đơn đang nằm trong kho
    public int Pieces { get; set; }                      // tổng số kiện
    public int Stale48h { get; set; }                    // lưu quá 48 giờ
    public decimal? AverageStorageHours { get; set; }
}

public class InventoryReportDto
{
    public DateTime GeneratedAt { get; set; }
    public List<WarehouseStockDto> Warehouses { get; set; } = new();
    public int TotalOrders { get; set; }
    public int TotalStale { get; set; }
    public int TotalIncoming { get; set; }
    public int TotalAwaitingDispatch { get; set; }
}

// ===== FR18: đối soát COD =====

public class CodReportDto
{
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }

    // Trong kỳ
    public decimal CodCollected { get; set; }            // COD shipper thu được từ các đơn giao thành công trong kỳ
    public int CodOrders { get; set; }
    public decimal ConfirmedReceived { get; set; }       // kế toán xác nhận nhận từ shipper trong kỳ
    public decimal NetDifference { get; set; }           // tổng (thực nhận - khai nộp) của các phiếu xác nhận trong kỳ; âm = thiếu
    public int ShortRemittances { get; set; }            // số phiếu thực nhận thấp hơn khai nộp
    public decimal PaidOut { get; set; }                 // đã chuyển cho người bán trong kỳ
    public int PaidSettlements { get; set; }

    // Hiện tại (không phụ thuộc kỳ)
    public decimal Held { get; set; }                    // shipper đang giữ, chưa nộp
    public decimal PendingRemittanceAmount { get; set; } // đã nộp, chờ kế toán xác nhận
    public int PendingRemittances { get; set; }
    public decimal PendingPayout { get; set; }           // bảng đối soát chờ chuyển cho người bán
    public int PendingSettlements { get; set; }

    public List<ShipperHoldingDto> Holdings { get; set; } = new();
}

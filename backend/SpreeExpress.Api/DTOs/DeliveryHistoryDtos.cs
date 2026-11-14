// Đặt vào: backend\SpreeExpress.Api\DTOs\ (file MỚI)
namespace SpreeExpress.Api.DTOs;

// Một dòng lịch sử giao hàng của shipper
public class DeliveryHistoryDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public string Result { get; set; } = string.Empty;   // delivered | failed | returning
    public string ReceiverName { get; set; } = string.Empty;
    public string ReceiverAddress { get; set; } = string.Empty;
    public decimal CodAmount { get; set; }
    public decimal? CodCollected { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Thống kê giao hàng của shipper theo ngày (ngày tính theo giờ Việt Nam)
public class DeliveryStatsDto
{
    public int Days { get; set; }
    public int Delivered { get; set; }   // tổng lượt giao thành công trong kỳ
    public int Failed { get; set; }      // tổng lượt giao thất bại trong kỳ
    public List<DeliveryDayDto> Daily { get; set; } = new();
}

public class DeliveryDayDto
{
    public string Date { get; set; } = string.Empty;   // yyyy-MM-dd
    public int Delivered { get; set; }
    public int Failed { get; set; }
}

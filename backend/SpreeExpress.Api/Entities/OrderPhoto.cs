// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Entities\
namespace SpreeExpress.Api.Entities;

// Ảnh minh chứng giao hàng (thành công / thất bại).
// Lưu trực tiếp trong database dạng byte; ảnh đã được nén nhỏ ở trình duyệt trước khi gửi lên.
public class OrderPhoto
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid OrderId { get; set; }
    public Order? Order { get; set; }

    public string Kind { get; set; } = string.Empty;       // delivered | failed
    public string ContentType { get; set; } = string.Empty;
    public byte[] Data { get; set; } = Array.Empty<byte>();

    public Guid? UploadedById { get; set; }
    public User? UploadedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

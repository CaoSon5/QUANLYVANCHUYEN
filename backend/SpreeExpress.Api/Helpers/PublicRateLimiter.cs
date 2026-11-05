// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Helpers\
using System.Collections.Concurrent;

namespace SpreeExpress.Api.Helpers;

// Giới hạn số lần gọi các API công khai theo từng địa chỉ IP, để chống dò mã vận đơn hoặc số điện thoại hàng loạt.
// Lưu trong bộ nhớ của tiến trình: phù hợp khi chạy một bản duy nhất (như Render gói miễn phí).
public static class PublicRateLimiter
{
    private static readonly ConcurrentDictionary<string, (int Count, DateTime WindowStart)> Hits = new();

    // Trả về true nếu lần gọi này còn trong hạn mức
    public static bool Allow(string key, int limit, TimeSpan window) => Allow(key, limit, window, DateTime.UtcNow);

    public static bool Allow(string key, int limit, TimeSpan window, DateTime now)
    {
        var entry = Hits.AddOrUpdate(
            key,
            _ => (1, now),
            (_, e) => now - e.WindowStart > window ? (1, now) : (e.Count + 1, e.WindowStart));

        // Dọn các mục đã hết hạn khi bảng quá lớn để không tốn bộ nhớ
        if (Hits.Count > 5000)
        {
            foreach (var pair in Hits)
            {
                if (now - pair.Value.WindowStart > window) Hits.TryRemove(pair.Key, out _);
            }
        }

        return entry.Count <= limit;
    }
}

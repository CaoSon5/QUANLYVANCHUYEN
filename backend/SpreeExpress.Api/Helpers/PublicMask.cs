// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Helpers\
using System.Globalization;
using System.Text.RegularExpressions;

namespace SpreeExpress.Api.Helpers;

// Che bớt thông tin cá nhân trước khi hiển thị trên trang tra cứu công khai (không cần đăng nhập)
public static class PublicMask
{
    // "Lê Văn Trường" -> "L* V** Trường" (giữ nguyên tên gọi). Với tên cửa hàng (keepLastWord = false) che tất cả các từ.
    public static string MaskName(string? name, bool keepLastWord)
    {
        if (string.IsNullOrWhiteSpace(name)) return string.Empty;

        var words = name.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var masked = words.Select((w, i) => keepLastWord && i == words.Length - 1 ? w : MaskWord(w));
        return string.Join(' ', masked);
    }

    // Dùng "text element" thay vì ký tự thô để không cắt đôi chữ có dấu tiếng Việt
    private static string MaskWord(string word)
    {
        var info = new StringInfo(word);
        var length = info.LengthInTextElements;
        if (length <= 1) return word;
        return info.SubstringByTextElements(0, 1) + new string('*', length - 1);
    }

    // "0827917261" -> "*******261"
    public static string MaskPhone(string? phone)
    {
        var digits = new string((phone ?? string.Empty).Where(char.IsDigit).ToArray());
        if (digits.Length < 7) return "***";
        return new string('*', digits.Length - 3) + digits[^3..];
    }

    // Chấp nhận 0912345678, 0912 345 678, 091.234.5678, +84912345678, 84912345678. Trả về dạng 0xxxxxxxxx hoặc null.
    public static string? NormalizePhone(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return null;

        var cleaned = Regex.Replace(input.Trim(), @"[\s.\-()]", "");
        if (cleaned.StartsWith("+84")) cleaned = "0" + cleaned[3..];
        else if (cleaned.StartsWith("84") && cleaned.Length == 11) cleaned = "0" + cleaned[2..];

        return Regex.IsMatch(cleaned, @"^0\d{9}$") ? cleaned : null;
    }

    // Mã vận đơn chỉ gồm chữ và số, 6 đến 30 ký tự
    public static bool LooksLikeOrderCode(string? code) =>
        !string.IsNullOrEmpty(code) && Regex.IsMatch(code, @"^[A-Z0-9]{6,30}$");
}

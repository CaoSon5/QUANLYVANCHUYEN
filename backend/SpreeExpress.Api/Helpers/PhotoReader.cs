
using Microsoft.AspNetCore.Http;
using SpreeExpress.Api.DTOs;

namespace SpreeExpress.Api.Helpers;

// Đọc ảnh từ form: tối đa 3 ảnh, mỗi ảnh tối đa 1,5 MB, chỉ nhận JPEG, PNG, WEBP
public static class PhotoReader
{
    public const int MaxPhotos = 3;
    public const long MaxBytes = 1_500_000;

    private static readonly HashSet<string> AllowedTypes = new() { "image/jpeg", "image/png", "image/webp" };

    public static async Task<List<PhotoUpload>> ReadAsync(List<IFormFile>? files)
    {
        var result = new List<PhotoUpload>();
        if (files is null || files.Count == 0) return result;

        if (files.Count > MaxPhotos)
            throw new AppException($"Tối đa {MaxPhotos} ảnh mỗi lần", 400);

        foreach (var file in files)
        {
            if (file.Length == 0) continue;
            if (file.Length > MaxBytes)
                throw new AppException("Ảnh quá lớn (tối đa 1,5 MB mỗi ảnh)", 400);
            if (!AllowedTypes.Contains(file.ContentType))
                throw new AppException("Chỉ nhận ảnh JPEG, PNG hoặc WEBP", 400);

            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            var data = ms.ToArray();

            // Kiểm tra nội dung thật sự là ảnh, không chỉ tin vào phần mở rộng hay loại khai báo
            if (!LooksLikeImage(data))
                throw new AppException("Tệp tải lên không phải ảnh hợp lệ", 400);

            result.Add(new PhotoUpload { ContentType = file.ContentType, Data = data });
        }

        return result;
    }

    private static bool LooksLikeImage(byte[] d) =>
        d.Length > 12 && (
            (d[0] == 0xFF && d[1] == 0xD8 && d[2] == 0xFF) ||                                  // JPEG
            (d[0] == 0x89 && d[1] == 0x50 && d[2] == 0x4E && d[3] == 0x47) ||                  // PNG
            (d[0] == 0x52 && d[1] == 0x49 && d[2] == 0x46 && d[3] == 0x46
                && d[8] == 0x57 && d[9] == 0x45 && d[10] == 0x42 && d[11] == 0x50));          // WEBP
}

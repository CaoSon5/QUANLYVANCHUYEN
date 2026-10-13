namespace SpreeExpress.Api.Helpers;

// Tính phí vận chuyển theo cân nặng. Công thức tạm thời, đổi số trong appsettings.json mục "Shipping":
//   - BaseFee: phí cho BaseWeightKg đầu tiên (mặc định 20.000đ cho 1 kg)
//   - ExtraFeePerHalfKg: mỗi 0,5 kg vượt thêm (mặc định 5.000đ)
// Muốn tính theo khoảng cách / vùng thì sửa duy nhất hàm Calculate này.
public class ShippingFeeCalculator
{
    private readonly decimal _baseFee;
    private readonly decimal _baseWeightKg;
    private readonly decimal _extraPerHalfKg;

    public ShippingFeeCalculator(IConfiguration config)
    {
        _baseFee = config.GetValue("Shipping:BaseFee", 20000m);
        _baseWeightKg = config.GetValue("Shipping:BaseWeightKg", 1m);
        _extraPerHalfKg = config.GetValue("Shipping:ExtraFeePerHalfKg", 5000m);
    }

    public decimal Calculate(decimal weightKg)
    {
        var fee = _baseFee;
        if (weightKg > _baseWeightKg)
        {
            var steps = Math.Ceiling((weightKg - _baseWeightKg) / 0.5m);
            fee += steps * _extraPerHalfKg;
        }
        return fee;
    }
}

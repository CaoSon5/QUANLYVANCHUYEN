namespace SpreeExpress.Api.Helpers;

// Lỗi nghiệp vụ: ném ra ở Service, ExceptionMiddleware sẽ đổi thành response { message }
public class AppException : Exception
{
    public int StatusCode { get; }

    public AppException(string message, int statusCode = 400) : base(message)
    {
        StatusCode = statusCode;
    }
}

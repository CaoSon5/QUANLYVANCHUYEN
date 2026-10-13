using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SpreeExpress.Api.Data;
using SpreeExpress.Api.Helpers;
using SpreeExpress.Api.Middlewares;
using SpreeExpress.Api.Repositories.Implementations;
using SpreeExpress.Api.Repositories.Interfaces;
using SpreeExpress.Api.Services.Implementations;
using SpreeExpress.Api.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// ----- Render cấp cổng qua biến môi trường PORT -----
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// ----- Database (PostgreSQL / Supabase) -----
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Không tìm thấy ConnectionStrings:DefaultConnection"
    );
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// ----- Dependency Injection -----
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IWarehouseRepository, WarehouseRepository>();
builder.Services.AddScoped<IWarehouseService, WarehouseService>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddSingleton<ShippingFeeCalculator>();
builder.Services.AddSingleton<JwtTokenGenerator>();

// ----- Controllers: lỗi validate trả về { message } -----
builder.Services.AddControllers().ConfigureApiBehaviorOptions(options =>
{
    options.InvalidModelStateResponseFactory = ctx =>
    {
        var message = ctx.ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => e.ErrorMessage)
            .FirstOrDefault(m => !string.IsNullOrWhiteSpace(m)) ?? "Dữ liệu không hợp lệ";
        return new BadRequestObjectResult(new { message });
    };
});

// ----- JWT -----
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
    throw new InvalidOperationException("Thiếu cấu hình Jwt:Key");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
            NameClaimType = ClaimTypes.Name,
            RoleClaimType = ClaimTypes.Role,
        };

        // Mỗi request kiểm tra lại database: tài khoản bị khóa hoặc đổi vai trò
        // thì token cũ lập tức hết hiệu lực (frontend sẽ tự đưa về trang đăng nhập).
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async ctx =>
            {
                var idText = ctx.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!Guid.TryParse(idText, out var userId))
                {
                    ctx.Fail("Token không hợp lệ");
                    return;
                }

                var users = ctx.HttpContext.RequestServices.GetRequiredService<IUserRepository>();
                var user = await users.GetByIdAsync(userId);

                if (user is null || !user.IsActive)
                {
                    ctx.Fail("Tài khoản không còn hiệu lực");
                    return;
                }

                // Ghi nhớ cho middleware bên dưới biết tài khoản này đang bị bắt buộc đổi mật khẩu
                ctx.HttpContext.Items["MustChangePassword"] = user.MustChangePassword;

                var roleInToken = ctx.Principal?.FindFirstValue(ClaimTypes.Role);
                if (roleInToken != user.Role.ToString())
                    ctx.Fail("Vai trò đã thay đổi, vui lòng đăng nhập lại");
            },
        };
    });
builder.Services.AddAuthorization();

// ----- CORS cho frontend -----
// Cấu hình nhiều địa chỉ cách nhau bằng dấu phẩy, ví dụ:
// Cors__Origins=https://ten-ban.vercel.app,http://localhost:5173
var allowedOrigins = (builder.Configuration["Cors:Origins"] ?? "http://localhost:5173")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

// Tự cập nhật database theo migration (cả local lẫn production)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}

app.UseCors("Frontend");
app.UseMiddleware<ExceptionMiddleware>();
app.UseAuthentication();

// Tài khoản đang bị bắt buộc đổi mật khẩu: chỉ cho gọi API đổi mật khẩu và xem thông tin cá nhân
app.Use(async (context, next) =>
{
    if (context.Items["MustChangePassword"] is true
        && !context.Request.Path.StartsWithSegments("/api/auth/change-password")
        && !context.Request.Path.StartsWithSegments("/api/auth/me"))
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        await context.Response.WriteAsJsonAsync(new { message = "Vui lòng đổi mật khẩu trước khi sử dụng hệ thống" });
        return;
    }

    await next();
});

app.UseAuthorization();
app.MapControllers();

app.Run();

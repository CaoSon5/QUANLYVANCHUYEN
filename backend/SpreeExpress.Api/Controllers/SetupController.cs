using Microsoft.AspNetCore.Mvc;
using SpreeExpress.Api.DTOs;
using SpreeExpress.Api.Services.Interfaces;

namespace SpreeExpress.Api.Controllers;

// Thiết lập lần đầu: tạo admin đầu tiên. Sau khi đã có admin, các API này bị từ chối.
[ApiController]
[Route("api/[controller]")]
public class SetupController : ControllerBase
{
    private readonly IAuthService _auth;

    public SetupController(IAuthService auth) => _auth = auth;

    // Frontend gọi để biết có cần hiện trang thiết lập không
    [HttpGet("status")]
    public async Task<IActionResult> Status() =>
        Ok(new { needsSetup = await _auth.NeedsSetupAsync() });

    [HttpPost("admin")]
    public async Task<ActionResult<AuthResponse>> CreateAdmin(SetupAdminRequest request) =>
        Ok(await _auth.SetupAdminAsync(request));
}

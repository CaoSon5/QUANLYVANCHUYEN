using SpreeExpress.Api.DTOs;

namespace SpreeExpress.Api.Services.Interfaces;

public interface IWarehouseService
{
    Task<PagedResult<WarehouseDto>> ListAsync(string? search, string? type, bool? isActive, int page, int pageSize);
    Task<WarehouseSummaryDto> GetSummaryAsync();
    Task<List<WarehouseOptionDto>> GetOptionsAsync();
    Task<WarehouseDetailDto> GetDetailAsync(Guid id);
    Task<WarehouseDto> CreateAsync(CreateWarehouseRequest request);
    Task<WarehouseDto> UpdateAsync(Guid id, UpdateWarehouseRequest request);
    Task<WarehouseDto> SetStatusAsync(Guid id, bool isActive);
    Task<WarehouseDetailDto> AssignMemberAsync(Guid warehouseId, Guid userId);
    Task<WarehouseDetailDto> RemoveMemberAsync(Guid warehouseId, Guid userId);
}

// Đặt vào: D:\spreeexpress\backend\SpreeExpress.Api\Services\Implementations\
using SpreeExpress.Api.DTOs;
using SpreeExpress.Api.Entities;
using SpreeExpress.Api.Helpers;
using SpreeExpress.Api.Repositories.Interfaces;
using SpreeExpress.Api.Services.Interfaces;

namespace SpreeExpress.Api.Services.Implementations;

public class WarehouseService : IWarehouseService
{
    private readonly IWarehouseRepository _warehouses;
    private readonly IUserRepository _users;

    public WarehouseService(IWarehouseRepository warehouses, IUserRepository users)
    {
        _warehouses = warehouses;
        _users = users;
    }

    public async Task<PagedResult<WarehouseDto>> ListAsync(
        string? search, string? type, bool? isActive, int page, int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        WarehouseType? typeFilter = null;
        if (!string.IsNullOrWhiteSpace(type)) typeFilter = ParseType(type);

        var (items, total) = await _warehouses.SearchAsync(search?.Trim(), typeFilter, isActive, page, pageSize);

        return new PagedResult<WarehouseDto>
        {
            Items = items.Select(ToDto).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize,
        };
    }

    public async Task<WarehouseSummaryDto> GetSummaryAsync()
    {
        var (total, active, regional, local) = await _warehouses.GetCountsAsync();
        return new WarehouseSummaryDto { Total = total, Active = active, Regional = regional, Local = local };
    }

    public async Task<List<WarehouseOptionDto>> GetOptionsAsync()
    {
        var list = await _warehouses.GetActiveAsync();
        return list.Select(w => new WarehouseOptionDto
        {
            Id = w.Id,
            Code = w.Code,
            Name = w.Name,
            Type = w.Type.ToString().ToLowerInvariant(),
        }).ToList();
    }

    public async Task<WarehouseDetailDto> GetDetailAsync(Guid id)
    {
        var warehouse = await _warehouses.GetDetailAsync(id)
                        ?? throw new AppException("Không tìm thấy kho", 404);
        var row = await _warehouses.GetRowAsync(id)
                  ?? throw new AppException("Không tìm thấy kho", 404);

        return new WarehouseDetailDto
        {
            Warehouse = ToDto(row),
            Staff = warehouse.Members.Where(m => m.Role == UserRole.Warehouse)
                .OrderBy(m => m.FullName).Select(ToMember).ToList(),
            Shippers = warehouse.Members.Where(m => m.Role == UserRole.Shipper)
                .OrderBy(m => m.FullName).Select(ToMember).ToList(),
            Children = warehouse.Children.OrderBy(c => c.Code).Select(c => new WarehouseChildDto
            {
                Id = c.Id,
                Code = c.Code,
                Name = c.Name,
                IsActive = c.IsActive,
            }).ToList(),
            StockCount = 0, // chưa có đơn hàng nên chưa có tồn kho
        };
    }

    public async Task<WarehouseDto> CreateAsync(CreateWarehouseRequest request)
    {
        var type = ParseType(request.Type);
        Guid? parentId = type == WarehouseType.Local ? request.ParentId : null;
        await ValidateParentAsync(type, parentId, selfId: null, currentParentId: null);

        // Mã kho do Admin tự đặt: luôn lưu chữ in hoa và không được trùng
        var code = request.Code.Trim().ToUpperInvariant();
        if (await _warehouses.CodeExistsAsync(code))
            throw new AppException($"Mã kho {code} đã tồn tại, vui lòng chọn mã khác", 409);

        var warehouse = new Warehouse
        {
            Code = code,
            Name = request.Name.Trim(),
            Address = request.Address.Trim(),
            Type = type,
            ParentId = parentId,
        };

        await _warehouses.AddAsync(warehouse);
        return await GetRowDtoAsync(warehouse.Id);
    }

    public async Task<WarehouseDto> UpdateAsync(Guid id, UpdateWarehouseRequest request)
    {
        var warehouse = await GetOrThrowAsync(id);
        var newType = ParseType(request.Type);

        if (newType != warehouse.Type)
        {
            if (newType == WarehouseType.Local && await _warehouses.HasChildrenAsync(id))
                throw new AppException("Kho vùng đang quản lý các kho địa phương, không thể đổi thành kho địa phương", 400);
            if (newType == WarehouseType.Regional && await _warehouses.HasShippersAsync(id))
                throw new AppException("Kho đang có shipper phụ trách, không thể đổi thành kho vùng", 400);
        }

        Guid? parentId = newType == WarehouseType.Local ? request.ParentId : null;
        await ValidateParentAsync(newType, parentId, selfId: id, currentParentId: warehouse.ParentId);

        warehouse.Name = request.Name.Trim();
        warehouse.Address = request.Address.Trim();
        warehouse.Type = newType;
        warehouse.ParentId = parentId;

        await _warehouses.UpdateAsync(warehouse);
        return await GetRowDtoAsync(id);
    }

    public async Task<WarehouseDto> SetStatusAsync(Guid id, bool isActive)
    {
        var warehouse = await GetOrThrowAsync(id);

        // Kho vùng còn kho địa phương đang chạy thì không được ngừng (hàng của các kho đó sẽ không có đường đi)
        if (!isActive && warehouse.Type == WarehouseType.Regional && await _warehouses.HasActiveChildrenAsync(id))
            throw new AppException("Kho vùng còn kho địa phương đang hoạt động. Hãy ngừng hoặc chuyển các kho đó sang kho vùng khác trước", 400);

        // Mở lại kho địa phương thì kho vùng quản lý của nó phải đang hoạt động
        if (isActive && warehouse.Type == WarehouseType.Local && warehouse.ParentId.HasValue)
        {
            var parent = await _warehouses.GetByIdAsync(warehouse.ParentId.Value);
            if (parent is { IsActive: false })
                throw new AppException("Kho vùng quản lý đang ngừng hoạt động, hãy mở lại kho vùng trước", 400);
        }

        warehouse.IsActive = isActive;
        await _warehouses.UpdateAsync(warehouse);
        return await GetRowDtoAsync(id);
    }

    // Gán nhân viên kho / shipper vào kho. Mỗi người chỉ thuộc một kho nên gán mới sẽ chuyển họ khỏi kho cũ.
    public async Task<WarehouseDetailDto> AssignMemberAsync(Guid warehouseId, Guid userId)
    {
        var warehouse = await GetOrThrowAsync(warehouseId);
        if (!warehouse.IsActive)
            throw new AppException("Kho đã ngừng hoạt động, không thể gán thêm người", 400);

        var user = await _users.GetByIdAsync(userId)
                   ?? throw new AppException("Không tìm thấy tài khoản", 404);

        if (user.Role != UserRole.Warehouse && user.Role != UserRole.Shipper)
            throw new AppException("Chỉ gán được nhân viên kho hoặc shipper vào kho", 400);
        if (user.Role == UserRole.Shipper && warehouse.Type != WarehouseType.Local)
            throw new AppException("Shipper chỉ được gán vào kho địa phương", 400);

        user.WarehouseId = warehouseId;
        await _users.UpdateAsync(user);

        return await GetDetailAsync(warehouseId);
    }

    public async Task<WarehouseDetailDto> RemoveMemberAsync(Guid warehouseId, Guid userId)
    {
        await GetOrThrowAsync(warehouseId);

        var user = await _users.GetByIdAsync(userId)
                   ?? throw new AppException("Không tìm thấy tài khoản", 404);
        if (user.WarehouseId != warehouseId)
            throw new AppException("Tài khoản này không thuộc kho đang xem", 400);

        user.WarehouseId = null;
        await _users.UpdateAsync(user);

        return await GetDetailAsync(warehouseId);
    }

    // ----- helpers -----

    private async Task<Warehouse> GetOrThrowAsync(Guid id) =>
        await _warehouses.GetByIdAsync(id) ?? throw new AppException("Không tìm thấy kho", 404);

    private async Task<WarehouseDto> GetRowDtoAsync(Guid id)
    {
        var row = await _warehouses.GetRowAsync(id) ?? throw new AppException("Không tìm thấy kho", 404);
        return ToDto(row);
    }

    // Kho vùng là trung tâm trung chuyển nên không có kho cấp trên.
    // Kho địa phương BẮT BUỘC thuộc một kho vùng đang hoạt động (hàng đi qua kho vùng trước khi tới kho khác).
    private async Task ValidateParentAsync(WarehouseType type, Guid? parentId, Guid? selfId, Guid? currentParentId)
    {
        if (type == WarehouseType.Regional) return;

        if (!parentId.HasValue)
            throw new AppException("Kho địa phương phải thuộc một kho vùng, vui lòng chọn kho vùng quản lý", 400);

        if (parentId == selfId)
            throw new AppException("Kho không thể tự quản lý chính nó", 400);

        var parent = await _warehouses.GetByIdAsync(parentId.Value)
                     ?? throw new AppException("Không tìm thấy kho vùng quản lý", 400);

        if (parent.Type != WarehouseType.Regional)
            throw new AppException("Kho quản lý phải là kho vùng", 400);

        // Chỉ kiểm tra "đang hoạt động" khi chọn kho vùng mới, để vẫn sửa được kho có kho vùng cũ đã ngừng
        if (parentId != currentParentId && !parent.IsActive)
            throw new AppException("Kho vùng quản lý đang ngừng hoạt động", 400);
    }

    private static WarehouseType ParseType(string value)
    {
        if (!Enum.TryParse<WarehouseType>(value, ignoreCase: true, out var type) || !Enum.IsDefined(type))
            throw new AppException("Loại kho không hợp lệ", 400);
        return type;
    }

    private static WarehouseDto ToDto(WarehouseRow r) => new()
    {
        Id = r.Id,
        Code = r.Code,
        Name = r.Name,
        Address = r.Address,
        Type = r.Type.ToString().ToLowerInvariant(),
        ParentId = r.ParentId,
        ParentCode = r.ParentCode,
        ParentName = r.ParentName,
        IsActive = r.IsActive,
        CreatedAt = r.CreatedAt,
        StaffCount = r.StaffCount,
        ShipperCount = r.ShipperCount,
    };

    private static WarehouseMemberDto ToMember(User u) => new()
    {
        Id = u.Id,
        FullName = u.FullName,
        Email = u.Email,
        Phone = u.Phone,
        Role = u.Role.ToString().ToLowerInvariant(),
        IsActive = u.IsActive,
    };
}

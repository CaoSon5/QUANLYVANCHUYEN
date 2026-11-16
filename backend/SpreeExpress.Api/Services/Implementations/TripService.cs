// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Services\Implementations\
using System.Text.RegularExpressions;
using SpreeExpress.Api.DTOs;
using SpreeExpress.Api.Entities;
using SpreeExpress.Api.Helpers;
using SpreeExpress.Api.Repositories.Interfaces;
using SpreeExpress.Api.Services.Interfaces;

namespace SpreeExpress.Api.Services.Implementations;

// Chuyến vận chuyển liên kho: điều phối viên phân tài xế đến kho, nhân viên kho lên hàng và nhận hàng,
// tài xế xác nhận từng điểm dừng cho đến khi xe hết bao (FR20 đến FR27, FR30, FR35 đến FR38, FR41 đến FR48)
public class TripService : ITripService
{
    private readonly ITripRepository _trips;
    private readonly IBundleRepository _bundles;
    private readonly IOrderRepository _orders;
    private readonly IWarehouseRepository _warehouses;
    private readonly IUserRepository _users;
    private readonly int _pendingPickupHours;
    private readonly int _unclaimedDeliveryHours;
    private readonly int _unloadedBundleHours;
    private readonly int _assignedTripHours;

    public TripService(
        ITripRepository trips, IBundleRepository bundles, IOrderRepository orders,
        IWarehouseRepository warehouses, IUserRepository users, IConfiguration config)
    {
        _trips = trips;
        _bundles = bundles;
        _orders = orders;
        _warehouses = warehouses;
        _users = users;

        // Ngưỡng "chờ quá lâu" (FR26), đổi được bằng cấu hình Trips:...
        _pendingPickupHours = Math.Max(1, config.GetValue("Trips:PendingPickupHours", 4));
        _unclaimedDeliveryHours = Math.Max(1, config.GetValue("Trips:UnclaimedDeliveryHours", 24));
        _unloadedBundleHours = Math.Max(1, config.GetValue("Trips:UnloadedBundleHours", 6));
        _assignedTripHours = Math.Max(1, config.GetValue("Trips:AssignedTripHours", 2));
    }

    // ================= ĐIỀU PHỐI =================

    // FR23: tài xế rảnh, bận, đang ở đâu, xe thế nào
    public async Task<List<DriverOptionDto>> ListDriversAsync(Guid userId)
    {
        await GetDispatcherAsync(userId);

        var drivers = await _trips.GetDriversAsync();
        var active = (await _trips.GetActiveTripsAsync())
            .GroupBy(t => t.DriverId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(t => t.CreatedAt).First());
        var lastDone = await _trips.GetLastCompletedWarehouseByDriverAsync();

        var ids = new HashSet<Guid>(lastDone.Values);
        foreach (var d in drivers)
            if (d.WarehouseId.HasValue) ids.Add(d.WarehouseId.Value);
        var labels = (await _trips.GetWarehouseLabelsAsync(ids)).ToDictionary(w => w.Id);

        return drivers.Select(d =>
        {
            active.TryGetValue(d.Id, out var trip);
            var dto = new DriverOptionDto
            {
                Id = d.Id,
                FullName = d.FullName,
                Phone = d.Phone,
                VehiclePlate = d.VehiclePlate,
                CapacityKg = d.VehicleCapacityKg,
                HasVehicle = HasVehicle(d),
                IsIdle = trip is null,
                ActiveTripCode = trip?.Code,
                ActiveTripStatus = trip is null ? null : StatusKey(trip.Status),
            };

            if (trip is null)
            {
                // Kho hiện tại: nơi hoàn thành chuyến gần nhất, hoặc kho Admin gán nếu chưa chạy chuyến nào
                Guid? where = lastDone.TryGetValue(d.Id, out var last) ? last : d.WarehouseId;
                if (where.HasValue && labels.TryGetValue(where.Value, out var label))
                {
                    dto.WarehouseCode = label.Code;
                    dto.WarehouseName = label.Name;
                    dto.Location = $"Đang ở kho {label.Code}";
                }
                else
                {
                    dto.Location = "Chưa xác định vị trí";
                }
            }
            else
            {
                dto.Location = trip.Status switch
                {
                    TripStatus.Assigned => $"Đang đến kho {trip.Next?.Code} nhận hàng",
                    TripStatus.AtWarehouse => $"Đang ở kho {trip.Current?.Code}",
                    TripStatus.InTransit => $"Đang đến kho {trip.Next?.Code}",
                    _ => string.Empty,
                };
            }

            return dto;
        })
        .OrderByDescending(d => d.IsIdle)
        .ThenBy(d => d.FullName)
        .ToList();
    }

    // FR21: các kho đang hoạt động (kèm mã kho) để chọn kho cho tài xế đến nhận hàng
    public async Task<List<DestinationOptionDto>> ListWarehousesAsync(Guid userId, string? search)
    {
        await GetDispatcherAsync(userId);
        var all = await _warehouses.GetActiveAsync();
        var text = search?.Trim();

        return all
            .Where(w => string.IsNullOrEmpty(text)
                        || w.Code.Contains(text, StringComparison.OrdinalIgnoreCase)
                        || w.Name.Contains(text, StringComparison.OrdinalIgnoreCase))
            .OrderBy(w => w.Code)
            .Select(w => new DestinationOptionDto
            {
                Id = w.Id,
                Code = w.Code,
                Name = w.Name,
                Type = w.Type.ToString().ToLowerInvariant(),
                ParentCode = w.ParentId.HasValue ? all.FirstOrDefault(p => p.Id == w.ParentId)?.Code : null,
            })
            .ToList();
    }

    // FR22: phân một tài xế đến một kho để nhận hàng
    public async Task<TripDto> CreateAsync(Guid userId, CreateTripRequest request)
    {
        var creator = await GetDispatcherAsync(userId);

        var driver = await GetIdleDriverAsync(request.DriverId!.Value);
        var warehouse = await FindActiveWarehouseAsync(request.WarehouseCode);

        var number = await _trips.NextNumberAsync();
        var trip = new Trip
        {
            Code = $"CH{DateTime.UtcNow.AddHours(7):yyMMdd}{number:D5}",
            DriverId = driver.Id,
            VehiclePlate = driver.VehiclePlate!,
            CapacityKg = driver.VehicleCapacityKg!.Value,
            PickupWarehouseId = warehouse.Id,
            NextWarehouseId = warehouse.Id,
            Note = Clean(request.Note),
            CreatedById = creator.Id,
        };

        _trips.Add(trip);
        await _trips.SaveAsync();
        return await DetailAsync(trip.Id);
    }

    // FR24: đổi tài xế hoặc đổi kho đến nhận hàng, chỉ khi tài xế chưa đến kho
    public async Task<TripDto> ReassignAsync(Guid userId, Guid tripId, ReassignTripRequest request)
    {
        await GetDispatcherAsync(userId);

        if (request.DriverId is null && string.IsNullOrWhiteSpace(request.WarehouseCode))
            throw new AppException("Vui lòng chọn tài xế mới hoặc kho mới", 400);

        var trip = await _trips.GetTrackedAsync(tripId)
                   ?? throw new AppException("Không tìm thấy chuyến", 404);
        if (trip.Status != TripStatus.Assigned)
            throw new AppException("Chỉ đổi được chuyến mà tài xế chưa đến kho. Chuyến đã chạy thì hủy hoặc chờ hoàn thành.", 409);

        if (request.DriverId.HasValue && request.DriverId.Value != trip.DriverId)
        {
            var driver = await GetIdleDriverAsync(request.DriverId.Value);
            trip.DriverId = driver.Id;
            trip.Driver = driver;
            trip.VehiclePlate = driver.VehiclePlate!;
            trip.CapacityKg = driver.VehicleCapacityKg!.Value;
        }

        if (!string.IsNullOrWhiteSpace(request.WarehouseCode))
        {
            var warehouse = await FindActiveWarehouseAsync(request.WarehouseCode);
            trip.PickupWarehouseId = warehouse.Id;
            trip.Pickup = warehouse;
            trip.NextWarehouseId = warehouse.Id;
            trip.Next = warehouse;
        }

        await _trips.SaveAsync();
        return await DetailAsync(trip.Id);
    }

    // Hủy chuyến: chỉ khi chưa chở bao nào
    public async Task<TripDto> CancelAsync(Guid userId, Guid tripId)
    {
        await GetDispatcherAsync(userId);

        var trip = await _trips.GetTrackedAsync(tripId)
                   ?? throw new AppException("Không tìm thấy chuyến", 404);

        var cancellable = trip.Status == TripStatus.Assigned
                          || (trip.Status == TripStatus.AtWarehouse && trip.Bundles.Count == 0);
        if (!cancellable)
            throw new AppException("Chỉ hủy được chuyến chưa chở bao nào", 409);

        trip.Status = TripStatus.Cancelled;
        trip.CancelledAt = DateTime.UtcNow;
        trip.NextWarehouseId = null;
        trip.Next = null;

        await _trips.SaveAsync();
        return await DetailAsync(trip.Id);
    }

    // FR26: việc chờ quá lâu mà chưa ai nhận
    public async Task<StaleReportDto> GetStaleAsync(Guid userId)
    {
        await GetDispatcherAsync(userId);

        var now = DateTime.UtcNow;
        var items = await _trips.GetStaleItemsAsync(
            now.AddHours(-_pendingPickupHours),
            now.AddHours(-_unclaimedDeliveryHours),
            now.AddHours(-_unloadedBundleHours),
            now.AddHours(-_assignedTripHours));

        return new StaleReportDto
        {
            PendingPickupHours = _pendingPickupHours,
            UnclaimedDeliveryHours = _unclaimedDeliveryHours,
            UnloadedBundleHours = _unloadedBundleHours,
            AssignedTripHours = _assignedTripHours,
            Items = items.OrderBy(i => i.Since).Select(i => new StaleItemDto
            {
                Kind = i.Kind, Id = i.Id, Code = i.Code, Text = i.Text, Since = i.Since, WarehouseCode = i.WarehouseCode,
            }).ToList(),
        };
    }

    // ================= XEM CHUYẾN (FR20, FR25) =================

    public async Task<PagedResult<TripDto>> ListAsync(Guid viewerId, string? status, string? search, int page, int pageSize)
    {
        var viewer = await GetUserAsync(viewerId);
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var filter = new TripFilter { Search = search?.Trim(), Page = page, PageSize = pageSize };

        switch (viewer.Role)
        {
            case UserRole.Admin:
            case UserRole.Dispatcher:
                break;
            case UserRole.Driver:
                filter.DriverId = viewer.Id;
                break;
            case UserRole.Warehouse:
                if (viewer.WarehouseId is null)
                    throw new AppException("Tài khoản của bạn chưa được gán kho", 403);
                filter.WarehouseId = viewer.WarehouseId;
                break;
            default:
                throw new AppException("Bạn không có quyền xem chuyến vận chuyển", 403);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            if (status.Trim().ToLowerInvariant() == "active")
            {
                filter.ActiveOnly = true;
            }
            else
            {
                if (!Enum.TryParse<TripStatus>(status.Replace("_", ""), ignoreCase: true, out var st) || !Enum.IsDefined(st))
                    throw new AppException("Trạng thái chuyến không hợp lệ", 400);
                filter.Status = st;
            }
        }

        var (items, total) = await _trips.SearchAsync(filter);
        return new PagedResult<TripDto>
        {
            Items = items.Select(t => ToDto(t, detail: false)).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize,
        };
    }

    public async Task<TripDto> GetAsync(Guid viewerId, Guid tripId)
    {
        var viewer = await GetUserAsync(viewerId);
        var trip = await _trips.GetDetailAsync(tripId)
                   ?? throw new AppException("Không tìm thấy chuyến", 404);
        if (!CanView(viewer, trip))
            throw new AppException("Không tìm thấy chuyến", 404);
        return ToDto(trip, detail: true);
    }

    // ================= TÀI XẾ =================

    // Chuyến đang chạy của tài xế (FR42), null nếu đang rảnh
    public async Task<TripDto?> GetCurrentAsync(Guid driverId)
    {
        await GetDriverAsync(driverId);
        var active = await _trips.GetActiveForDriverAsync(driverId);
        return active is null ? null : await DetailAsync(active.Id);
    }

    // FR43, FR45: xác nhận đã đến kho
    public async Task<TripDto> ArriveAsync(Guid driverId, Guid tripId)
    {
        await GetDriverAsync(driverId);
        var trip = await GetOwnTripAsync(driverId, tripId);

        if (trip.Status != TripStatus.Assigned && trip.Status != TripStatus.InTransit)
            throw new AppException("Bạn đã xác nhận đã đến kho rồi, hãy chờ nhân viên kho xử lý", 409);
        if (trip.NextWarehouseId is null)
            throw new AppException("Chuyến chưa có kho cần đến", 409);

        trip.CurrentWarehouseId = trip.NextWarehouseId;
        trip.Current = trip.Next;
        trip.NextWarehouseId = null;
        trip.Next = null;
        trip.Status = TripStatus.AtWarehouse;
        trip.Stops.Add(new TripStop
        {
            TripId = trip.Id,
            WarehouseId = trip.CurrentWarehouseId!.Value,
            Seq = trip.Stops.Count + 1,
            ArrivedAt = DateTime.UtcNow,
        });

        await _trips.SaveAsync();
        return await DetailAsync(trip.Id);
    }

    // FR44, FR46, FR47: xác nhận đã thả và nhận đủ bao ở kho này, xuất phát đến kho kế tiếp
    public async Task<TripDto> DepartAsync(Guid driverId, Guid tripId)
    {
        await GetDriverAsync(driverId);
        var trip = await GetOwnTripAsync(driverId, tripId);

        if (trip.Status != TripStatus.AtWarehouse)
            throw new AppException("Chỉ xuất phát được khi đang ở kho", 409);

        var onTruck = OnTruck(trip);
        var waiting = onTruck.Count(b => b.DestinationWarehouseId == trip.CurrentWarehouseId);
        if (waiting > 0)
            throw new AppException(
                $"Còn {waiting} bao đi kho này chưa được kho nhận. Hãy để nhân viên kho nhận hoặc chốt nhận hàng trước khi xuất phát", 409);
        if (onTruck.Count == 0)
            throw new AppException("Xe chưa có bao nào để chở. Nếu đã giao hết hãy hoàn thành chuyến", 409);

        // Kho kế tiếp: kho đích của bao lên xe sớm nhất còn trên xe
        var next = onTruck.OrderBy(b => b.LoadSeq).First();
        var now = DateTime.UtcNow;

        trip.NextWarehouseId = next.DestinationWarehouseId;
        trip.Next = next.Destination;
        trip.Status = TripStatus.InTransit;
        trip.StartedAt ??= now;
        var stop = CurrentStop(trip);
        if (stop is not null) stop.DepartedAt = now;

        await _trips.SaveAsync();
        return await DetailAsync(trip.Id);
    }

    // FR48: xe hết bao thì hoàn thành chuyến
    public async Task<TripDto> CompleteAsync(Guid driverId, Guid tripId)
    {
        await GetDriverAsync(driverId);
        var trip = await GetOwnTripAsync(driverId, tripId);

        if (trip.Status != TripStatus.AtWarehouse)
            throw new AppException("Chỉ hoàn thành được chuyến khi đang ở kho", 409);
        var left = OnTruck(trip).Count;
        if (left > 0)
            throw new AppException($"Xe còn {left} bao chưa giao, chưa hoàn thành chuyến được", 409);
        if (trip.StartedAt is null)
            throw new AppException("Chuyến chưa chở bao nào. Hãy nhờ điều phối viên hủy chuyến nếu không cần chạy nữa", 409);

        var now = DateTime.UtcNow;
        trip.Status = TripStatus.Completed;
        trip.CompletedAt = now;
        var stop = CurrentStop(trip);
        if (stop is not null) stop.DepartedAt = now;

        await _trips.SaveAsync();
        return await DetailAsync(trip.Id);
    }

    // ================= NHÂN VIÊN KHO =================

    public async Task<WarehouseTripsDto> GetForWarehouseAsync(Guid staffId)
    {
        var staff = await GetStaffAsync(staffId);
        var trips = await _trips.GetTripsForWarehouseAsync(staff.WarehouseId!.Value);

        return new WarehouseTripsDto
        {
            AtWarehouse = trips
                .Where(t => t.Status == TripStatus.AtWarehouse && t.CurrentWarehouseId == staff.WarehouseId)
                .Select(t => ToDto(t, detail: false)).ToList(),
            Incoming = trips
                .Where(t => t.Status != TripStatus.AtWarehouse)
                .Select(t => ToDto(t, detail: false)).ToList(),
        };
    }

    // FR35, FR36: lên hàng. Quét mã bao đã đóng để xếp lên xe, kiểm tra xe còn chỗ.
    public async Task<TripDto> LoadBundleAsync(Guid staffId, Guid tripId, string bundleCode)
    {
        var staff = await GetStaffAsync(staffId);
        var trip = await GetStaffTripAsync(staff, tripId);

        var code = NormalizeCode(bundleCode);
        var bundle = await _bundles.GetTrackedByCodeAsync(code)
                     ?? throw new AppException($"Không tìm thấy bao {code}", 404);

        if (bundle.CurrentWarehouseId != staff.WarehouseId)
            throw new AppException($"Bao {code} không nằm trong kho của bạn", 403);

        if (bundle.Status != BundleStatus.Sealed)
        {
            var reason = bundle.Status switch
            {
                BundleStatus.Open => "chưa đóng bao",
                BundleStatus.InTransit => "đang trên một chuyến vận chuyển",
                BundleStatus.Received => "đã đến kho đích, cần mở bao",
                BundleStatus.Opened => "đã được mở",
                BundleStatus.Missing => "đã được báo thất lạc",
                BundleStatus.Cancelled => "đã bị hủy",
                _ => "không ở trạng thái đã đóng bao",
            };
            throw new AppException($"Không lên xe được: bao {code} {reason}", 409);
        }

        // FR36: xe còn chỗ thì mới xếp thêm
        var load = OnTruck(trip).Sum(b => b.TotalWeightKg);
        if (load + bundle.TotalWeightKg > trip.CapacityKg)
            throw new AppException(
                $"Xe không đủ tải: đang chở {load} kg, bao này {bundle.TotalWeightKg} kg, tải tối đa {trip.CapacityKg} kg", 409);

        var now = DateTime.UtcNow;
        bundle.Status = BundleStatus.InTransit;
        bundle.TripId = trip.Id;
        bundle.LoadSeq = trip.Bundles.Select(b => b.LoadSeq).DefaultIfEmpty(0).Max() + 1;
        bundle.LoadedAt = now;
        bundle.LoadedAtWarehouseId = staff.WarehouseId;
        trip.Bundles.Add(bundle);

        foreach (var order in bundle.Orders)
        {
            order.Status = OrderStatus.InTransit;
            order.CurrentWarehouseId = null;   // hàng đã rời kho
            order.UpdatedAt = now;
            AddHistory(order, OrderStatus.InTransit,
                $"Đã lên xe chuyến {trip.Code} (bao {bundle.Code}, đi kho {bundle.Destination?.Code})", staffId);
        }

        await _trips.SaveAsync();
        return await DetailAsync(trip.Id);
    }

    // Gỡ bao vừa xếp nhầm xuống khỏi xe, chỉ khi xe chưa rời kho này
    public async Task<TripDto> UnloadBundleAsync(Guid staffId, Guid tripId, Guid bundleId)
    {
        var staff = await GetStaffAsync(staffId);
        var trip = await GetStaffTripAsync(staff, tripId);

        var bundle = trip.Bundles.FirstOrDefault(b => b.Id == bundleId)
                     ?? throw new AppException("Bao này không có trên xe", 404);

        var arrivedAt = CurrentStop(trip)?.ArrivedAt ?? DateTime.MinValue;
        var loadedHere = bundle.Status == BundleStatus.InTransit
                         && bundle.LoadedAtWarehouseId == staff.WarehouseId
                         && bundle.LoadedAt >= arrivedAt;
        if (!loadedHere)
            throw new AppException("Chỉ gỡ được bao vừa xếp lên xe tại kho này", 409);

        var now = DateTime.UtcNow;
        bundle.Status = BundleStatus.Sealed;
        bundle.TripId = null;
        bundle.LoadSeq = 0;
        bundle.LoadedAt = null;
        bundle.LoadedAtWarehouseId = null;
        trip.Bundles.Remove(bundle);

        foreach (var order in bundle.Orders)
        {
            order.Status = OrderStatus.Bundled;
            order.CurrentWarehouseId = staff.WarehouseId;
            order.UpdatedAt = now;
            AddHistory(order, OrderStatus.Bundled, $"Bao {bundle.Code} được gỡ khỏi xe chuyến {trip.Code}, trở lại kho", staffId);
        }

        await _trips.SaveAsync();
        return await DetailAsync(trip.Id);
    }

    // FR30, FR37: kho đích quét mã bao để nhận bao từ xe
    public async Task<TripDto> ReceiveBundleAsync(Guid staffId, Guid tripId, string bundleCode)
    {
        var staff = await GetStaffAsync(staffId);
        var trip = await GetStaffTripAsync(staff, tripId);

        var stop = CurrentStop(trip);
        if (stop?.ReceiveFinishedAt is not null)
            throw new AppException("Kho đã chốt nhận hàng ở lần dừng này, không nhận thêm được", 409);

        var code = NormalizeCode(bundleCode);
        var bundle = trip.Bundles.FirstOrDefault(b => b.Code == code)
                     ?? throw new AppException(
                         $"Bao {code} không có trong phiếu chuyển của chuyến này. Nếu thấy bao lạ trên xe, hãy dùng \"Báo thừa\".", 404);

        if (bundle.Status == BundleStatus.Received || bundle.Status == BundleStatus.Opened)
            throw new AppException($"Bao {code} đã được nhận rồi", 409);
        if (bundle.Status != BundleStatus.InTransit)
            throw new AppException($"Bao {code} không còn trên xe (đã được báo thất lạc)", 409);
        if (bundle.DestinationWarehouseId != staff.WarehouseId)
            throw new AppException($"Bao {code} đi kho {bundle.Destination?.Code}, hãy để nguyên trên xe", 409);

        var now = DateTime.UtcNow;
        bundle.Status = BundleStatus.Received;
        bundle.CurrentWarehouseId = staff.WarehouseId!.Value;
        bundle.ReceivedAt = now;

        foreach (var order in bundle.Orders)
        {
            order.Status = OrderStatus.Bundled;
            order.CurrentWarehouseId = staff.WarehouseId;
            order.UpdatedAt = now;
            AddHistory(order, OrderStatus.Bundled,
                $"Đã đến kho {bundle.Destination?.Code} trong bao {bundle.Code} (chuyến {trip.Code}), chờ mở bao", staffId);
        }

        await _trips.SaveAsync();
        return await DetailAsync(trip.Id);
    }

    // FR38: chốt nhận hàng. Bao đi kho này mà không quét được thì ghi nhận là thiếu.
    public async Task<TripDto> FinishReceivingAsync(Guid staffId, Guid tripId, string? note)
    {
        var staff = await GetStaffAsync(staffId);
        var trip = await GetStaffTripAsync(staff, tripId);

        var stop = CurrentStop(trip) ?? throw new AppException("Chuyến chưa có điểm dừng nào", 409);
        if (stop.ReceiveFinishedAt is not null)
            throw new AppException("Kho đã chốt nhận hàng ở lần dừng này rồi", 409);

        var now = DateTime.UtcNow;
        var cleanNote = Clean(note);

        foreach (var bundle in OnTruck(trip).Where(b => b.DestinationWarehouseId == staff.WarehouseId).ToList())
        {
            bundle.Status = BundleStatus.Missing;
            trip.Discrepancies.Add(new TripDiscrepancy
            {
                TripId = trip.Id,
                WarehouseId = staff.WarehouseId!.Value,
                Type = DiscrepancyType.Missing,
                BundleId = bundle.Id,
                BundleCode = bundle.Code,
                Note = cleanNote,
                ReportedById = staffId,
            });

            foreach (var order in bundle.Orders)
            {
                order.UpdatedAt = now;
                AddHistory(order, OrderStatus.InTransit,
                    $"Bao {bundle.Code} bị báo thiếu khi đến kho {bundle.Destination?.Code} (chuyến {trip.Code})", staffId);
            }
        }

        stop.ReceiveFinishedAt = now;

        await _trips.SaveAsync();
        return await DetailAsync(trip.Id);
    }

    // FR38: ghi nhận bao thừa (thấy trên xe nhưng không có trong phiếu chuyển)
    public async Task<TripDto> ReportExtraAsync(Guid staffId, Guid tripId, string bundleCode, string? note)
    {
        var staff = await GetStaffAsync(staffId);
        var trip = await GetStaffTripAsync(staff, tripId);

        var code = NormalizeCode(bundleCode);
        var known = trip.Bundles.FirstOrDefault(b => b.Code == code);
        if (known is not null)
            throw new AppException($"Bao {code} có trong phiếu chuyển của chuyến này (đi kho {known.Destination?.Code}), không phải bao thừa", 409);

        trip.Discrepancies.Add(new TripDiscrepancy
        {
            TripId = trip.Id,
            WarehouseId = staff.WarehouseId!.Value,
            Type = DiscrepancyType.Extra,
            BundleCode = code,
            Note = Clean(note),
            ReportedById = staffId,
        });

        await _trips.SaveAsync();
        return await DetailAsync(trip.Id);
    }

    // ================= helpers =================

    private async Task<User> GetUserAsync(Guid id) =>
        await _users.GetByIdAsync(id) ?? throw new AppException("Tài khoản không tồn tại", 401);

    private async Task<User> GetDispatcherAsync(Guid id)
    {
        var user = await GetUserAsync(id);
        if (user.Role != UserRole.Dispatcher && user.Role != UserRole.Admin)
            throw new AppException("Chỉ Điều phối viên hoặc Admin mới điều phối chuyến được", 403);
        return user;
    }

    private async Task<User> GetDriverAsync(Guid id)
    {
        var user = await GetUserAsync(id);
        if (user.Role != UserRole.Driver)
            throw new AppException("Chỉ tài xế mới thao tác được chuyến của mình", 403);
        return user;
    }

    private async Task<User> GetStaffAsync(Guid id)
    {
        var user = await GetUserAsync(id);
        if (user.Role != UserRole.Warehouse || user.WarehouseId is null)
            throw new AppException("Chỉ nhân viên kho đã được gán kho mới thao tác được với xe", 403);
        return user;
    }

    private static bool HasVehicle(User d) =>
        !string.IsNullOrWhiteSpace(d.VehiclePlate) && d.VehicleCapacityKg is > 0;

    // Tài xế phải đang hoạt động, có xe và đang rảnh
    private async Task<User> GetIdleDriverAsync(Guid driverId)
    {
        var driver = await _users.GetByIdAsync(driverId);
        if (driver is null || driver.Role != UserRole.Driver)
            throw new AppException("Không tìm thấy tài xế", 404);
        if (!driver.IsActive)
            throw new AppException("Tài khoản tài xế đang bị khóa", 409);
        if (!HasVehicle(driver))
            throw new AppException($"Tài xế {driver.FullName} chưa có thông tin xe (biển số, tải trọng). Hãy nhờ Admin cập nhật hồ sơ tài xế", 400);
        if (await _trips.GetActiveForDriverAsync(driver.Id) is not null)
            throw new AppException($"Tài xế {driver.FullName} đang có chuyến chưa hoàn thành", 409);
        return driver;
    }

    private async Task<Warehouse> FindActiveWarehouseAsync(string code)
    {
        var normalized = (code ?? string.Empty).Trim().ToUpperInvariant();
        var all = await _warehouses.GetActiveAsync();
        return all.FirstOrDefault(w => w.Code.ToUpperInvariant() == normalized)
               ?? throw new AppException($"Không tìm thấy kho có mã {normalized} (hoặc kho đã ngừng hoạt động)", 404);
    }

    private async Task<Trip> GetOwnTripAsync(Guid driverId, Guid tripId)
    {
        var trip = await _trips.GetTrackedAsync(tripId)
                   ?? throw new AppException("Không tìm thấy chuyến", 404);
        if (trip.DriverId != driverId)
            throw new AppException("Đây không phải chuyến của bạn", 403);
        return trip;
    }

    // Xe phải đang đỗ ở kho của nhân viên thì mới thao tác được
    private async Task<Trip> GetStaffTripAsync(User staff, Guid tripId)
    {
        var trip = await _trips.GetTrackedAsync(tripId)
                   ?? throw new AppException("Không tìm thấy chuyến", 404);
        if (trip.Status != TripStatus.AtWarehouse)
            throw new AppException("Xe chưa đến kho hoặc đã rời kho, không thao tác được", 409);
        if (trip.CurrentWarehouseId != staff.WarehouseId)
            throw new AppException("Xe này đang ở kho khác", 403);
        return trip;
    }

    private async Task<TripDto> DetailAsync(Guid tripId)
    {
        var trip = await _trips.GetDetailAsync(tripId)
                   ?? throw new AppException("Không tìm thấy chuyến", 404);
        return ToDto(trip, detail: true);
    }

    private static List<Bundle> OnTruck(Trip trip) =>
        trip.Bundles.Where(b => b.Status == BundleStatus.InTransit).ToList();

    private static TripStop? CurrentStop(Trip trip) =>
        trip.Stops.OrderBy(s => s.Seq).LastOrDefault();

    private static bool Involves(Trip t, Guid w) =>
        t.PickupWarehouseId == w || t.CurrentWarehouseId == w || t.NextWarehouseId == w
        || t.Stops.Any(s => s.WarehouseId == w)
        || t.Bundles.Any(b => b.DestinationWarehouseId == w || b.OriginWarehouseId == w || b.LoadedAtWarehouseId == w);

    private static bool CanView(User viewer, Trip trip) => viewer.Role switch
    {
        UserRole.Admin or UserRole.Dispatcher => true,
        UserRole.Driver => trip.DriverId == viewer.Id,
        UserRole.Warehouse => viewer.WarehouseId.HasValue && Involves(trip, viewer.WarehouseId.Value),
        _ => false,
    };

    private void AddHistory(Order order, OrderStatus status, string note, Guid actorId) =>
        _orders.AddHistory(new OrderStatusHistory
        {
            OrderId = order.Id,
            Status = status,
            Note = note,
            ActorUserId = actorId,
        });

    private static string NormalizeCode(string? code) => (code ?? string.Empty).Trim().ToUpperInvariant();

    private static string? Clean(string? text) => string.IsNullOrWhiteSpace(text) ? null : text.Trim();

    // TripStatus.AtWarehouse -> "at_warehouse"
    private static string StatusKey<T>(T status) where T : Enum =>
        Regex.Replace(status.ToString(), "(?<!^)([A-Z])", "_$1").ToLowerInvariant();

    private static TripDto ToDto(Trip t, bool detail)
    {
        var onTruck = OnTruck(t);
        var load = onTruck.Sum(b => b.TotalWeightKg);

        var dto = new TripDto
        {
            Id = t.Id,
            Code = t.Code,
            Status = StatusKey(t.Status),
            DriverId = t.DriverId,
            DriverName = t.Driver?.FullName ?? string.Empty,
            DriverPhone = t.Driver?.Phone ?? string.Empty,
            VehiclePlate = t.VehiclePlate,
            CapacityKg = t.CapacityKg,
            LoadKg = load,
            FreeKg = Math.Max(0, t.CapacityKg - load),
            PickupCode = t.Pickup?.Code ?? string.Empty,
            PickupName = t.Pickup?.Name ?? string.Empty,
            CurrentWarehouseId = t.CurrentWarehouseId,
            CurrentCode = t.Current?.Code,
            CurrentName = t.Current?.Name,
            NextWarehouseId = t.NextWarehouseId,
            NextCode = t.Next?.Code,
            NextName = t.Next?.Name,
            Note = t.Note,
            CreatedAt = t.CreatedAt,
            StartedAt = t.StartedAt,
            CompletedAt = t.CompletedAt,
            BundlesOnTruck = onTruck.Count,
            BundlesReceived = t.Bundles.Count(b => b.Status == BundleStatus.Received || b.Status == BundleStatus.Opened),
            BundlesMissing = t.Bundles.Count(b => b.Status == BundleStatus.Missing),
            AwaitingHere = t.Status == TripStatus.AtWarehouse && t.CurrentWarehouseId.HasValue
                ? onTruck.Count(b => b.DestinationWarehouseId == t.CurrentWarehouseId)
                : 0,
        };

        if (!detail) return dto;

        dto.Bundles = t.Bundles.OrderBy(b => b.LoadSeq).Select(b => new TripBundleDto
        {
            Id = b.Id,
            Code = b.Code,
            Status = StatusKey(b.Status),
            LoadedAtCode = b.LoadedAtWarehouse?.Code ?? string.Empty,
            DestinationCode = b.Destination?.Code ?? string.Empty,
            DestinationName = b.Destination?.Name ?? string.Empty,
            OrderCount = b.OrderCount,
            TotalWeightKg = b.TotalWeightKg,
            LoadSeq = b.LoadSeq,
            LoadedAt = b.LoadedAt,
            ReceivedAt = b.ReceivedAt,
        }).ToList();

        dto.Stops = t.Stops.OrderBy(s => s.Seq).Select(s => new TripStopDto
        {
            Seq = s.Seq,
            WarehouseCode = s.Warehouse?.Code ?? string.Empty,
            WarehouseName = s.Warehouse?.Name ?? string.Empty,
            ArrivedAt = s.ArrivedAt,
            DepartedAt = s.DepartedAt,
            ReceiveFinishedAt = s.ReceiveFinishedAt,
        }).ToList();

        dto.Discrepancies = t.Discrepancies.OrderBy(d => d.CreatedAt).Select(d => new TripDiscrepancyDto
        {
            Id = d.Id,
            Type = d.Type.ToString().ToLowerInvariant(),
            WarehouseCode = d.Warehouse?.Code ?? string.Empty,
            BundleCode = d.BundleCode,
            Note = d.Note,
            ReportedByName = d.ReportedBy?.FullName,
            CreatedAt = d.CreatedAt,
        }).ToList();

        return dto;
    }
}

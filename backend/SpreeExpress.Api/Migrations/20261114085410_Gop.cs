using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SpreeExpress.Api.Migrations
{
    /// <inheritdoc />
    public partial class Gop : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateSequence(
                name: "trip_code_seq");

            migrationBuilder.AddColumn<decimal>(
                name: "VehicleCapacityKg",
                table: "users",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VehiclePlate",
                table: "users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Code",
                table: "orders",
                type: "character varying(60)",
                maxLength: 60,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(30)",
                oldMaxLength: 30);

            migrationBuilder.AddColumn<Guid>(
                name: "DestinationWarehouseId",
                table: "orders",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LoadSeq",
                table: "bundles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "LoadedAt",
                table: "bundles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "LoadedAtWarehouseId",
                table: "bundles",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "OpenedAt",
                table: "bundles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReceivedAt",
                table: "bundles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "TripId",
                table: "bundles",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "trips",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    DriverId = table.Column<Guid>(type: "uuid", nullable: false),
                    VehiclePlate = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CapacityKg = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PickupWarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    CurrentWarehouseId = table.Column<Guid>(type: "uuid", nullable: true),
                    NextWarehouseId = table.Column<Guid>(type: "uuid", nullable: true),
                    Note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_trips", x => x.Id);
                    table.ForeignKey(
                        name: "FK_trips_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_trips_users_DriverId",
                        column: x => x.DriverId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_trips_warehouses_CurrentWarehouseId",
                        column: x => x.CurrentWarehouseId,
                        principalTable: "warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_trips_warehouses_NextWarehouseId",
                        column: x => x.NextWarehouseId,
                        principalTable: "warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_trips_warehouses_PickupWarehouseId",
                        column: x => x.PickupWarehouseId,
                        principalTable: "warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "trip_discrepancies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TripId = table.Column<Guid>(type: "uuid", nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    BundleId = table.Column<Guid>(type: "uuid", nullable: true),
                    BundleCode = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ReportedById = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_trip_discrepancies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_trip_discrepancies_trips_TripId",
                        column: x => x.TripId,
                        principalTable: "trips",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_trip_discrepancies_users_ReportedById",
                        column: x => x.ReportedById,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_trip_discrepancies_warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "trip_stops",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TripId = table.Column<Guid>(type: "uuid", nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    Seq = table.Column<int>(type: "integer", nullable: false),
                    ArrivedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DepartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReceiveFinishedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_trip_stops", x => x.Id);
                    table.ForeignKey(
                        name: "FK_trip_stops_trips_TripId",
                        column: x => x.TripId,
                        principalTable: "trips",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_trip_stops_warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_orders_DestinationWarehouseId_Status",
                table: "orders",
                columns: new[] { "DestinationWarehouseId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_bundles_LoadedAtWarehouseId",
                table: "bundles",
                column: "LoadedAtWarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_bundles_TripId",
                table: "bundles",
                column: "TripId");

            migrationBuilder.CreateIndex(
                name: "IX_trip_discrepancies_ReportedById",
                table: "trip_discrepancies",
                column: "ReportedById");

            migrationBuilder.CreateIndex(
                name: "IX_trip_discrepancies_TripId",
                table: "trip_discrepancies",
                column: "TripId");

            migrationBuilder.CreateIndex(
                name: "IX_trip_discrepancies_WarehouseId",
                table: "trip_discrepancies",
                column: "WarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_trip_stops_TripId_Seq",
                table: "trip_stops",
                columns: new[] { "TripId", "Seq" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_trip_stops_WarehouseId",
                table: "trip_stops",
                column: "WarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_trips_Code",
                table: "trips",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_trips_CreatedById",
                table: "trips",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_trips_CurrentWarehouseId",
                table: "trips",
                column: "CurrentWarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_trips_DriverId_Status",
                table: "trips",
                columns: new[] { "DriverId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_trips_NextWarehouseId",
                table: "trips",
                column: "NextWarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_trips_PickupWarehouseId",
                table: "trips",
                column: "PickupWarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_trips_Status",
                table: "trips",
                column: "Status");

            migrationBuilder.AddForeignKey(
                name: "FK_bundles_trips_TripId",
                table: "bundles",
                column: "TripId",
                principalTable: "trips",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_bundles_warehouses_LoadedAtWarehouseId",
                table: "bundles",
                column: "LoadedAtWarehouseId",
                principalTable: "warehouses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_orders_warehouses_DestinationWarehouseId",
                table: "orders",
                column: "DestinationWarehouseId",
                principalTable: "warehouses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_bundles_trips_TripId",
                table: "bundles");

            migrationBuilder.DropForeignKey(
                name: "FK_bundles_warehouses_LoadedAtWarehouseId",
                table: "bundles");

            migrationBuilder.DropForeignKey(
                name: "FK_orders_warehouses_DestinationWarehouseId",
                table: "orders");

            migrationBuilder.DropTable(
                name: "trip_discrepancies");

            migrationBuilder.DropTable(
                name: "trip_stops");

            migrationBuilder.DropTable(
                name: "trips");

            migrationBuilder.DropIndex(
                name: "IX_orders_DestinationWarehouseId_Status",
                table: "orders");

            migrationBuilder.DropIndex(
                name: "IX_bundles_LoadedAtWarehouseId",
                table: "bundles");

            migrationBuilder.DropIndex(
                name: "IX_bundles_TripId",
                table: "bundles");

            migrationBuilder.DropColumn(
                name: "VehicleCapacityKg",
                table: "users");

            migrationBuilder.DropColumn(
                name: "VehiclePlate",
                table: "users");

            migrationBuilder.DropColumn(
                name: "DestinationWarehouseId",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "LoadSeq",
                table: "bundles");

            migrationBuilder.DropColumn(
                name: "LoadedAt",
                table: "bundles");

            migrationBuilder.DropColumn(
                name: "LoadedAtWarehouseId",
                table: "bundles");

            migrationBuilder.DropColumn(
                name: "OpenedAt",
                table: "bundles");

            migrationBuilder.DropColumn(
                name: "ReceivedAt",
                table: "bundles");

            migrationBuilder.DropColumn(
                name: "TripId",
                table: "bundles");

            migrationBuilder.DropSequence(
                name: "trip_code_seq");

            migrationBuilder.AlterColumn<string>(
                name: "Code",
                table: "orders",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(60)",
                oldMaxLength: 60);
        }
    }
}

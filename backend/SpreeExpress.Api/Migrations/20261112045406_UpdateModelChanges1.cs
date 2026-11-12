using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SpreeExpress.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateModelChanges1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateSequence(
                name: "bundle_code_seq");

            migrationBuilder.AddColumn<Guid>(
                name: "BundleId",
                table: "orders",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "bundles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    OriginWarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    CurrentWarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    DestinationWarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    OrderCount = table.Column<int>(type: "integer", nullable: false),
                    TotalWeightKg = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    TotalPieces = table.Column<int>(type: "integer", nullable: false),
                    Note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: false),
                    SealedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bundles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_bundles_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_bundles_warehouses_CurrentWarehouseId",
                        column: x => x.CurrentWarehouseId,
                        principalTable: "warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_bundles_warehouses_DestinationWarehouseId",
                        column: x => x.DestinationWarehouseId,
                        principalTable: "warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_bundles_warehouses_OriginWarehouseId",
                        column: x => x.OriginWarehouseId,
                        principalTable: "warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_orders_BundleId",
                table: "orders",
                column: "BundleId");

            migrationBuilder.CreateIndex(
                name: "IX_bundles_Code",
                table: "bundles",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_bundles_CreatedById",
                table: "bundles",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_bundles_CurrentWarehouseId_Status",
                table: "bundles",
                columns: new[] { "CurrentWarehouseId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_bundles_DestinationWarehouseId",
                table: "bundles",
                column: "DestinationWarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_bundles_OriginWarehouseId",
                table: "bundles",
                column: "OriginWarehouseId");

            migrationBuilder.AddForeignKey(
                name: "FK_orders_bundles_BundleId",
                table: "orders",
                column: "BundleId",
                principalTable: "bundles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_orders_bundles_BundleId",
                table: "orders");

            migrationBuilder.DropTable(
                name: "bundles");

            migrationBuilder.DropIndex(
                name: "IX_orders_BundleId",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "BundleId",
                table: "orders");

            migrationBuilder.DropSequence(
                name: "bundle_code_seq");
        }
    }
}

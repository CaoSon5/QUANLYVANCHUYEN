using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SpreeExpress.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWarehouseReceiving : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CurrentWarehouseId",
                table: "orders",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReceivedAt",
                table: "orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReceivedQuantity",
                table: "orders",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_orders_CurrentWarehouseId_Status",
                table: "orders",
                columns: new[] { "CurrentWarehouseId", "Status" });

            migrationBuilder.AddForeignKey(
                name: "FK_orders_warehouses_CurrentWarehouseId",
                table: "orders",
                column: "CurrentWarehouseId",
                principalTable: "warehouses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_orders_warehouses_CurrentWarehouseId",
                table: "orders");

            migrationBuilder.DropIndex(
                name: "IX_orders_CurrentWarehouseId_Status",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "CurrentWarehouseId",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "ReceivedAt",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "ReceivedQuantity",
                table: "orders");
        }
    }
}

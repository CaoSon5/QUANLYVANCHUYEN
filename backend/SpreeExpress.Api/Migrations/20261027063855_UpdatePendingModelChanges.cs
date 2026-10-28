using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SpreeExpress.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePendingModelChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DeliveryAcceptedAt",
                table: "orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeliveryShipperId",
                table: "orders",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DispatchedAt",
                table: "orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_orders_DeliveryShipperId",
                table: "orders",
                column: "DeliveryShipperId");

            migrationBuilder.AddForeignKey(
                name: "FK_orders_users_DeliveryShipperId",
                table: "orders",
                column: "DeliveryShipperId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_orders_users_DeliveryShipperId",
                table: "orders");

            migrationBuilder.DropIndex(
                name: "IX_orders_DeliveryShipperId",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "DeliveryAcceptedAt",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "DeliveryShipperId",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "DispatchedAt",
                table: "orders");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SpreeExpress.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateModelChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateSequence(
                name: "remittance_code_seq");

            migrationBuilder.CreateSequence(
                name: "settlement_code_seq");

            migrationBuilder.AddColumn<Guid>(
                name: "CodRemittanceId",
                table: "orders",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReturnConfirmedAt",
                table: "orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReturnedAt",
                table: "orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SettlementId",
                table: "orders",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "cod_remittances",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ShipperId = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderCount = table.Column<int>(type: "integer", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    ReceivedAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ConfirmNote = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ConfirmedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ConfirmedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cod_remittances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_cod_remittances_users_ConfirmedById",
                        column: x => x.ConfirmedById,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_cod_remittances_users_ShipperId",
                        column: x => x.ShipperId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "settlements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    SellerId = table.Column<Guid>(type: "uuid", nullable: false),
                    PeriodFrom = table.Column<DateOnly>(type: "date", nullable: false),
                    PeriodTo = table.Column<DateOnly>(type: "date", nullable: false),
                    OrderCount = table.Column<int>(type: "integer", nullable: false),
                    GrossCod = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    TotalShippingFee = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    TotalAdjustments = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    NetAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    PaidAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PaidById = table.Column<Guid>(type: "uuid", nullable: true),
                    PaymentRef = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_settlements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_settlements_users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_settlements_users_PaidById",
                        column: x => x.PaidById,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_settlements_users_SellerId",
                        column: x => x.SellerId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "settlement_adjustments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SettlementId = table.Column<Guid>(type: "uuid", nullable: false),
                    Description = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_settlement_adjustments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_settlement_adjustments_settlements_SettlementId",
                        column: x => x.SettlementId,
                        principalTable: "settlements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_orders_CodRemittanceId",
                table: "orders",
                column: "CodRemittanceId");

            migrationBuilder.CreateIndex(
                name: "IX_orders_SettlementId",
                table: "orders",
                column: "SettlementId");

            migrationBuilder.CreateIndex(
                name: "IX_cod_remittances_Code",
                table: "cod_remittances",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_cod_remittances_ConfirmedById",
                table: "cod_remittances",
                column: "ConfirmedById");

            migrationBuilder.CreateIndex(
                name: "IX_cod_remittances_ShipperId",
                table: "cod_remittances",
                column: "ShipperId");

            migrationBuilder.CreateIndex(
                name: "IX_cod_remittances_Status_CreatedAt",
                table: "cod_remittances",
                columns: new[] { "Status", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_settlement_adjustments_SettlementId",
                table: "settlement_adjustments",
                column: "SettlementId");

            migrationBuilder.CreateIndex(
                name: "IX_settlements_Code",
                table: "settlements",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_settlements_CreatedById",
                table: "settlements",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_settlements_PaidById",
                table: "settlements",
                column: "PaidById");

            migrationBuilder.CreateIndex(
                name: "IX_settlements_SellerId_CreatedAt",
                table: "settlements",
                columns: new[] { "SellerId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_settlements_Status",
                table: "settlements",
                column: "Status");

            migrationBuilder.AddForeignKey(
                name: "FK_orders_cod_remittances_CodRemittanceId",
                table: "orders",
                column: "CodRemittanceId",
                principalTable: "cod_remittances",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_orders_settlements_SettlementId",
                table: "orders",
                column: "SettlementId",
                principalTable: "settlements",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_orders_cod_remittances_CodRemittanceId",
                table: "orders");

            migrationBuilder.DropForeignKey(
                name: "FK_orders_settlements_SettlementId",
                table: "orders");

            migrationBuilder.DropTable(
                name: "cod_remittances");

            migrationBuilder.DropTable(
                name: "settlement_adjustments");

            migrationBuilder.DropTable(
                name: "settlements");

            migrationBuilder.DropIndex(
                name: "IX_orders_CodRemittanceId",
                table: "orders");

            migrationBuilder.DropIndex(
                name: "IX_orders_SettlementId",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "CodRemittanceId",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "ReturnConfirmedAt",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "ReturnedAt",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "SettlementId",
                table: "orders");

            migrationBuilder.DropSequence(
                name: "remittance_code_seq");

            migrationBuilder.DropSequence(
                name: "settlement_code_seq");
        }
    }
}

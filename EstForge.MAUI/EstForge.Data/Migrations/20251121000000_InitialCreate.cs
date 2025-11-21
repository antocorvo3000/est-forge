using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EstForge.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Azienda",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    RagioneSociale = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    PartitaIva = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    SedeLegale = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Telefono = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    LogoUrl = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    NumeroProgressivoIniziale = table.Column<int>(type: "INTEGER", nullable: false),
                    NumerazioneProgressivaAttiva = table.Column<bool>(type: "INTEGER", nullable: false),
                    FontSizeList = table.Column<string>(type: "TEXT", nullable: false),
                    FontSizeQuote = table.Column<string>(type: "TEXT", nullable: false),
                    FontSizeClient = table.Column<string>(type: "TEXT", nullable: false),
                    FontSizeSettings = table.Column<string>(type: "TEXT", nullable: false),
                    FontSizeCustomQuote = table.Column<string>(type: "TEXT", nullable: false),
                    FontSizeClone = table.Column<string>(type: "TEXT", nullable: false),
                    FontSizeEditNumber = table.Column<string>(type: "TEXT", nullable: false),
                    CreatoIl = table.Column<string>(type: "TEXT", nullable: false),
                    AggiornatoIl = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Azienda", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Clienti",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    NomeRagioneSociale = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    CodiceFiscalePIva = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    Via = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    Citta = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Provincia = table.Column<string>(type: "TEXT", maxLength: 10, nullable: true),
                    Cap = table.Column<string>(type: "TEXT", maxLength: 10, nullable: true),
                    Telefono = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    Email = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    CreatoIl = table.Column<string>(type: "TEXT", nullable: false),
                    AggiornatoIl = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clienti", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PreventiviCache",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Numero = table.Column<int>(type: "INTEGER", nullable: true),
                    Anno = table.Column<int>(type: "INTEGER", nullable: true),
                    ClienteId = table.Column<string>(type: "TEXT", nullable: true),
                    Oggetto = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    UbicazioneVia = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    UbicazioneCitta = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    UbicazioneProvincia = table.Column<string>(type: "TEXT", maxLength: 10, nullable: true),
                    UbicazioneCap = table.Column<string>(type: "TEXT", maxLength: 10, nullable: true),
                    Subtotale = table.Column<string>(type: "TEXT", nullable: false),
                    ScontoPercentuale = table.Column<string>(type: "TEXT", nullable: false),
                    ScontoValore = table.Column<string>(type: "TEXT", nullable: false),
                    Totale = table.Column<string>(type: "TEXT", nullable: false),
                    Note = table.Column<string>(type: "TEXT", nullable: true),
                    ModalitaPagamento = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Stato = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    TipoOperazione = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    PreventivoOriginaleId = table.Column<string>(type: "TEXT", nullable: true),
                    RigheJson = table.Column<string>(type: "TEXT", nullable: true),
                    DatiClienteJson = table.Column<string>(type: "TEXT", nullable: true),
                    CreatoIl = table.Column<string>(type: "TEXT", nullable: false),
                    AggiornatoIl = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PreventiviCache", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Preventivi",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Numero = table.Column<int>(type: "INTEGER", nullable: false),
                    Anno = table.Column<int>(type: "INTEGER", nullable: false),
                    ClienteId = table.Column<string>(type: "TEXT", nullable: true),
                    Oggetto = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    UbicazioneVia = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    UbicazioneCitta = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    UbicazioneProvincia = table.Column<string>(type: "TEXT", maxLength: 10, nullable: true),
                    UbicazioneCap = table.Column<string>(type: "TEXT", maxLength: 10, nullable: true),
                    Subtotale = table.Column<string>(type: "TEXT", nullable: false),
                    ScontoPercentuale = table.Column<string>(type: "TEXT", nullable: false),
                    ScontoValore = table.Column<string>(type: "TEXT", nullable: false),
                    Totale = table.Column<string>(type: "TEXT", nullable: false),
                    Note = table.Column<string>(type: "TEXT", nullable: true),
                    ModalitaPagamento = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Stato = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    CreatoIl = table.Column<string>(type: "TEXT", nullable: false),
                    AggiornatoIl = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Preventivi", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Preventivi_Clienti_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clienti",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "RighePreventivo",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    PreventivoId = table.Column<string>(type: "TEXT", nullable: false),
                    NumeroRiga = table.Column<int>(type: "INTEGER", nullable: false),
                    Descrizione = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    UnitaMisura = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Quantita = table.Column<string>(type: "TEXT", nullable: false),
                    PrezzoUnitario = table.Column<string>(type: "TEXT", nullable: false),
                    Totale = table.Column<string>(type: "TEXT", nullable: false),
                    CreatoIl = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RighePreventivo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RighePreventivo_Preventivi_PreventivoId",
                        column: x => x.PreventivoId,
                        principalTable: "Preventivi",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Preventivi_ClienteId",
                table: "Preventivi",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_RighePreventivo_PreventivoId",
                table: "RighePreventivo",
                column: "PreventivoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Azienda");

            migrationBuilder.DropTable(
                name: "PreventiviCache");

            migrationBuilder.DropTable(
                name: "RighePreventivo");

            migrationBuilder.DropTable(
                name: "Preventivi");

            migrationBuilder.DropTable(
                name: "Clienti");
        }
    }
}

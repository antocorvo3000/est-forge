using EstForge.Data.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace EstForge.Core.Services;

public class PdfGeneratorService : IPdfGeneratorService
{
    public PdfGeneratorService()
    {
        // Configura QuestPDF per uso commerciale (richiede licenza)
        // Per uso non commerciale: QuestPDF.Settings.License = LicenseType.Community;
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<byte[]> GeneratePreventivoAsync(Preventivo preventivo, List<RigaPreventivo> righe, Azienda azienda)
    {
        return await Task.Run(() =>
        {
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(40);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial"));

                    page.Header().Element(c => ComposeHeader(c, preventivo, azienda));
                    page.Content().Element(c => ComposeContent(c, preventivo, righe, azienda));
                    page.Footer().Element(c => ComposeFooter(c, azienda));
                });
            });

            return document.GeneratePdf();
        });
    }

    public async Task<string> GenerateAndSavePreventivoAsync(Preventivo preventivo, List<RigaPreventivo> righe, Azienda azienda, string outputPath)
    {
        var pdfBytes = await GeneratePreventivoAsync(preventivo, righe, azienda);
        await File.WriteAllBytesAsync(outputPath, pdfBytes);
        return outputPath;
    }

    private void ComposeHeader(IContainer container, Preventivo preventivo, Azienda azienda)
    {
        container.Column(column =>
        {
            // Logo e dati azienda
            column.Item().Row(row =>
            {
                // Logo (se presente)
                if (!string.IsNullOrWhiteSpace(azienda.LogoUrl))
                {
                    row.ConstantItem(80).Column(logoColumn =>
                    {
                        // TODO: Caricare logo da URL/file
                        logoColumn.Item()
                            .Height(60)
                            .Border(1)
                            .BorderColor(Colors.Grey.Lighten2)
                            .AlignCenter()
                            .AlignMiddle()
                            .Text("LOGO")
                            .FontSize(8)
                            .FontColor(Colors.Grey.Medium);
                    });

                    row.RelativeItem().PaddingLeft(10);
                }

                // Dati azienda
                row.RelativeItem().Column(companyColumn =>
                {
                    companyColumn.Item().Text(azienda.RagioneSociale)
                        .FontSize(14)
                        .Bold()
                        .FontColor(Colors.Blue.Darken2);

                    companyColumn.Item().PaddingTop(5).Text(text =>
                    {
                        text.Span($"P.IVA: {azienda.PartitaIva}").FontSize(9);
                        text.Span(" | ");
                        text.Span(azienda.SedeLegale).FontSize(9);
                    });

                    companyColumn.Item().Text(text =>
                    {
                        text.Span($"Tel: {azienda.Telefono}").FontSize(9);
                        text.Span(" | ");
                        text.Span($"Email: {azienda.Email}").FontSize(9);
                    });
                });
            });

            column.Item().PaddingTop(15).LineHorizontal(2).LineColor(Colors.Blue.Darken2);

            // Titolo documento
            column.Item().PaddingTop(15).AlignCenter().Text($"PREVENTIVO N. {preventivo.Numero}/{preventivo.Anno}")
                .FontSize(16)
                .Bold()
                .FontColor(Colors.Blue.Darken2);

            // Dati cliente
            if (preventivo.Cliente != null)
            {
                column.Item().PaddingTop(15).Column(clientColumn =>
                {
                    clientColumn.Item().Text("Spett.le").FontSize(9).Italic();
                    clientColumn.Item().Text(preventivo.Cliente.NomeRagioneSociale).FontSize(11).Bold();

                    if (!string.IsNullOrWhiteSpace(preventivo.Cliente.CodiceFiscalePIva))
                        clientColumn.Item().Text($"CF/P.IVA: {preventivo.Cliente.CodiceFiscalePIva}").FontSize(9);

                    if (!string.IsNullOrWhiteSpace(preventivo.Cliente.Via))
                    {
                        var indirizzo = preventivo.Cliente.Via;
                        if (!string.IsNullOrWhiteSpace(preventivo.Cliente.Cap) ||
                            !string.IsNullOrWhiteSpace(preventivo.Cliente.Citta))
                        {
                            indirizzo += $", {preventivo.Cliente.Cap} {preventivo.Cliente.Citta}";
                            if (!string.IsNullOrWhiteSpace(preventivo.Cliente.Provincia))
                                indirizzo += $" ({preventivo.Cliente.Provincia})";
                        }
                        clientColumn.Item().Text(indirizzo).FontSize(9);
                    }
                });
            }

            // Oggetto e ubicazione
            column.Item().PaddingTop(10).Column(infoColumn =>
            {
                if (!string.IsNullOrWhiteSpace(preventivo.Oggetto))
                {
                    infoColumn.Item().Text(text =>
                    {
                        text.Span("Oggetto: ").Bold();
                        text.Span(preventivo.Oggetto);
                    }).FontSize(10);
                }

                if (!string.IsNullOrWhiteSpace(preventivo.UbicazioneVia) ||
                    !string.IsNullOrWhiteSpace(preventivo.UbicazioneCitta))
                {
                    var ubicazione = preventivo.UbicazioneVia ?? "";
                    if (!string.IsNullOrWhiteSpace(preventivo.UbicazioneCitta))
                    {
                        if (!string.IsNullOrWhiteSpace(ubicazione))
                            ubicazione += ", ";
                        ubicazione += $"{preventivo.UbicazioneCap} {preventivo.UbicazioneCitta}";
                        if (!string.IsNullOrWhiteSpace(preventivo.UbicazioneProvincia))
                            ubicazione += $" ({preventivo.UbicazioneProvincia})";
                    }

                    infoColumn.Item().Text(text =>
                    {
                        text.Span("Ubicazione lavori: ").Bold();
                        text.Span(ubicazione);
                    }).FontSize(10);
                }
            });

            column.Item().PaddingTop(10).LineHorizontal(1).LineColor(Colors.Grey.Medium);
        });
    }

    private void ComposeContent(IContainer container, Preventivo preventivo, List<RigaPreventivo> righe, Azienda azienda)
    {
        container.PaddingTop(10).Column(column =>
        {
            // Tabella righe
            column.Item().Table(table =>
            {
                // Definizione colonne
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(30);  // Nr
                    columns.RelativeColumn(4);    // Descrizione
                    columns.ConstantColumn(50);   // U.M.
                    columns.ConstantColumn(60);   // Quantità
                    columns.ConstantColumn(70);   // Prezzo
                    columns.ConstantColumn(80);   // Totale
                });

                // Header tabella
                table.Header(header =>
                {
                    header.Cell().Element(CellStyle).AlignCenter().Text("Nr").Bold();
                    header.Cell().Element(CellStyle).Text("Descrizione").Bold();
                    header.Cell().Element(CellStyle).AlignCenter().Text("U.M.").Bold();
                    header.Cell().Element(CellStyle).AlignRight().Text("Quantità").Bold();
                    header.Cell().Element(CellStyle).AlignRight().Text("Prezzo €").Bold();
                    header.Cell().Element(CellStyle).AlignRight().Text("Totale €").Bold();

                    static IContainer CellStyle(IContainer container)
                    {
                        return container
                            .Background(Colors.Blue.Darken2)
                            .Padding(5)
                            .DefaultTextStyle(x => x.FontColor(Colors.White).FontSize(9));
                    }
                });

                // Righe
                foreach (var riga in righe.OrderBy(r => r.NumeroRiga))
                {
                    table.Cell().Element(CellDataStyle).AlignCenter().Text(riga.NumeroRiga.ToString());
                    table.Cell().Element(CellDataStyle).Text(riga.Descrizione).FontSize(9);
                    table.Cell().Element(CellDataStyle).AlignCenter().Text(riga.UnitaMisura);
                    table.Cell().Element(CellDataStyle).AlignRight().Text(FormatNumber(riga.Quantita));
                    table.Cell().Element(CellDataStyle).AlignRight().Text(FormatCurrency(riga.PrezzoUnitario));
                    table.Cell().Element(CellDataStyle).AlignRight().Text(FormatCurrency(riga.Totale)).Bold();
                }

                static IContainer CellDataStyle(IContainer container)
                {
                    return container
                        .BorderBottom(1)
                        .BorderColor(Colors.Grey.Lighten2)
                        .Padding(5)
                        .DefaultTextStyle(x => x.FontSize(9));
                }
            });

            // Totali
            column.Item().PaddingTop(10).AlignRight().Column(totalsColumn =>
            {
                totalsColumn.Item().Row(row =>
                {
                    row.ConstantItem(150).Text("Subtotale:").Bold();
                    row.ConstantItem(100).AlignRight().Text(FormatCurrency(preventivo.Subtotale)).Bold();
                });

                if (preventivo.ScontoPercentuale > 0 || preventivo.ScontoValore > 0)
                {
                    totalsColumn.Item().Row(row =>
                    {
                        var scontoText = preventivo.ScontoPercentuale > 0
                            ? $"Sconto ({preventivo.ScontoPercentuale}%):"
                            : "Sconto:";
                        row.ConstantItem(150).Text(scontoText);
                        row.ConstantItem(100).AlignRight().Text($"- {FormatCurrency(preventivo.ScontoValore)}");
                    });
                }

                totalsColumn.Item().PaddingTop(5).LineHorizontal(1).LineColor(Colors.Grey.Medium);

                totalsColumn.Item().PaddingTop(5).Row(row =>
                {
                    row.ConstantItem(150).Text("TOTALE:").Bold().FontSize(12).FontColor(Colors.Blue.Darken2);
                    row.ConstantItem(100).AlignRight().Text(FormatCurrency(preventivo.Totale))
                        .Bold().FontSize(12).FontColor(Colors.Blue.Darken2);
                });
            });

            // Note e modalità pagamento
            column.Item().PaddingTop(15).Column(notesColumn =>
            {
                if (!string.IsNullOrWhiteSpace(preventivo.ModalitaPagamento))
                {
                    notesColumn.Item().Text(text =>
                    {
                        text.Span("Modalità di pagamento: ").Bold();
                        text.Span(preventivo.ModalitaPagamento);
                    }).FontSize(9);
                }

                if (!string.IsNullOrWhiteSpace(preventivo.Note))
                {
                    notesColumn.Item().PaddingTop(10).Column(noteSection =>
                    {
                        noteSection.Item().Text("Note:").Bold().FontSize(9);
                        noteSection.Item().PaddingTop(3).Text(preventivo.Note).FontSize(9);
                    });
                }
            });
        });
    }

    private void ComposeFooter(IContainer container, Azienda azienda)
    {
        container.AlignCenter().Column(column =>
        {
            column.Item().PaddingTop(5).LineHorizontal(1).LineColor(Colors.Grey.Medium);
            column.Item().PaddingTop(5).Text(text =>
            {
                text.Span($"{azienda.RagioneSociale} | ");
                text.Span($"P.IVA {azienda.PartitaIva} | ");
                text.Span($"{azienda.Email}");
            }).FontSize(8).FontColor(Colors.Grey.Darken1);

            column.Item().Text(text =>
            {
                text.CurrentPageNumber();
                text.Span(" / ");
                text.TotalPages();
            }).FontSize(8).FontColor(Colors.Grey.Darken1);
        });
    }

    private static string FormatCurrency(decimal value)
    {
        return value.ToString("N2", new System.Globalization.CultureInfo("it-IT"));
    }

    private static string FormatNumber(decimal value)
    {
        return value.ToString("N2", new System.Globalization.CultureInfo("it-IT"));
    }
}

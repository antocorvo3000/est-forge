using EstForge.Data.Context;
using EstForge.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace EstForge.Core.Services;

/// <summary>
/// Servizio per popolare il database con dati di esempio per testing
/// </summary>
public class DatabaseSeedService : IDatabaseSeedService
{
    private readonly IDbContextFactory<EstForgeDbContext> _contextFactory;

    public DatabaseSeedService(IDbContextFactory<EstForgeDbContext> contextFactory)
    {
        _contextFactory = contextFactory;
    }

    public async Task<bool> IsDatabaseSeededAsync()
    {
        using var context = await _contextFactory.CreateDbContextAsync();

        // Controlla se esistono già preventivi (Azienda e Clienti sono già seed nel DbContext)
        var hasPreventivi = await context.Preventivi.AnyAsync();
        return hasPreventivi;
    }

    public async Task SeedDatabaseAsync()
    {
        using var context = await _contextFactory.CreateDbContextAsync();

        // Se già popolato con preventivi, non fare nulla
        if (await context.Preventivi.AnyAsync())
        {
            return;
        }

        // Usa i clienti già presenti dal seed del DbContext
        var clienti = await context.Clienti.OrderBy(c => c.CreatoIl).Take(5).ToListAsync();

        if (clienti.Count < 5)
        {
            // Se non ci sono abbastanza clienti, non fare nulla (il seed del DbContext deve essere già applicato)
            return;
        }

        // Crea preventivi di esempio usando i clienti esistenti
        var anno = DateTime.Now.Year;
        var preventivi = new List<Preventivo>
        {
            new Preventivo
            {
                Numero = 1,
                Anno = anno,
                ClienteId = clienti[0].Id,
                Oggetto = "Sviluppo Applicazione Web E-Commerce",
                UbicazioneVia = "Via Milano 45",
                UbicazioneCitta = "Milano",
                UbicazioneProvincia = "MI",
                UbicazioneCap = "20100",
                Subtotale = 25000m,
                ScontoPercentuale = 10m,
                ScontoValore = 2500m,
                Totale = 22500m,
                Note = "Sviluppo completo piattaforma e-commerce con gestione prodotti, carrello e pagamenti",
                ModalitaPagamento = "30% anticipo, saldo a 60 giorni",
                Stato = "bozza",
                CreatoIl = DateTime.UtcNow.AddDays(-15),
                AggiornatoIl = DateTime.UtcNow.AddDays(-15)
            },
            new Preventivo
            {
                Numero = 2,
                Anno = anno,
                ClienteId = clienti[1].Id,
                Oggetto = "Consulenza IT e Sicurezza Informatica",
                UbicazioneVia = "Corso Italia 78",
                UbicazioneCitta = "Torino",
                UbicazioneProvincia = "TO",
                UbicazioneCap = "10100",
                Subtotale = 8500m,
                ScontoPercentuale = 5m,
                ScontoValore = 425m,
                Totale = 8075m,
                Note = "Audit sicurezza rete aziendale e implementazione policy",
                ModalitaPagamento = "Bonifico bancario a 30 giorni",
                Stato = "inviato",
                CreatoIl = DateTime.UtcNow.AddDays(-10),
                AggiornatoIl = DateTime.UtcNow.AddDays(-8)
            },
            new Preventivo
            {
                Numero = 3,
                Anno = anno,
                ClienteId = clienti[2].Id,
                Oggetto = "Sistema Gestione Magazzino con Barcode",
                UbicazioneVia = "Viale Europa 200",
                UbicazioneCitta = "Bologna",
                UbicazioneProvincia = "BO",
                UbicazioneCap = "40100",
                Subtotale = 18000m,
                ScontoPercentuale = 0m,
                ScontoValore = 0m,
                Totale = 18000m,
                Note = "Software gestionale con lettura barcode e tracking inventario in tempo reale",
                ModalitaPagamento = "50% anticipo, 50% a consegna",
                Stato = "approvato",
                CreatoIl = DateTime.UtcNow.AddDays(-7),
                AggiornatoIl = DateTime.UtcNow.AddDays(-5)
            },
            new Preventivo
            {
                Numero = 4,
                Anno = anno,
                ClienteId = clienti[3].Id,
                Oggetto = "App Mobile iOS/Android per Monitoraggio Energia",
                UbicazioneVia = "Via Nazionale 15",
                UbicazioneCitta = "Firenze",
                UbicazioneProvincia = "FI",
                UbicazioneCap = "50100",
                Subtotale = 32000m,
                ScontoPercentuale = 15m,
                ScontoValore = 4800m,
                Totale = 27200m,
                Note = "Sviluppo app multipiattaforma con dashboard analytics consumi energetici",
                ModalitaPagamento = "40% anticipo, 30% milestone, 30% rilascio",
                Stato = "bozza",
                CreatoIl = DateTime.UtcNow.AddDays(-3),
                AggiornatoIl = DateTime.UtcNow.AddDays(-2)
            },
            new Preventivo
            {
                Numero = 5,
                Anno = anno,
                ClienteId = clienti[4].Id,
                Oggetto = "Campagna SEO e Content Marketing 12 mesi",
                UbicazioneVia = "Piazza Garibaldi 8",
                UbicazioneCitta = "Napoli",
                UbicazioneProvincia = "NA",
                UbicazioneCap = "80100",
                Subtotale = 15600m,
                ScontoPercentuale = 0m,
                ScontoValore = 0m,
                Totale = 15600m,
                Note = "Piano annuale SEO con 24 articoli blog e ottimizzazione mensile",
                ModalitaPagamento = "Canone mensile €1.300",
                Stato = "rifiutato",
                CreatoIl = DateTime.UtcNow.AddDays(-20),
                AggiornatoIl = DateTime.UtcNow.AddDays(-18)
            }
        };

        context.Preventivi.AddRange(preventivi);
        await context.SaveChangesAsync();

        // 4. Crea righe preventivi
        var righe = new List<RigaPreventivo>
        {
            // Preventivo 1 - E-Commerce
            new RigaPreventivo { PreventivoId = preventivi[0].Id, NumeroRiga = 1, Descrizione = "Analisi requisiti e progettazione UX/UI", UnitaMisura = "ore", Quantita = 40, PrezzoUnitario = 80, Totale = 3200, CreatoIl = DateTime.UtcNow },
            new RigaPreventivo { PreventivoId = preventivi[0].Id, NumeroRiga = 2, Descrizione = "Sviluppo frontend React con Next.js", UnitaMisura = "ore", Quantita = 120, PrezzoUnitario = 85, Totale = 10200, CreatoIl = DateTime.UtcNow },
            new RigaPreventivo { PreventivoId = preventivi[0].Id, NumeroRiga = 3, Descrizione = "Sviluppo backend API Node.js", UnitaMisura = "ore", Quantita = 80, PrezzoUnitario = 90, Totale = 7200, CreatoIl = DateTime.UtcNow },
            new RigaPreventivo { PreventivoId = preventivi[0].Id, NumeroRiga = 4, Descrizione = "Integrazione gateway pagamento Stripe", UnitaMisura = "ore", Quantita = 24, PrezzoUnitario = 95, Totale = 2280, CreatoIl = DateTime.UtcNow },
            new RigaPreventivo { PreventivoId = preventivi[0].Id, NumeroRiga = 5, Descrizione = "Testing e deployment produzione", UnitaMisura = "ore", Quantita = 20, PrezzoUnitario = 75, Totale = 1500, CreatoIl = DateTime.UtcNow },

            // Preventivo 2 - Consulenza IT
            new RigaPreventivo { PreventivoId = preventivi[1].Id, NumeroRiga = 1, Descrizione = "Audit sicurezza infrastruttura di rete", UnitaMisura = "giorni", Quantita = 3, PrezzoUnitario = 850, Totale = 2550, CreatoIl = DateTime.UtcNow },
            new RigaPreventivo { PreventivoId = preventivi[1].Id, NumeroRiga = 2, Descrizione = "Penetration testing applicazioni web", UnitaMisura = "giorni", Quantita = 2, PrezzoUnitario = 950, Totale = 1900, CreatoIl = DateTime.UtcNow },
            new RigaPreventivo { PreventivoId = preventivi[1].Id, NumeroRiga = 3, Descrizione = "Stesura policy sicurezza e procedure", UnitaMisura = "giorni", Quantita = 2, PrezzoUnitario = 700, Totale = 1400, CreatoIl = DateTime.UtcNow },
            new RigaPreventivo { PreventivoId = preventivi[1].Id, NumeroRiga = 4, Descrizione = "Formazione team IT (8 persone)", UnitaMisura = "giornata", Quantita = 1, PrezzoUnitario = 1200, Totale = 1200, CreatoIl = DateTime.UtcNow },

            // Preventivo 3 - Gestione Magazzino
            new RigaPreventivo { PreventivoId = preventivi[2].Id, NumeroRiga = 1, Descrizione = "Analisi processi e requisiti magazzino", UnitaMisura = "giorni", Quantita = 5, PrezzoUnitario = 750, Totale = 3750, CreatoIl = DateTime.UtcNow },
            new RigaPreventivo { PreventivoId = preventivi[2].Id, NumeroRiga = 2, Descrizione = "Sviluppo software gestione inventario", UnitaMisura = "ore", Quantita = 100, PrezzoUnitario = 85, Totale = 8500, CreatoIl = DateTime.UtcNow },
            new RigaPreventivo { PreventivoId = preventivi[2].Id, NumeroRiga = 3, Descrizione = "Integrazione scanner barcode", UnitaMisura = "ore", Quantita = 30, PrezzoUnitario = 90, Totale = 2700, CreatoIl = DateTime.UtcNow },
            new RigaPreventivo { PreventivoId = preventivi[2].Id, NumeroRiga = 4, Descrizione = "Formazione personale e documentazione", UnitaMisura = "giorni", Quantita = 2, PrezzoUnitario = 650, Totale = 1300, CreatoIl = DateTime.UtcNow },

            // Preventivo 4 - App Mobile
            new RigaPreventivo { PreventivoId = preventivi[3].Id, NumeroRiga = 1, Descrizione = "Progettazione UI/UX multipiattaforma", UnitaMisura = "ore", Quantita = 60, PrezzoUnitario = 80, Totale = 4800, CreatoIl = DateTime.UtcNow },
            new RigaPreventivo { PreventivoId = preventivi[3].Id, NumeroRiga = 2, Descrizione = "Sviluppo app React Native", UnitaMisura = "ore", Quantita = 200, PrezzoUnitario = 90, Totale = 18000, CreatoIl = DateTime.UtcNow },
            new RigaPreventivo { PreventivoId = preventivi[3].Id, NumeroRiga = 3, Descrizione = "Backend API e database real-time", UnitaMisura = "ore", Quantita = 80, PrezzoUnitario = 95, Totale = 7600, CreatoIl = DateTime.UtcNow },
            new RigaPreventivo { PreventivoId = preventivi[3].Id, NumeroRiga = 4, Descrizione = "Testing iOS e Android", UnitaMisura = "ore", Quantita = 40, PrezzoUnitario = 70, Totale = 2800, CreatoIl = DateTime.UtcNow },

            // Preventivo 5 - SEO Marketing
            new RigaPreventivo { PreventivoId = preventivi[4].Id, NumeroRiga = 1, Descrizione = "Audit SEO iniziale e strategia", UnitaMisura = "forfait", Quantita = 1, PrezzoUnitario = 1800, Totale = 1800, CreatoIl = DateTime.UtcNow },
            new RigaPreventivo { PreventivoId = preventivi[4].Id, NumeroRiga = 2, Descrizione = "Produzione contenuti blog (24 articoli)", UnitaMisura = "articoli", Quantita = 24, PrezzoUnitario = 350, Totale = 8400, CreatoIl = DateTime.UtcNow },
            new RigaPreventivo { PreventivoId = preventivi[4].Id, NumeroRiga = 3, Descrizione = "Ottimizzazione on-page mensile", UnitaMisura = "mesi", Quantita = 12, PrezzoUnitario = 300, Totale = 3600, CreatoIl = DateTime.UtcNow },
            new RigaPreventivo { PreventivoId = preventivi[4].Id, NumeroRiga = 4, Descrizione = "Report analytics e monitoraggio", UnitaMisura = "mesi", Quantita = 12, PrezzoUnitario = 150, Totale = 1800, CreatoIl = DateTime.UtcNow },
        };

        context.RighePreventivo.AddRange(righe);
        await context.SaveChangesAsync();
    }
}

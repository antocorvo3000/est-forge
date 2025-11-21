using EstForge.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace EstForge.Data.Context;

public class EstForgeDbContext : DbContext
{
    public EstForgeDbContext(DbContextOptions<EstForgeDbContext> options) : base(options)
    {
    }

    public DbSet<Azienda> Aziende { get; set; }
    public DbSet<Cliente> Clienti { get; set; }
    public DbSet<Preventivo> Preventivi { get; set; }
    public DbSet<RigaPreventivo> RighePreventivo { get; set; }
    public DbSet<PreventivoCache> PreventiviCache { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configurazione Azienda
        modelBuilder.Entity<Azienda>(entity =>
        {
            entity.HasIndex(e => e.RagioneSociale);
        });

        // Configurazione Cliente
        modelBuilder.Entity<Cliente>(entity =>
        {
            entity.HasIndex(e => e.NomeRagioneSociale);
            entity.HasIndex(e => e.CodiceFiscalePIva);
        });

        // Configurazione Preventivo
        modelBuilder.Entity<Preventivo>(entity =>
        {
            // Unique constraint su numero+anno
            entity.HasIndex(e => new { e.Numero, e.Anno }).IsUnique();

            // Indici per performance
            entity.HasIndex(e => e.ClienteId);
            entity.HasIndex(e => e.Anno);
            entity.HasIndex(e => e.Stato);
            entity.HasIndex(e => e.CreatoIl);

            // Relazione con Cliente (SET NULL on delete)
            entity.HasOne(p => p.Cliente)
                .WithMany(c => c.Preventivi)
                .HasForeignKey(p => p.ClienteId)
                .OnDelete(DeleteBehavior.SetNull);

            // Relazione con Righe (CASCADE on delete)
            entity.HasMany(p => p.Righe)
                .WithOne(r => r.Preventivo)
                .HasForeignKey(r => r.PreventivoId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configurazione RigaPreventivo
        modelBuilder.Entity<RigaPreventivo>(entity =>
        {
            entity.HasIndex(e => e.PreventivoId);
            entity.HasIndex(e => new { e.PreventivoId, e.NumeroRiga });
        });

        // Configurazione PreventivoCache
        modelBuilder.Entity<PreventivoCache>(entity =>
        {
            entity.HasIndex(e => e.AggiornatoIl);
            entity.HasIndex(e => e.TipoOperazione);
            entity.HasIndex(e => e.PreventivoOriginaleId);
        });

        // Seed data per Azienda
        modelBuilder.Entity<Azienda>().HasData(
            new Azienda
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                RagioneSociale = "ZetaForge S.r.l.",
                PartitaIva = "01234567890",
                SedeLegale = "Via Roma 1, Milano (MI)",
                Telefono = "+39 02 123456",
                Email = "info@zetaforge.it",
                CreatoIl = DateTime.UtcNow,
                AggiornatoIl = DateTime.UtcNow
            }
        );

        // Seed data per Clienti di esempio
        var clienti = new[]
        {
            new Cliente
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222221"),
                NomeRagioneSociale = "Rossi Mario",
                CodiceFiscalePIva = "RSSMRA80A01F205X",
                Via = "Via Garibaldi 15",
                Citta = "Milano",
                Provincia = "MI",
                Cap = "20100",
                Telefono = "+39 333 1234567",
                Email = "mario.rossi@example.com",
                CreatoIl = DateTime.UtcNow,
                AggiornatoIl = DateTime.UtcNow
            },
            new Cliente
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                NomeRagioneSociale = "Bianchi S.r.l.",
                CodiceFiscalePIva = "12345678901",
                Via = "Corso Italia 42",
                Citta = "Roma",
                Provincia = "RM",
                Cap = "00100",
                Telefono = "+39 06 9876543",
                Email = "info@bianchi.it",
                CreatoIl = DateTime.UtcNow,
                AggiornatoIl = DateTime.UtcNow
            },
            new Cliente
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222223"),
                NomeRagioneSociale = "Verdi Costruzioni",
                CodiceFiscalePIva = "98765432109",
                Via = "Via Dante 88",
                Citta = "Torino",
                Provincia = "TO",
                Cap = "10100",
                Telefono = "+39 011 5554444",
                Email = "verdi@costruzioni.it",
                CreatoIl = DateTime.UtcNow,
                AggiornatoIl = DateTime.UtcNow
            },
            new Cliente
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222224"),
                NomeRagioneSociale = "Neri & Associati",
                CodiceFiscalePIva = "55566677788",
                Via = "Piazza San Marco 1",
                Citta = "Venezia",
                Provincia = "VE",
                Cap = "30100",
                Telefono = "+39 041 2223344",
                Email = "neri@associati.com",
                CreatoIl = DateTime.UtcNow,
                AggiornatoIl = DateTime.UtcNow
            },
            new Cliente
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222225"),
                NomeRagioneSociale = "Gialli Impianti",
                CodiceFiscalePIva = "11122233344",
                Via = "Via Mazzini 7",
                Citta = "Firenze",
                Provincia = "FI",
                Cap = "50100",
                Telefono = "+39 055 7778899",
                Email = "gialli@impianti.it",
                CreatoIl = DateTime.UtcNow,
                AggiornatoIl = DateTime.UtcNow
            }
        };

        modelBuilder.Entity<Cliente>().HasData(clienti);
    }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Modified);

        foreach (var entry in entries)
        {
            if (entry.Entity is Azienda azienda)
                azienda.AggiornatoIl = DateTime.UtcNow;
            else if (entry.Entity is Cliente cliente)
                cliente.AggiornatoIl = DateTime.UtcNow;
            else if (entry.Entity is Preventivo preventivo)
                preventivo.AggiornatoIl = DateTime.UtcNow;
            else if (entry.Entity is PreventivoCache cache)
                cache.AggiornatoIl = DateTime.UtcNow;
        }
    }
}

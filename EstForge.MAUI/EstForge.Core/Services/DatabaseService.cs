using EstForge.Data.Context;
using EstForge.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace EstForge.Core.Services;

public class DatabaseService : IDatabaseService
{
    private readonly IDbContextFactory<EstForgeDbContext> _contextFactory;

    public DatabaseService(IDbContextFactory<EstForgeDbContext> contextFactory)
    {
        _contextFactory = contextFactory;
    }

    #region Azienda

    public async Task<Azienda?> GetAziendaAsync()
    {
        using var context = await _contextFactory.CreateDbContextAsync();
        return await context.Aziende.FirstOrDefaultAsync();
    }

    public async Task<bool> UpdateAziendaAsync(Azienda azienda)
    {
        try
        {
            using var context = await _contextFactory.CreateDbContextAsync();
            context.Aziende.Update(azienda);
            await context.SaveChangesAsync();
            return true;
        }
        catch
        {
            return false;
        }
    }

    #endregion

    #region Clienti

    public async Task<List<Cliente>> GetAllClientiAsync()
    {
        using var context = await _contextFactory.CreateDbContextAsync();
        return await context.Clienti
            .OrderBy(c => c.NomeRagioneSociale)
            .ToListAsync();
    }

    public async Task<Cliente?> GetClienteByIdAsync(Guid id)
    {
        using var context = await _contextFactory.CreateDbContextAsync();
        return await context.Clienti.FindAsync(id);
    }

    public async Task<Cliente> CreateClienteAsync(Cliente cliente)
    {
        using var context = await _contextFactory.CreateDbContextAsync();
        context.Clienti.Add(cliente);
        await context.SaveChangesAsync();
        return cliente;
    }

    public async Task<bool> UpdateClienteAsync(Cliente cliente)
    {
        try
        {
            using var context = await _contextFactory.CreateDbContextAsync();
            context.Clienti.Update(cliente);
            await context.SaveChangesAsync();
            return true;
        }
        catch
        {
            return false;
        }
    }

    public async Task<bool> DeleteClienteAsync(Guid id)
    {
        try
        {
            using var context = await _contextFactory.CreateDbContextAsync();
            var cliente = await context.Clienti.FindAsync(id);
            if (cliente == null) return false;

            context.Clienti.Remove(cliente);
            await context.SaveChangesAsync();
            return true;
        }
        catch
        {
            return false;
        }
    }

    public async Task<List<Cliente>> SearchClientiAsync(string searchTerm)
    {
        using var context = await _contextFactory.CreateDbContextAsync();
        var term = searchTerm.ToLower();
        return await context.Clienti
            .Where(c => c.NomeRagioneSociale.ToLower().Contains(term) ||
                       (c.CodiceFiscalePIva != null && c.CodiceFiscalePIva.ToLower().Contains(term)) ||
                       (c.Email != null && c.Email.ToLower().Contains(term)))
            .OrderBy(c => c.NomeRagioneSociale)
            .ToListAsync();
    }

    #endregion

    #region Preventivi

    public async Task<List<Preventivo>> GetAllPreventiviAsync(int? anno = null)
    {
        using var context = await _contextFactory.CreateDbContextAsync();
        var query = context.Preventivi
            .Include(p => p.Cliente)
            .AsQueryable();

        if (anno.HasValue)
            query = query.Where(p => p.Anno == anno.Value);

        return await query
            .OrderByDescending(p => p.Anno)
            .ThenByDescending(p => p.Numero)
            .ToListAsync();
    }

    public async Task<Preventivo?> GetPreventivoByIdAsync(Guid id)
    {
        using var context = await _contextFactory.CreateDbContextAsync();
        return await context.Preventivi
            .Include(p => p.Cliente)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<Preventivo?> GetPreventivoWithDetailsAsync(Guid id)
    {
        using var context = await _contextFactory.CreateDbContextAsync();
        return await context.Preventivi
            .Include(p => p.Cliente)
            .Include(p => p.Righe.OrderBy(r => r.NumeroRiga))
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<Preventivo> CreatePreventivoAsync(Preventivo preventivo, List<RigaPreventivo> righe)
    {
        using var context = await _contextFactory.CreateDbContextAsync();

        // Aggiungi preventivo
        context.Preventivi.Add(preventivo);

        // Aggiungi righe
        foreach (var riga in righe)
        {
            riga.PreventivoId = preventivo.Id;
            context.RighePreventivo.Add(riga);
        }

        await context.SaveChangesAsync();
        return preventivo;
    }

    public async Task<bool> UpdatePreventivoAsync(Preventivo preventivo, List<RigaPreventivo> righe)
    {
        try
        {
            using var context = await _contextFactory.CreateDbContextAsync();

            // Aggiorna preventivo
            context.Preventivi.Update(preventivo);

            // Rimuovi vecchie righe
            var oldRighe = await context.RighePreventivo
                .Where(r => r.PreventivoId == preventivo.Id)
                .ToListAsync();
            context.RighePreventivo.RemoveRange(oldRighe);

            // Aggiungi nuove righe
            foreach (var riga in righe)
            {
                riga.PreventivoId = preventivo.Id;
                riga.Id = Guid.NewGuid(); // Nuovi ID per le righe
                context.RighePreventivo.Add(riga);
            }

            await context.SaveChangesAsync();
            return true;
        }
        catch
        {
            return false;
        }
    }

    public async Task<bool> DeletePreventivoAsync(Guid id)
    {
        try
        {
            using var context = await _contextFactory.CreateDbContextAsync();
            var preventivo = await context.Preventivi.FindAsync(id);
            if (preventivo == null) return false;

            context.Preventivi.Remove(preventivo);
            await context.SaveChangesAsync();
            return true;
        }
        catch
        {
            return false;
        }
    }

    public async Task<int> GetNextNumeroAsync(int anno)
    {
        using var context = await _contextFactory.CreateDbContextAsync();
        var maxNumero = await context.Preventivi
            .Where(p => p.Anno == anno)
            .MaxAsync(p => (int?)p.Numero) ?? 0;
        return maxNumero + 1;
    }

    public async Task<bool> ExistsNumeroAsync(int numero, int anno, Guid? excludeId = null)
    {
        using var context = await _contextFactory.CreateDbContextAsync();
        var query = context.Preventivi
            .Where(p => p.Numero == numero && p.Anno == anno);

        if (excludeId.HasValue)
            query = query.Where(p => p.Id != excludeId.Value);

        return await query.AnyAsync();
    }

    public async Task<List<Preventivo>> SearchPreventiviAsync(string searchTerm)
    {
        using var context = await _contextFactory.CreateDbContextAsync();
        var term = searchTerm.ToLower();
        return await context.Preventivi
            .Include(p => p.Cliente)
            .Where(p => p.Numero.ToString().Contains(term) ||
                       (p.Oggetto != null && p.Oggetto.ToLower().Contains(term)) ||
                       (p.Cliente != null && p.Cliente.NomeRagioneSociale.ToLower().Contains(term)))
            .OrderByDescending(p => p.Anno)
            .ThenByDescending(p => p.Numero)
            .ToListAsync();
    }

    #endregion

    #region Righe Preventivo

    public async Task<List<RigaPreventivo>> GetRighePreventivoAsync(Guid preventivoId)
    {
        using var context = await _contextFactory.CreateDbContextAsync();
        return await context.RighePreventivo
            .Where(r => r.PreventivoId == preventivoId)
            .OrderBy(r => r.NumeroRiga)
            .ToListAsync();
    }

    #endregion

    #region Cache Preventivi

    public async Task<PreventivoCache?> GetCacheByIdAsync(Guid id)
    {
        using var context = await _contextFactory.CreateDbContextAsync();
        return await context.PreventiviCache.FindAsync(id);
    }

    public async Task<List<PreventivoCache>> GetAllCacheAsync()
    {
        using var context = await _contextFactory.CreateDbContextAsync();
        return await context.PreventiviCache
            .OrderByDescending(c => c.AggiornatoIl)
            .ToListAsync();
    }

    public async Task<PreventivoCache> SaveCacheAsync(PreventivoCache cache)
    {
        using var context = await _contextFactory.CreateDbContextAsync();

        var existing = await context.PreventiviCache.FindAsync(cache.Id);
        if (existing != null)
        {
            context.Entry(existing).CurrentValues.SetValues(cache);
        }
        else
        {
            context.PreventiviCache.Add(cache);
        }

        await context.SaveChangesAsync();
        return cache;
    }

    public async Task<bool> DeleteCacheAsync(Guid id)
    {
        try
        {
            using var context = await _contextFactory.CreateDbContextAsync();
            var cache = await context.PreventiviCache.FindAsync(id);
            if (cache == null) return false;

            context.PreventiviCache.Remove(cache);
            await context.SaveChangesAsync();
            return true;
        }
        catch
        {
            return false;
        }
    }

    public async Task<bool> ClearOldCacheAsync(int daysOld = 7)
    {
        try
        {
            using var context = await _contextFactory.CreateDbContextAsync();
            var cutoffDate = DateTime.UtcNow.AddDays(-daysOld);
            var oldCache = await context.PreventiviCache
                .Where(c => c.AggiornatoIl < cutoffDate)
                .ToListAsync();

            context.PreventiviCache.RemoveRange(oldCache);
            await context.SaveChangesAsync();
            return true;
        }
        catch
        {
            return false;
        }
    }

    #endregion

    #region Utility

    public async Task<bool> TestConnectionAsync()
    {
        try
        {
            using var context = await _contextFactory.CreateDbContextAsync();
            return await context.Database.CanConnectAsync();
        }
        catch
        {
            return false;
        }
    }

    public async Task InitializeDatabaseAsync()
    {
        using var context = await _contextFactory.CreateDbContextAsync();
        await context.Database.MigrateAsync();
    }

    #endregion
}

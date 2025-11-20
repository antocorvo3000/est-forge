using EstForge.Data.Models;

namespace EstForge.Core.Services;

public interface IDatabaseService
{
    // Azienda
    Task<Azienda?> GetAziendaAsync();
    Task<bool> UpdateAziendaAsync(Azienda azienda);

    // Clienti
    Task<List<Cliente>> GetAllClientiAsync();
    Task<Cliente?> GetClienteByIdAsync(Guid id);
    Task<Cliente> CreateClienteAsync(Cliente cliente);
    Task<bool> UpdateClienteAsync(Cliente cliente);
    Task<bool> DeleteClienteAsync(Guid id);
    Task<List<Cliente>> SearchClientiAsync(string searchTerm);

    // Preventivi
    Task<List<Preventivo>> GetAllPreventiviAsync(int? anno = null);
    Task<Preventivo?> GetPreventivoByIdAsync(Guid id);
    Task<Preventivo?> GetPreventivoWithDetailsAsync(Guid id);
    Task<Preventivo> CreatePreventivoAsync(Preventivo preventivo, List<RigaPreventivo> righe);
    Task<bool> UpdatePreventivoAsync(Preventivo preventivo, List<RigaPreventivo> righe);
    Task<bool> DeletePreventivoAsync(Guid id);
    Task<int> GetNextNumeroAsync(int anno);
    Task<bool> ExistsNumeroAsync(int numero, int anno, Guid? excludeId = null);
    Task<List<Preventivo>> SearchPreventiviAsync(string searchTerm);

    // Righe Preventivo
    Task<List<RigaPreventivo>> GetRighePreventivoAsync(Guid preventivoId);

    // Cache Preventivi
    Task<PreventivoCache?> GetCacheByIdAsync(Guid id);
    Task<List<PreventivoCache>> GetAllCacheAsync();
    Task<PreventivoCache> SaveCacheAsync(PreventivoCache cache);
    Task<bool> DeleteCacheAsync(Guid id);
    Task<bool> ClearOldCacheAsync(int daysOld = 7);

    // Utility
    Task<bool> TestConnectionAsync();
    Task InitializeDatabaseAsync();
}

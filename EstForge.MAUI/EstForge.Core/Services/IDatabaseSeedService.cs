namespace EstForge.Core.Services;

/// <summary>
/// Servizio per popolare il database con dati di esempio
/// </summary>
public interface IDatabaseSeedService
{
    /// <summary>
    /// Popola il database con dati di test
    /// </summary>
    Task SeedDatabaseAsync();

    /// <summary>
    /// Verifica se il database è già popolato
    /// </summary>
    Task<bool> IsDatabaseSeededAsync();
}

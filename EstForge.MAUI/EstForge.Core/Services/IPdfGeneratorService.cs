using EstForge.Data.Models;

namespace EstForge.Core.Services;

public interface IPdfGeneratorService
{
    /// <summary>
    /// Genera PDF del preventivo
    /// </summary>
    Task<byte[]> GeneratePreventivoAsync(Preventivo preventivo, List<RigaPreventivo> righe, Azienda azienda);

    /// <summary>
    /// Genera e salva PDF su disco
    /// </summary>
    Task<string> GenerateAndSavePreventivoAsync(Preventivo preventivo, List<RigaPreventivo> righe, Azienda azienda, string outputPath);
}

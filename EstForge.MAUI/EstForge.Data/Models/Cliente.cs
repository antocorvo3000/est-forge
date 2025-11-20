using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EstForge.Data.Models;

/// <summary>
/// Anagrafica clienti
/// </summary>
[Table("Clienti")]
public class Cliente
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(500)]
    public string NomeRagioneSociale { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? CodiceFiscalePIva { get; set; }

    [MaxLength(500)]
    public string? Via { get; set; }

    [MaxLength(200)]
    public string? Citta { get; set; }

    [MaxLength(10)]
    public string? Provincia { get; set; }

    [MaxLength(10)]
    public string? Cap { get; set; }

    [MaxLength(50)]
    public string? Telefono { get; set; }

    [MaxLength(200)]
    public string? Email { get; set; }

    public DateTime CreatoIl { get; set; } = DateTime.UtcNow;

    public DateTime AggiornatoIl { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<Preventivo> Preventivi { get; set; } = new List<Preventivo>();
}

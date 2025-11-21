using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EstForge.Data.Models;

/// <summary>
/// Dati aziendali e configurazione
/// </summary>
[Table("Azienda")]
public class Azienda
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(500)]
    public string RagioneSociale { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string PartitaIva { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string SedeLegale { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Telefono { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? LogoUrl { get; set; }

    public int NumeroProgressivoIniziale { get; set; } = 1;

    public bool NumerazioneProgressivaAttiva { get; set; } = false;

    [Column(TypeName = "decimal(3,2)")]
    public decimal FontSizeList { get; set; } = 1.00m;

    [Column(TypeName = "decimal(3,2)")]
    public decimal FontSizeQuote { get; set; } = 1.00m;

    [Column(TypeName = "decimal(3,2)")]
    public decimal FontSizeClient { get; set; } = 1.00m;

    [Column(TypeName = "decimal(3,2)")]
    public decimal FontSizeSettings { get; set; } = 1.00m;

    [Column(TypeName = "decimal(3,2)")]
    public decimal FontSizeCustomQuote { get; set; } = 1.00m;

    [Column(TypeName = "decimal(3,2)")]
    public decimal FontSizeClone { get; set; } = 1.00m;

    [Column(TypeName = "decimal(3,2)")]
    public decimal FontSizeEditNumber { get; set; } = 1.00m;

    public DateTime CreatoIl { get; set; } = DateTime.UtcNow;

    public DateTime AggiornatoIl { get; set; } = DateTime.UtcNow;
}

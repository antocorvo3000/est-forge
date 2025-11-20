using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EstForge.Data.Models;

/// <summary>
/// Preventivo (testata)
/// </summary>
[Table("Preventivi")]
public class Preventivo
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public int Numero { get; set; }

    [Required]
    public int Anno { get; set; }

    public Guid? ClienteId { get; set; }

    [MaxLength(1000)]
    public string? Oggetto { get; set; }

    [MaxLength(500)]
    public string? UbicazioneVia { get; set; }

    [MaxLength(200)]
    public string? UbicazioneCitta { get; set; }

    [MaxLength(10)]
    public string? UbicazioneProvincia { get; set; }

    [MaxLength(10)]
    public string? UbicazioneCap { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal Subtotale { get; set; } = 0;

    [Column(TypeName = "decimal(5,2)")]
    public decimal ScontoPercentuale { get; set; } = 0;

    [Column(TypeName = "decimal(10,2)")]
    public decimal ScontoValore { get; set; } = 0;

    [Column(TypeName = "decimal(10,2)")]
    public decimal Totale { get; set; } = 0;

    public string? Note { get; set; }

    [MaxLength(200)]
    public string? ModalitaPagamento { get; set; }

    [MaxLength(50)]
    public string Stato { get; set; } = "bozza";

    public DateTime CreatoIl { get; set; } = DateTime.UtcNow;

    public DateTime AggiornatoIl { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(ClienteId))]
    public virtual Cliente? Cliente { get; set; }

    public virtual ICollection<RigaPreventivo> Righe { get; set; } = new List<RigaPreventivo>();
}

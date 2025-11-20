using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EstForge.Data.Models;

/// <summary>
/// Riga di dettaglio del preventivo
/// </summary>
[Table("RighePreventivo")]
public class RigaPreventivo
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid PreventivoId { get; set; }

    [Required]
    public int NumeroRiga { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Descrizione { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string UnitaMisura { get; set; } = string.Empty;

    [Required]
    [Column(TypeName = "decimal(10,2)")]
    public decimal Quantita { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(10,2)")]
    public decimal PrezzoUnitario { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(10,2)")]
    public decimal Totale { get; set; } = 0;

    public DateTime CreatoIl { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(PreventivoId))]
    public virtual Preventivo? Preventivo { get; set; }
}

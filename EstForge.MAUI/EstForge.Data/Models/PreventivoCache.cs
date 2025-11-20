using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EstForge.Data.Models;

/// <summary>
/// Cache per auto-salvataggio preventivi in corso
/// </summary>
[Table("PreventiviCache")]
public class PreventivoCache
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public int? Numero { get; set; }

    public int? Anno { get; set; }

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

    [Required]
    [MaxLength(50)]
    public string TipoOperazione { get; set; } = string.Empty; // 'creazione', 'modifica', 'clonazione'

    public Guid? PreventivoOriginaleId { get; set; }

    // JSON serialized data
    public string? RigheJson { get; set; } // Righe del preventivo in formato JSON

    public string? DatiClienteJson { get; set; } // Dati del cliente in formato JSON

    public DateTime CreatoIl { get; set; } = DateTime.UtcNow;

    public DateTime AggiornatoIl { get; set; } = DateTime.UtcNow;
}

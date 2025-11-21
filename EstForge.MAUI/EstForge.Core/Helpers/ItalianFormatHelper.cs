using System.Globalization;

namespace EstForge.Core.Helpers;

/// <summary>
/// Helper per formattazione italiana di numeri e date
/// </summary>
public static class ItalianFormatHelper
{
    private static readonly CultureInfo ItalianCulture = new("it-IT");

    /// <summary>
    /// Formatta un numero decimale in formato italiano (es: 1.234,56)
    /// </summary>
    public static string FormatNumber(decimal value, int decimals = 2)
    {
        return value.ToString($"N{decimals}", ItalianCulture);
    }

    /// <summary>
    /// Formatta un valore monetario in formato italiano (es: € 1.234,56)
    /// </summary>
    public static string FormatCurrency(decimal value)
    {
        return value.ToString("C2", ItalianCulture);
    }

    /// <summary>
    /// Formatta una data in formato italiano (es: 20/11/2025)
    /// </summary>
    public static string FormatDate(DateTime date)
    {
        return date.ToString("dd/MM/yyyy", ItalianCulture);
    }

    /// <summary>
    /// Formatta data e ora in formato italiano (es: 20/11/2025 14:30)
    /// </summary>
    public static string FormatDateTime(DateTime dateTime)
    {
        return dateTime.ToString("dd/MM/yyyy HH:mm", ItalianCulture);
    }

    /// <summary>
    /// Converte una stringa in formato italiano in decimal
    /// </summary>
    public static decimal? ParseDecimal(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        // Prova prima con la cultura italiana
        if (decimal.TryParse(value, NumberStyles.Any, ItalianCulture, out var result))
            return result;

        // Fallback con cultura invariante
        if (decimal.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out result))
            return result;

        return null;
    }

    /// <summary>
    /// Converte una stringa in formato italiano in int
    /// </summary>
    public static int? ParseInt(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        if (int.TryParse(value, NumberStyles.Any, ItalianCulture, out var result))
            return result;

        return null;
    }

    /// <summary>
    /// Unità di misura comuni in italiano
    /// </summary>
    public static readonly List<string> UnitaMisuraComuni = new()
    {
        "pz",           // pezzi
        "mq",           // metri quadri
        "ml",           // metri lineari
        "m",            // metri
        "cm",           // centimetri
        "kg",           // kilogrammi
        "g",            // grammi
        "l",            // litri
        "h",            // ore
        "gg",           // giorni
        "a corpo",      // a corpo
        "cadauno",      // cadauno
        "t",            // tonnellate
        "mc",           // metri cubi
    };

    /// <summary>
    /// Modalità di pagamento comuni
    /// </summary>
    public static readonly List<string> ModalitaPagamentoComuni = new()
    {
        "Bonifico bancario",
        "Assegno",
        "Contanti",
        "RiBa",
        "Carta di credito",
        "PayPal",
        "50% acconto - 50% saldo",
        "30% acconto - 70% saldo",
        "Da concordare"
    };

    /// <summary>
    /// Valida una Partita IVA italiana (11 cifre)
    /// </summary>
    public static bool ValidatePartitaIva(string partitaIva)
    {
        if (string.IsNullOrWhiteSpace(partitaIva))
            return false;

        // Rimuovi spazi
        partitaIva = partitaIva.Replace(" ", "");

        // Deve essere di 11 cifre
        if (partitaIva.Length != 11)
            return false;

        // Devono essere tutte cifre
        return partitaIva.All(char.IsDigit);
    }

    /// <summary>
    /// Valida un Codice Fiscale italiano
    /// </summary>
    public static bool ValidateCodiceFiscale(string codiceFiscale)
    {
        if (string.IsNullOrWhiteSpace(codiceFiscale))
            return false;

        // Rimuovi spazi e converti in maiuscolo
        codiceFiscale = codiceFiscale.Replace(" ", "").ToUpper();

        // Deve essere di 16 caratteri
        if (codiceFiscale.Length != 16)
            return false;

        // Validazione base: 6 lettere, 2 cifre, 1 lettera, 2 cifre, 1 lettera, 3 cifre, 1 lettera
        var pattern = @"^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$";
        return System.Text.RegularExpressions.Regex.IsMatch(codiceFiscale, pattern);
    }

    /// <summary>
    /// Valida un CAP italiano (5 cifre)
    /// </summary>
    public static bool ValidateCap(string cap)
    {
        if (string.IsNullOrWhiteSpace(cap))
            return false;

        cap = cap.Replace(" ", "");

        return cap.Length == 5 && cap.All(char.IsDigit);
    }
}

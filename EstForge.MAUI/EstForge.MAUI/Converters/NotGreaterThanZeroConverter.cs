using System.Globalization;

namespace EstForge.MAUI.Converters;

/// <summary>
/// Restituisce true se il valore è 0 o negativo
/// </summary>
public class NotGreaterThanZeroConverter : IValueConverter
{
    public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is int intValue)
        {
            return intValue <= 0;
        }
        return true;
    }

    public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

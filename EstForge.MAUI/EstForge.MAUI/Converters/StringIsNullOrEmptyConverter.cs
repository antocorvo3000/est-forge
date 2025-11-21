using System.Globalization;

namespace EstForge.MAUI.Converters;

/// <summary>
/// Restituisce true se la stringa è null o vuota
/// </summary>
public class StringIsNullOrEmptyConverter : IValueConverter
{
    public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is string str)
        {
            return string.IsNullOrEmpty(str);
        }
        return true; // Se non è una stringa, considera come vuota
    }

    public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

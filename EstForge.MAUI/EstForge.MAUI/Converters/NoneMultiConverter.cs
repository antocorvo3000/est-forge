using System.Globalization;

namespace EstForge.MAUI.Converters;

/// <summary>
/// Restituisce true se NESSUNO dei valori booleani è true
/// </summary>
public class NoneMultiConverter : IMultiValueConverter
{
    public object? Convert(object?[] values, Type targetType, object? parameter, CultureInfo culture)
    {
        if (values == null || values.Length == 0)
            return true;

        foreach (var value in values)
        {
            if (value is bool boolValue && boolValue)
            {
                return false;
            }
        }

        return true;
    }

    public object?[] ConvertBack(object? value, Type[] targetTypes, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

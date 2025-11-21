using System.Globalization;

namespace EstForge.MAUI.Converters;

public class GuidEqualsMultiConverter : IMultiValueConverter
{
    public object? Convert(object?[] values, Type targetType, object? parameter, CultureInfo culture)
    {
        if (values == null || values.Length != 2)
            return false;

        // Check if first value is null or Guid
        if (values[0] == null)
            return false;

        if (values[0] is Guid infoQuoteId && values[1] is Guid quoteId)
        {
            return infoQuoteId == quoteId;
        }

        return false;
    }

    public object?[] ConvertBack(object? value, Type[] targetTypes, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

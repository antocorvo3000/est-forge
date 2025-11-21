using System.Globalization;

namespace EstForge.MAUI.Converters;

public class GuidEqualsConverter : IValueConverter
{
    public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is Guid valueGuid && parameter is Guid paramGuid)
        {
            return valueGuid == paramGuid;
        }
        return false;
    }

    public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

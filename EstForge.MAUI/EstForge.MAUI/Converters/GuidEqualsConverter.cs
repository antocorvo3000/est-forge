using System.Globalization;

namespace EstForge.MAUI.Converters;

public class GuidEqualsConverter : IValueConverter
{
    public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is Guid? nullableGuid && parameter is Guid paramGuid)
        {
            return nullableGuid.HasValue && nullableGuid.Value == paramGuid;
        }
        return false;
    }

    public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

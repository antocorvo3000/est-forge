using System.Globalization;

namespace EstForge.MAUI.Converters;

public class GuidEqualsMultiConverter : IMultiValueConverter
{
    public object? Convert(object?[] values, Type targetType, object? parameter, CultureInfo culture)
    {
        if (values == null || values.Length != 2)
            return false;

        if (values[0] is Guid? nullableGuid && values[1] is Guid guid)
        {
            return nullableGuid.HasValue && nullableGuid.Value == guid;
        }

        return false;
    }

    public object?[] ConvertBack(object? value, Type[] targetTypes, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

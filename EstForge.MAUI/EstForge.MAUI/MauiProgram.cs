using EstForge.Core.Services;
using EstForge.Core.ViewModels;
using EstForge.Data.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using CommunityToolkit.Maui;

namespace EstForge.MAUI;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .UseMauiCommunityToolkit()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
            });

        // Database Configuration
        var connectionString = GetConnectionString();
        builder.Services.AddDbContextFactory<EstForgeDbContext>(options =>
            options.UseSqlite(connectionString));

        // Services
        builder.Services.AddSingleton<IDatabaseService, DatabaseService>();
        builder.Services.AddSingleton<IDatabaseSeedService, DatabaseSeedService>();
        builder.Services.AddSingleton<IPdfGeneratorService, PdfGeneratorService>();

        // ViewModels
        builder.Services.AddTransient<MainViewModel>();
        builder.Services.AddTransient<CreateQuoteViewModel>();
        builder.Services.AddTransient<SettingsViewModel>();

        // Pages
        builder.Services.AddTransient<MainPage>();
        builder.Services.AddTransient<Views.CreateQuotePage>();
        builder.Services.AddTransient<Views.SettingsPage>();

#if DEBUG
        builder.Logging.AddDebug();
#endif

        return builder.Build();
    }

    private static string GetConnectionString()
    {
        // SQLite funziona su tutte le piattaforme senza installazioni
        var dbPath = Path.Combine(FileSystem.AppDataDirectory, "estforge.db");
        return $"Data Source={dbPath}";
    }
}

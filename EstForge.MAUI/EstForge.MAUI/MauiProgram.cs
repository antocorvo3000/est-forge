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
            options.UseSqlServer(connectionString));

        // Services
        builder.Services.AddSingleton<IDatabaseService, DatabaseService>();
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

        var app = builder.Build();

        // Initialize database
        InitializeDatabase(app.Services);

        return app;
    }

    private static string GetConnectionString()
    {
        // Per Windows: SQL Server LocalDB
        if (DeviceInfo.Platform == DevicePlatform.WinUI)
        {
            return @"Server=(localdb)\mssqllocaldb;Database=EstForgeDb;Trusted_Connection=True;MultipleActiveResultSets=true";
        }

        // Per Android/iOS: SQLite come fallback (richiede conversione)
        // Oppure connessione remota a SQL Server
        var dbPath = Path.Combine(FileSystem.AppDataDirectory, "estforge.db");
        return $"Data Source={dbPath}";
    }

    private static void InitializeDatabase(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var dbService = scope.ServiceProvider.GetRequiredService<IDatabaseService>();

        try
        {
            dbService.InitializeDatabaseAsync().GetAwaiter().GetResult();
        }
        catch (Exception ex)
        {
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<App>>();
            logger.LogError(ex, "Errore durante l'inizializzazione del database");
        }
    }
}

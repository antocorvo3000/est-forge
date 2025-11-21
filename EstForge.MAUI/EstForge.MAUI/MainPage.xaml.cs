using EstForge.Core.ViewModels;
using EstForge.Core.Services;

namespace EstForge.MAUI;

public partial class MainPage : ContentPage
{
    private readonly MainViewModel _viewModel;
    private readonly IDatabaseService _databaseService;
    private readonly IDatabaseSeedService _seedService;
    private bool _databaseInitialized = false;

    public MainPage(MainViewModel viewModel, IDatabaseService databaseService, IDatabaseSeedService seedService)
    {
        InitializeComponent();
        _viewModel = viewModel;
        _databaseService = databaseService;
        _seedService = seedService;
        BindingContext = _viewModel;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();

        if (!_databaseInitialized)
        {
            try
            {
                // Tenta di inizializzare il database
                await _databaseService.InitializeDatabaseAsync();
                _databaseInitialized = true;

                // Popola con dati di esempio se il database è vuoto
                if (!await _seedService.IsDatabaseSeededAsync())
                {
                    await _seedService.SeedDatabaseAsync();
                }

                // Carica i dati solo se il database è stato inizializzato
                await _viewModel.InitializeAsync();
            }
            catch (Exception ex)
            {
                // Mostra un messaggio di errore chiaro all'utente
                await DisplayAlert(
                    "Errore Database",
                    $"Impossibile inizializzare il database SQLite.\n\n" +
                    $"Dettagli: {ex.Message}\n\n" +
                    $"Il database verrà creato al percorso:\n" +
                    $"{Path.Combine(FileSystem.AppDataDirectory, "estforge.db")}",
                    "OK");
            }
        }
        else
        {
            await _viewModel.InitializeAsync();
        }
    }

    // Handler per chiudere info panel quando il mouse esce dalla riga
    private void OnQuoteItemPointerExited(object? sender, PointerEventArgs e)
    {
        _viewModel.InfoQuoteId = null;
    }
}

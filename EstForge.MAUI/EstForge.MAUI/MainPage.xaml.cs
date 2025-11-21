using EstForge.Core.ViewModels;
using EstForge.Core.Services;

namespace EstForge.MAUI;

public partial class MainPage : ContentPage
{
    private readonly MainViewModel _viewModel;
    private readonly IDatabaseService _databaseService;
    private bool _databaseInitialized = false;

    public MainPage(MainViewModel viewModel, IDatabaseService databaseService)
    {
        InitializeComponent();
        _viewModel = viewModel;
        _databaseService = databaseService;
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

                // Carica i dati solo se il database è stato inizializzato
                await _viewModel.InitializeAsync();
            }
            catch (Exception ex)
            {
                // Mostra un messaggio di errore chiaro all'utente
                await DisplayAlert(
                    "Errore Database",
                    $"Impossibile connettersi al database SQL Server LocalDB.\n\n" +
                    $"Dettagli: {ex.Message}\n\n" +
                    $"SOLUZIONE:\n" +
                    $"1. Apri Visual Studio Installer\n" +
                    $"2. Clicca 'Modifica' su Visual Studio 2022\n" +
                    $"3. Vai alla scheda 'Singoli componenti'\n" +
                    $"4. Cerca 'SQL Server Express LocalDB'\n" +
                    $"5. Spunta la casella e clicca 'Modifica'\n\n" +
                    $"Oppure scarica SQL Server Express da:\n" +
                    $"https://go.microsoft.com/fwlink/?linkid=866658",
                    "OK");
            }
        }
        else
        {
            await _viewModel.InitializeAsync();
        }
    }
}

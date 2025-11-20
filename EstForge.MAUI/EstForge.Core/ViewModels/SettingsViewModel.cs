using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using EstForge.Core.Services;
using EstForge.Data.Models;

namespace EstForge.Core.ViewModels;

public partial class SettingsViewModel : BaseViewModel
{
    private readonly IDatabaseService _databaseService;

    [ObservableProperty]
    private Azienda? _azienda;

    [ObservableProperty]
    private string _ragioneSociale = string.Empty;

    [ObservableProperty]
    private string _partitaIva = string.Empty;

    [ObservableProperty]
    private string _sedeLegale = string.Empty;

    [ObservableProperty]
    private string _telefono = string.Empty;

    [ObservableProperty]
    private string _email = string.Empty;

    [ObservableProperty]
    private string? _logoUrl;

    [ObservableProperty]
    private int _numeroProgressivoIniziale = 1;

    [ObservableProperty]
    private bool _numerazioneProgressivaAttiva;

    [ObservableProperty]
    private decimal _fontSizeList = 1.00m;

    [ObservableProperty]
    private decimal _fontSizeQuote = 1.00m;

    [ObservableProperty]
    private decimal _fontSizeClient = 1.00m;

    [ObservableProperty]
    private decimal _fontSizeSettings = 1.00m;

    [ObservableProperty]
    private decimal _fontSizeCustomQuote = 1.00m;

    [ObservableProperty]
    private decimal _fontSizeClone = 1.00m;

    [ObservableProperty]
    private decimal _fontSizeEditNumber = 1.00m;

    [ObservableProperty]
    private bool _isSaved;

    public SettingsViewModel(IDatabaseService databaseService)
    {
        _databaseService = databaseService;
        Title = "Impostazioni Azienda";
    }

    [RelayCommand]
    private async Task LoadAziendaAsync()
    {
        try
        {
            IsBusy = true;
            ErrorMessage = string.Empty;

            Azienda = await _databaseService.GetAziendaAsync();

            if (Azienda != null)
            {
                RagioneSociale = Azienda.RagioneSociale;
                PartitaIva = Azienda.PartitaIva;
                SedeLegale = Azienda.SedeLegale;
                Telefono = Azienda.Telefono;
                Email = Azienda.Email;
                LogoUrl = Azienda.LogoUrl;
                NumeroProgressivoIniziale = Azienda.NumeroProgressivoIniziale;
                NumerazioneProgressivaAttiva = Azienda.NumerazioneProgressivaAttiva;
                FontSizeList = Azienda.FontSizeList;
                FontSizeQuote = Azienda.FontSizeQuote;
                FontSizeClient = Azienda.FontSizeClient;
                FontSizeSettings = Azienda.FontSizeSettings;
                FontSizeCustomQuote = Azienda.FontSizeCustomQuote;
                FontSizeClone = Azienda.FontSizeClone;
                FontSizeEditNumber = Azienda.FontSizeEditNumber;
            }
            else
            {
                // Crea azienda di default se non esiste
                Azienda = new Azienda
                {
                    RagioneSociale = "ZetaForge S.r.l.",
                    PartitaIva = "01234567890",
                    SedeLegale = "Via Roma 1, Milano (MI)",
                    Telefono = "+39 02 123456",
                    Email = "info@zetaforge.it"
                };
            }
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Errore: {ex.Message}";
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    private async Task SaveAsync()
    {
        if (IsBusy) return;

        try
        {
            IsBusy = true;
            ErrorMessage = string.Empty;
            IsSaved = false;

            // Validazione
            if (string.IsNullOrWhiteSpace(RagioneSociale))
            {
                ErrorMessage = "Ragione sociale obbligatoria";
                return;
            }

            if (string.IsNullOrWhiteSpace(PartitaIva))
            {
                ErrorMessage = "Partita IVA obbligatoria";
                return;
            }

            // Aggiorna modello
            if (Azienda != null)
            {
                Azienda.RagioneSociale = RagioneSociale;
                Azienda.PartitaIva = PartitaIva;
                Azienda.SedeLegale = SedeLegale;
                Azienda.Telefono = Telefono;
                Azienda.Email = Email;
                Azienda.LogoUrl = LogoUrl;
                Azienda.NumeroProgressivoIniziale = NumeroProgressivoIniziale;
                Azienda.NumerazioneProgressivaAttiva = NumerazioneProgressivaAttiva;
                Azienda.FontSizeList = FontSizeList;
                Azienda.FontSizeQuote = FontSizeQuote;
                Azienda.FontSizeClient = FontSizeClient;
                Azienda.FontSizeSettings = FontSizeSettings;
                Azienda.FontSizeCustomQuote = FontSizeCustomQuote;
                Azienda.FontSizeClone = FontSizeClone;
                Azienda.FontSizeEditNumber = FontSizeEditNumber;

                var success = await _databaseService.UpdateAziendaAsync(Azienda);
                if (success)
                {
                    IsSaved = true;
                }
                else
                {
                    ErrorMessage = "Errore durante il salvataggio";
                }
            }
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Errore: {ex.Message}";
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    private async Task SelectLogoAsync()
    {
        // TODO: Implementare selezione file logo
        // Verrà implementato con FilePicker.PickAsync()
        await Task.CompletedTask;
    }

    [RelayCommand]
    private void RemoveLogo()
    {
        LogoUrl = null;
    }

    public async Task InitializeAsync()
    {
        await LoadAziendaAsync();
    }
}

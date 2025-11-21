using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using EstForge.Core.Services;
using EstForge.Data.Models;

namespace EstForge.Core.ViewModels;

public partial class CreateQuoteViewModel : BaseViewModel
{
    private readonly IDatabaseService _databaseService;

    [ObservableProperty]
    private int _numero;

    [ObservableProperty]
    private int _anno = DateTime.Now.Year;

    [ObservableProperty]
    private string _oggetto = string.Empty;

    [ObservableProperty]
    private string _ubicazioneVia = string.Empty;

    [ObservableProperty]
    private string _ubicazioneCitta = string.Empty;

    [ObservableProperty]
    private string _ubicazioneProvincia = string.Empty;

    [ObservableProperty]
    private string _ubicazioneCap = string.Empty;

    [ObservableProperty]
    private decimal _subtotale;

    [ObservableProperty]
    private decimal _scontoPercentuale;

    [ObservableProperty]
    private decimal _scontoValore;

    [ObservableProperty]
    private decimal _totale;

    [ObservableProperty]
    private string _note = string.Empty;

    [ObservableProperty]
    private string _modalitaPagamento = string.Empty;

    [ObservableProperty]
    private Cliente? _selectedCliente;

    [ObservableProperty]
    private ObservableCollection<Cliente> _clienti = new();

    [ObservableProperty]
    private ObservableCollection<RigaPreventivoViewModel> _righe = new();

    [ObservableProperty]
    private bool _isAutoSaving;

    private System.Timers.Timer? _autoSaveTimer;

    public CreateQuoteViewModel(IDatabaseService databaseService)
    {
        _databaseService = databaseService;
        Title = "Nuovo Preventivo";

        // Aggiungi una riga vuota iniziale
        AddEmptyRow();

        // Setup auto-save timer (ogni 2 secondi)
        _autoSaveTimer = new System.Timers.Timer(2000);
        _autoSaveTimer.Elapsed += async (s, e) => await AutoSaveAsync();
    }

    [RelayCommand]
    private async Task LoadDataAsync()
    {
        try
        {
            IsBusy = true;

            // Carica clienti
            var clienti = await _databaseService.GetAllClientiAsync();
            Clienti.Clear();
            foreach (var cliente in clienti)
            {
                Clienti.Add(cliente);
            }

            // Ottieni prossimo numero
            Numero = await _databaseService.GetNextNumeroAsync(Anno);
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
    private void AddRiga()
    {
        var numeroRiga = Righe.Count + 1;
        var nuovaRiga = new RigaPreventivoViewModel
        {
            NumeroRiga = numeroRiga
        };
        nuovaRiga.PropertyChanged += RigaPropertyChanged;
        Righe.Add(nuovaRiga);
    }

    [RelayCommand]
    private void RemoveRiga(RigaPreventivoViewModel riga)
    {
        Righe.Remove(riga);
        RicalcolaNumeriRiga();
        CalcolaTotali();
    }

    private void RigaPropertyChanged(object? sender, System.ComponentModel.PropertyChangedEventArgs e)
    {
        if (e.PropertyName == nameof(RigaPreventivoViewModel.Totale))
        {
            CalcolaTotali();
        }
    }

    private void AddEmptyRow()
    {
        var riga = new RigaPreventivoViewModel { NumeroRiga = 1 };
        riga.PropertyChanged += RigaPropertyChanged;
        Righe.Add(riga);
    }

    private void RicalcolaNumeriRiga()
    {
        for (int i = 0; i < Righe.Count; i++)
        {
            Righe[i].NumeroRiga = i + 1;
        }
    }

    [RelayCommand]
    private void CalcolaTotali()
    {
        Subtotale = Righe.Sum(r => r.Totale);

        if (ScontoPercentuale > 0)
        {
            ScontoValore = Math.Round(Subtotale * ScontoPercentuale / 100, 2);
        }

        Totale = Subtotale - ScontoValore;
    }

    partial void OnScontoPercentualeChanged(decimal value)
    {
        CalcolaTotali();
    }

    partial void OnScontoValoreChanged(decimal value)
    {
        if (Subtotale > 0 && value != Subtotale * ScontoPercentuale / 100)
        {
            ScontoPercentuale = Math.Round(value * 100 / Subtotale, 2);
        }
        CalcolaTotali();
    }

    [RelayCommand]
    private async Task SaveAsync()
    {
        if (IsBusy) return;

        try
        {
            IsBusy = true;
            ErrorMessage = string.Empty;

            // Validazione
            if (Righe.Count == 0 || Righe.All(r => string.IsNullOrWhiteSpace(r.Descrizione)))
            {
                ErrorMessage = "Aggiungi almeno una riga al preventivo";
                return;
            }

            // Verifica numero univoco
            if (await _databaseService.ExistsNumeroAsync(Numero, Anno))
            {
                ErrorMessage = $"Il numero {Numero}/{Anno} è già in uso";
                return;
            }

            // Crea preventivo
            var preventivo = new Preventivo
            {
                Numero = Numero,
                Anno = Anno,
                ClienteId = SelectedCliente?.Id,
                Oggetto = Oggetto,
                UbicazioneVia = UbicazioneVia,
                UbicazioneCitta = UbicazioneCitta,
                UbicazioneProvincia = UbicazioneProvincia,
                UbicazioneCap = UbicazioneCap,
                Subtotale = Subtotale,
                ScontoPercentuale = ScontoPercentuale,
                ScontoValore = ScontoValore,
                Totale = Totale,
                Note = Note,
                ModalitaPagamento = ModalitaPagamento,
                Stato = "bozza"
            };

            // Crea righe
            var righe = Righe
                .Where(r => !string.IsNullOrWhiteSpace(r.Descrizione))
                .Select(r => new RigaPreventivo
                {
                    NumeroRiga = r.NumeroRiga,
                    Descrizione = r.Descrizione,
                    UnitaMisura = r.UnitaMisura,
                    Quantita = r.Quantita,
                    PrezzoUnitario = r.PrezzoUnitario,
                    Totale = r.Totale
                })
                .ToList();

            await _databaseService.CreatePreventivoAsync(preventivo, righe);

            // Ferma auto-save
            _autoSaveTimer?.Stop();
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Errore durante il salvataggio: {ex.Message}";
        }
        finally
        {
            IsBusy = false;
        }
    }

    private Task AutoSaveAsync()
    {
        if (IsBusy || IsAutoSaving) return Task.CompletedTask;

        try
        {
            IsAutoSaving = true;

            // Implementazione auto-save nella cache
            // TODO: Implementare logica di salvataggio nella cache

        }
        catch
        {
            // Silenzioso per auto-save
        }
        finally
        {
            IsAutoSaving = false;
        }

        return Task.CompletedTask;
    }

    public void StartAutoSave()
    {
        _autoSaveTimer?.Start();
    }

    public void StopAutoSave()
    {
        _autoSaveTimer?.Stop();
    }

    public async Task InitializeAsync()
    {
        await LoadDataAsync();
        StartAutoSave();
    }
}

/// <summary>
/// ViewModel per una singola riga del preventivo
/// </summary>
public partial class RigaPreventivoViewModel : ObservableObject
{
    [ObservableProperty]
    private int _numeroRiga;

    [ObservableProperty]
    private string _descrizione = string.Empty;

    [ObservableProperty]
    private string _unitaMisura = "pz";

    [ObservableProperty]
    private decimal _quantita = 1;

    [ObservableProperty]
    private decimal _prezzoUnitario;

    [ObservableProperty]
    private decimal _totale;

    partial void OnQuantitaChanged(decimal value)
    {
        Totale = Math.Round(Quantita * PrezzoUnitario, 2);
    }

    partial void OnPrezzoUnitarioChanged(decimal value)
    {
        Totale = Math.Round(Quantita * PrezzoUnitario, 2);
    }
}

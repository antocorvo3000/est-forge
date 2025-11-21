using System.Collections.ObjectModel;
using System.Timers;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using EstForge.Core.Services;
using EstForge.Data.Models;

namespace EstForge.Core.ViewModels;

public partial class MainViewModel : BaseViewModel
{
    private readonly IDatabaseService _databaseService;
    private System.Timers.Timer? _searchDebounceTimer;

    [ObservableProperty]
    private ObservableCollection<Preventivo> _preventivi = new();

    [ObservableProperty]
    private ObservableCollection<Preventivo> _filteredPreventivi = new();

    [ObservableProperty]
    private Preventivo? _selectedPreventivo;

    [ObservableProperty]
    private string _searchText = string.Empty;

    [ObservableProperty]
    private int? _filtroAnno;

    [ObservableProperty]
    private bool _isRefreshing;

    [ObservableProperty]
    private bool _hasNoData;

    [ObservableProperty]
    private string _companyName = "EST-FORGE";

    // Modalità selezione multipla
    [ObservableProperty]
    private bool _isSelectionMode;

    [ObservableProperty]
    private ObservableCollection<Guid> _selectedQuoteIds = new();

    [ObservableProperty]
    private int _selectedCount;

    // Info toggle
    [ObservableProperty]
    private Guid? _infoQuoteId;

    public MainViewModel(IDatabaseService databaseService)
    {
        _databaseService = databaseService;
        Title = "Preventivi";

        // Setup debounce timer (150ms come nel React)
        _searchDebounceTimer = new System.Timers.Timer(150);
        _searchDebounceTimer.Elapsed += OnSearchDebounceElapsed;
        _searchDebounceTimer.AutoReset = false;
    }

    partial void OnSearchTextChanged(string value)
    {
        // Restart debounce timer
        _searchDebounceTimer?.Stop();
        _searchDebounceTimer?.Start();
    }

    private async void OnSearchDebounceElapsed(object? sender, ElapsedEventArgs e)
    {
        await MainThread.InvokeOnMainThreadAsync(async () =>
        {
            await FilterPreventiviAsync();
        });
    }

    [RelayCommand]
    private async Task LoadPreventiviAsync()
    {
        if (IsBusy) return;

        try
        {
            IsBusy = true;
            ErrorMessage = string.Empty;

            var preventivi = await _databaseService.GetAllPreventiviAsync(FiltroAnno);

            Preventivi.Clear();
            foreach (var preventivo in preventivi)
            {
                Preventivi.Add(preventivo);
            }

            await FilterPreventiviAsync();
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Errore nel caricamento: {ex.Message}";
        }
        finally
        {
            IsBusy = false;
            IsRefreshing = false;
        }
    }

    private async Task FilterPreventiviAsync()
    {
        await Task.Run(() =>
        {
            var query = SearchText?.ToLower().Trim() ?? "";

            var filtered = string.IsNullOrWhiteSpace(query)
                ? Preventivi.ToList()
                : Preventivi.Where(p =>
                    {
                        var quoteNumber = $"{p.Numero:D2}-{p.Anno}";
                        return (p.Oggetto?.ToLower().Contains(query) ?? false) ||
                               (p.Cliente?.NomeRagioneSociale?.ToLower().Contains(query) ?? false) ||
                               quoteNumber.Contains(query) ||
                               (p.UbicazioneVia?.ToLower().Contains(query) ?? false) ||
                               (p.UbicazioneCitta?.ToLower().Contains(query) ?? false);
                    }).ToList();

            MainThread.BeginInvokeOnMainThread(() =>
            {
                FilteredPreventivi.Clear();
                foreach (var p in filtered)
                {
                    FilteredPreventivi.Add(p);
                }
                HasNoData = FilteredPreventivi.Count == 0;
            });
        });
    }

    [RelayCommand]
    private async Task RefreshAsync()
    {
        IsRefreshing = true;
        await LoadPreventiviAsync();
    }

    [RelayCommand]
    private async Task SearchAsync()
    {
        await FilterPreventiviAsync();
    }

    [RelayCommand]
    private async Task ClearSearchAsync()
    {
        SearchText = string.Empty;
        await FilterPreventiviAsync();
    }

    [RelayCommand]
    private async Task DeletePreventivoAsync(Guid id)
    {
        try
        {
            IsBusy = true;
            var success = await _databaseService.DeletePreventivoAsync(id);
            if (success)
            {
                await LoadPreventiviAsync();
            }
            else
            {
                ErrorMessage = "Errore durante l'eliminazione";
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

    // Modalità selezione multipla
    [RelayCommand]
    private void ToggleSelectionMode()
    {
        IsSelectionMode = !IsSelectionMode;
        if (!IsSelectionMode)
        {
            SelectedQuoteIds.Clear();
            SelectedCount = 0;
        }
    }

    [RelayCommand]
    private void ToggleQuoteSelection(Guid quoteId)
    {
        if (SelectedQuoteIds.Contains(quoteId))
        {
            SelectedQuoteIds.Remove(quoteId);
        }
        else
        {
            SelectedQuoteIds.Add(quoteId);
        }
        SelectedCount = SelectedQuoteIds.Count;
    }

    [RelayCommand]
    private void DeselectAll()
    {
        SelectedQuoteIds.Clear();
        SelectedCount = 0;
        IsSelectionMode = false;
    }

    [RelayCommand]
    private async Task DeleteSelectedAsync()
    {
        if (SelectedQuoteIds.Count == 0) return;

        try
        {
            IsBusy = true;
            var tasks = SelectedQuoteIds.Select(id => _databaseService.DeletePreventivoAsync(id)).ToList();
            await Task.WhenAll(tasks);

            SelectedQuoteIds.Clear();
            SelectedCount = 0;
            IsSelectionMode = false;

            await LoadPreventiviAsync();
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Errore durante l'eliminazione: {ex.Message}";
        }
        finally
        {
            IsBusy = false;
        }
    }

    // Info toggle
    [RelayCommand]
    private void ToggleInfo(Guid quoteId)
    {
        InfoQuoteId = InfoQuoteId == quoteId ? null : quoteId;
    }

    [RelayCommand]
    private void HideInfo()
    {
        InfoQuoteId = null;
    }

    // Navigazione (da implementare con Shell navigation)
    [RelayCommand]
    private async Task NavigateToCreateAsync()
    {
        // TODO: Implementare navigazione
        await Shell.Current.GoToAsync("CreateQuotePage");
    }

    [RelayCommand]
    private async Task NavigateToCustomQuoteAsync()
    {
        // TODO: Implementare navigazione
        await Shell.Current.GoToAsync("CustomQuoteNumberPage");
    }

    [RelayCommand]
    private async Task NavigateToEditQuoteAsync(Preventivo quote)
    {
        // TODO: Implementare navigazione
        await Shell.Current.GoToAsync("ModifyQuotePage", new Dictionary<string, object>
        {
            { "QuoteId", quote.Id }
        });
    }

    [RelayCommand]
    private async Task NavigateToCloneQuoteAsync(Preventivo quote)
    {
        // TODO: Implementare navigazione
        await Shell.Current.GoToAsync("CloneQuotePage", new Dictionary<string, object>
        {
            { "QuoteId", quote.Id }
        });
    }

    [RelayCommand]
    private async Task NavigateToEditQuoteNumberAsync(Preventivo quote)
    {
        // TODO: Implementare navigazione
        await Shell.Current.GoToAsync("EditQuoteNumberPage", new Dictionary<string, object>
        {
            { "QuoteId", quote.Id }
        });
    }

    [RelayCommand]
    private async Task NavigateToRecoverWorkAsync()
    {
        // TODO: Implementare navigazione
        await Shell.Current.GoToAsync("RecoverWorkPage");
    }

    [RelayCommand]
    private async Task NavigateToSettingsAsync()
    {
        // TODO: Implementare navigazione
        await Shell.Current.GoToAsync("SettingsPage");
    }

    [RelayCommand]
    private async Task LoadCompanyInfoAsync()
    {
        var azienda = await _databaseService.GetAziendaAsync();
        if (azienda != null)
        {
            CompanyName = azienda.RagioneSociale;
        }
    }

    public async Task InitializeAsync()
    {
        await LoadCompanyInfoAsync();
        await LoadPreventiviAsync();
    }
}
